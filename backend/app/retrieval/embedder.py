from functools import lru_cache
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.config import get_settings

@lru_cache
def get_embeddings():
    """
    Returns a singleton instance of the HuggingFaceEmbeddings model.
    We use 'all-MiniLM-L6-v2' because it's lightweight (runs locally fast), 
    has 384 dimensions (saving RAM/Disk in Qdrant), and provides very good
    semantic quality for English text.
    """
    settings = get_settings()
    return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
