from typing import List, Any
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from app.retrieval.embedder import get_embeddings
from app.retrieval.qdrant_store import get_vector_store
from app.retrieval.bm25_retriever import bm25_index_manager
from app.retrieval.reranker import build_reranking_retriever
from app.config import get_settings

class CustomEnsembleRetriever(BaseRetriever):
    retrievers: List[BaseRetriever]
    weights: List[float]
    
    def _get_relevant_documents(self, query: str, *, run_manager: Any = None) -> List[Document]:
        # Fetch documents from all retrievers
        docs_lists = [r.invoke(query) for r in self.retrievers]
        
        # Apply Reciprocal Rank Fusion (RRF)
        rrf_score = {}
        for doc_list, weight in zip(docs_lists, self.weights):
            for rank, doc in enumerate(doc_list, start=1):
                doc_key = doc.page_content
                if doc_key not in rrf_score:
                    rrf_score[doc_key] = {"score": 0.0, "doc": doc}
                # RRF Formula: 1 / (rank + k)
                rrf_score[doc_key]["score"] += weight * (1.0 / (rank + 60))
                
        # Sort documents by their RRF score
        sorted_docs = sorted(rrf_score.values(), key=lambda x: x["score"], reverse=True)
        return [d["doc"] for d in sorted_docs]

def build_hybrid_retriever(collections: List[str], qdrant_url: str):
    """
    Builds the ultimate hybrid search pipeline using a custom RRF implementation 
    to bypass broken LangChain dependency imports.
    """
    embeddings = get_embeddings()
    all_retrievers = []
    
    k_dense = 20
    k_sparse = 20
    
    for collection in collections:
        vector_store = get_vector_store(collection, embeddings, qdrant_url)
        vector_retriever = vector_store.as_retriever(search_kwargs={"k": k_dense})
        all_retrievers.append(vector_retriever)
        
        bm25_retriever = bm25_index_manager.get_bm25_retriever(collection)
        if bm25_retriever:
            bm25_retriever.k = k_sparse
            all_retrievers.append(bm25_retriever)
            
    if not all_retrievers:
        return None
        
    weights = [0.6 if "Qdrant" in str(type(r)) else 0.4 for r in all_retrievers]
    total = sum(weights)
    weights = [w / total for w in weights]
    
    # Use our custom bulletproof implementation!
    ensemble_retriever = CustomEnsembleRetriever(
        retrievers=all_retrievers,
        weights=weights
    )
    
    final_retriever = build_reranking_retriever(ensemble_retriever, top_n=5)
    return final_retriever

async def search(query: str, user_role: str) -> List[dict]:
    """
    Perform hybrid semantic search. Returns empty list gracefully if:
    - Qdrant has no documents indexed yet
    - sentence_transformers model fails to load (no internet in container)
    - Any other retrieval error
    """
    from app.auth.permissions import get_allowed_collections
    from qdrant_client import QdrantClient
    settings = get_settings()
    
    collections = get_allowed_collections(user_role)
    if not collections:
        return []

    # Check if Qdrant actually has any indexed documents before attempting retrieval
    # This avoids loading the heavy sentence_transformers model unnecessarily
    try:
        qdrant_client = QdrantClient(url=settings.QDRANT_URL)
        has_docs = False
        for collection in collections:
            try:
                if qdrant_client.collection_exists(collection):
                    count = qdrant_client.count(collection_name=collection)
                    if count.count > 0:
                        has_docs = True
                        break
            except Exception:
                pass
        
        if not has_docs:
            # No documents indexed yet — skip RAG silently
            return []
    except Exception:
        # Qdrant unreachable — skip RAG silently
        return []
    
    try:
        retriever = build_hybrid_retriever(collections, settings.QDRANT_URL)
        if not retriever:
            return []
            
        docs = retriever.invoke(query)
        
        results = []
        for doc in docs:
            results.append({
                "content": doc.page_content,
                "source": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", 1),
                "score": doc.metadata.get("relevance_score", 0.0) 
            })
            
        return results
    except Exception as e:
        # Gracefully handle sentence_transformers / embedding errors
        import logging
        logging.getLogger(__name__).warning(
            f"RAG retrieval failed (Qdrant/embeddings issue): {e}. Falling back to DB-only mode."
        )
        return []