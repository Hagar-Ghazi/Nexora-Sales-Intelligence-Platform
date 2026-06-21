from langchain_core.tools import tool
from langsmith import traceable

@tool
@traceable(name="summary_tool")
def summarize_document(doc_id: str, query: str) -> str:
    """
    Summarize a specific long document based on the user's query.
    Uses map-reduce summarization to handle long texts.
    """
    return f"Mock summary of document {doc_id} focusing on: {query}"
