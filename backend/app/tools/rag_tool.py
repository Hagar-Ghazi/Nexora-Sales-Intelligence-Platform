from langchain_core.tools import tool
from langsmith import traceable

@tool
@traceable(name="rag_search_tool")
def rag_search(query: str, role: str) -> str:
    """
    Search the company documents using Hybrid Search (Vector + BM25 + Reranker).
    This only returns information the user's role is allowed to see.
    """
    # In a real implementation, this would import and call the hybrid_search module
    # from app.retrieval.hybrid_search import search
    # return search(query, role)
    
    return f"Mock search results for '{query}' with role '{role}'"
