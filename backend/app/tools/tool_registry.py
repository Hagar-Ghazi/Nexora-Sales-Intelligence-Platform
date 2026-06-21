from app.tools.rag_tool import rag_search
from app.tools.sql_tool import sql_query
from app.tools.summary_tool import summarize_document
from app.tools.analytics_tool import get_analytics

ALL_TOOLS = {
    "rag_search": rag_search,
    "sql_query": sql_query,
    "summarize_document": summarize_document,
    "analytics_tool": get_analytics
}

def get_tools_for_role(role: str) -> list:
    from app.auth.permissions import get_allowed_tools
    allowed = get_allowed_tools(role)
    return [ALL_TOOLS[name] for name in allowed if name in ALL_TOOLS]
