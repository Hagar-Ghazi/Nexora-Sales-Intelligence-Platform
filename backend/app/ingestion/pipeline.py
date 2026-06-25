from langsmith import traceable
from app.ingestion.parser import parse_document
from app.ingestion.chunker import chunk_documents
from app.ingestion.version_tracker import compute_file_hash, is_document_changed, update_document_hash
from app.ingestion.namespace_router import get_target_collections

# Mocks for demonstration
from app.retrieval.qdrant_store import get_vector_store
from app.retrieval.embedder import get_embeddings
from app.retrieval.bm25_retriever import bm25_index_manager


@traceable(name="ingest_document")
def ingest_document(file_path: str, file_type: str, access_roles: list[str], document_type: str, uploaded_by: str, doc_id: str) -> dict:
    """
    The main orchestrator for the document ingestion pipeline.
    """
    # 1. Version tracking (skip if unchanged - requires Supabase)
    # file_hash = compute_file_hash(file_path)
    # supabase = get_supabase_client()
    # if not is_document_changed(file_hash, doc_id, supabase):
    #     return {"status": "skipped", "reason": "unchanged"}
        
    # 2. Parse document
    docs = parse_document(file_path, file_type)
    
    # 3. Chunk text
    chunks = chunk_documents(docs)
    
    # 4. Determine collections
    collections = get_target_collections(access_roles)
    
    # 5. Embed and store in Qdrant
    from app.config import get_settings
    settings = get_settings()
    embeddings = get_embeddings()
    for collection in collections:
        store = get_vector_store(collection, embeddings, settings.QDRANT_URL)
        store.add_documents(chunks)
        
    # 6. Build/Update BM25 index
    for collection in collections:
        bm25_index_manager.build_bm25_index(collection, chunks)
        
    # 7. Update Supabase record (disabled - requires Supabase)
    # update_document_hash(doc_id, file_hash, supabase)
    # supabase.table("documents").update({"chunk_count": len(chunks), "status": "ingested"}).eq("id", doc_id).execute()
    
    return {
        "status": "success",
        "doc_id": doc_id,
        "chunks_created": len(chunks),
        "collections": collections
    }