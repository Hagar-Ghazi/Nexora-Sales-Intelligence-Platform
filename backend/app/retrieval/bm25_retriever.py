from typing import List
from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever

class BM25Index:
    """
    Manages in-memory BM25 indexes per collection.
    BM25 (Best Matching 25) is a sparse, keyword-based retrieval algorithm.
    It complements vector (dense) search by handling exact keyword matches,
    product IDs, and domain-specific acronyms that dense models might struggle with.
    """
    def __init__(self):
        self.indexes = {}

    def build_bm25_index(self, collection_name: str, documents: List[Document]) -> BM25Retriever:
        if not documents:
            return None
        retriever = BM25Retriever.from_documents(documents)
        self.indexes[collection_name] = retriever
        return retriever

    def get_bm25_retriever(self, collection_name: str) -> BM25Retriever:
        return self.indexes.get(collection_name)

# Singleton instance
bm25_index_manager = BM25Index()
