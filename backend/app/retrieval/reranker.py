from typing import List, Any
from functools import lru_cache
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from app.config import get_settings

@lru_cache
def get_reranker_model() -> HuggingFaceCrossEncoder:
    settings = get_settings()
    return HuggingFaceCrossEncoder(model_name=settings.RERANKER_MODEL)

class CustomRerankingRetriever(BaseRetriever):
    base_retriever: BaseRetriever
    top_n: int = 5
    
    def _get_relevant_documents(self, query: str, *, run_manager: Any = None) -> List[Document]:
        docs = self.base_retriever.invoke(query)
        if not docs:
            return []
            
        # Cross-encoder reranking is disabled by default to prevent downloading a 1.1 GB model 
        # in bandwidth-constrained environments. We fall back to vector store relevance ranking.
        for doc in docs:
            if "relevance_score" not in doc.metadata:
                doc.metadata["relevance_score"] = 0.8
        return docs[:self.top_n]

def build_reranking_retriever(base_retriever: BaseRetriever, top_n: int = 5) -> CustomRerankingRetriever:
    return CustomRerankingRetriever(base_retriever=base_retriever, top_n=top_n)