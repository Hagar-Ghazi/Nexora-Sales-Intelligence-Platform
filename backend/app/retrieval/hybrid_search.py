from typing import List
from langchain_core.documents import Document
from langchain.retrievers import EnsembleRetriever
from app.retrieval.embedder import get_embeddings
from app.retrieval.qdrant_store import get_vector_store
from app.retrieval.bm25_retriever import bm25_index_manager
from app.retrieval.reranker import build_reranking_retriever
from app.config import get_settings

def build_hybrid_retriever(collections: List[str], qdrant_url: str):
    """
    Builds the ultimate hybrid search pipeline.
    
    PIPELINE ARCHITECTURE:
    1. Vector Search (Dense): Uses Qdrant with MiniLM embeddings. Good for semantic understanding.
    2. BM25 Search (Sparse): Uses in-memory BM25 index. Good for exact keyword matches.
    3. Ensemble: Combines Vector and BM25 using Reciprocal Rank Fusion (RRF). 
       Weights: 60% Vector, 40% BM25.
    4. Re-ranking: Passes the combined top-K results through a Cross-Encoder (bge-reranker-base)
       to re-score and select the absolute best top 5 chunks.
       
    This solves the "Lost in the Middle" problem and provides enterprise-grade accuracy.
    """
    embeddings = get_embeddings()
    all_retrievers = []
    
    # We fetch a lot of documents initially because the reranker will filter them down
    k_dense = 20
    k_sparse = 20
    
    for collection in collections:
        # 1. Dense Retriever
        vector_store = get_vector_store(collection, embeddings, qdrant_url)
        vector_retriever = vector_store.as_retriever(search_kwargs={"k": k_dense})
        all_retrievers.append(vector_retriever)
        
        # 2. Sparse Retriever
        bm25_retriever = bm25_index_manager.get_bm25_retriever(collection)
        if bm25_retriever:
            bm25_retriever.k = k_sparse
            all_retrievers.append(bm25_retriever)
            
    if not all_retrievers:
        return None
        
    # 3. Ensemble (RRF Fusion)
    # If we have both, we weight them. If we just have vector, we just use vector.
    weights = [0.6 if "Qdrant" in str(type(r)) else 0.4 for r in all_retrievers]
    
    # Normalize weights
    total = sum(weights)
    weights = [w / total for w in weights]
    
    ensemble_retriever = EnsembleRetriever(
        retrievers=all_retrievers,
        weights=weights
    )
    
    # 4. Re-ranking
    final_retriever = build_reranking_retriever(ensemble_retriever, top_n=5)
    return final_retriever

async def search(query: str, user_role: str) -> List[dict]:
    from app.auth.permissions import get_allowed_collections
    settings = get_settings()
    
    collections = get_allowed_collections(user_role)
    if not collections:
        return []
        
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
            "score": doc.metadata.get("relevance_score", 0.0) # Added by reranker
        })
        
    return results
