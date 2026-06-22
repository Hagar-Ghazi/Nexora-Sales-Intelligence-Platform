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
            
        model = get_reranker_model()
        # Pair the query with each document content
        pairs = [[query, doc.page_content] for doc in docs]
        scores = model.score(pairs)
        
        # Attach the score to the metadata and sort
        scored_docs = []
        for doc, score in zip(docs, scores):
            doc.metadata["relevance_score"] = float(score)
            scored_docs.append((score, doc))
            
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_docs[:self.top_n]]

def build_reranking_retriever(base_retriever: BaseRetriever, top_n: int = 5) -> CustomRerankingRetriever:
    return CustomRerankingRetriever(base_retriever=base_retriever, top_n=top_n)