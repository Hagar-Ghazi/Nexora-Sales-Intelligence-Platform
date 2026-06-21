from functools import lru_cache
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers import ContextualCompressionRetriever
from app.config import get_settings

@lru_cache
def get_reranker() -> CrossEncoderReranker:
    """
    Returns a singleton instance of the CrossEncoderReranker.
    
    Why use a cross-encoder?
    Bi-encoders (like MiniLM) map queries and docs to vectors independently, which is fast but misses 
    nuanced relationships. Cross-encoders process the query and doc TOGETHER through the transformer,
    allowing deep attention between the words. It's much slower, so we only run it on the top-K 
    results retrieved by the bi-encoder/BM25 step.
    """
    settings = get_settings()
    model = HuggingFaceCrossEncoder(model_name=settings.RERANKER_MODEL)
    return CrossEncoderReranker(model=model, top_n=5)

def build_reranking_retriever(base_retriever, top_n: int = 5) -> ContextualCompressionRetriever:
    reranker = get_reranker()
    # If a custom top_n is needed, we could instantiate a new one, but for now we reuse the singleton
    # Note: CrossEncoderReranker's top_n is set at initialization
    return ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=base_retriever
    )
