ROLE_COLLECTIONS = {
    "sales":   ["collection_public", "collection_sales"],
    "support": ["collection_public", "collection_support"],
    "manager": ["collection_public", "collection_sales", "collection_support", "collection_management"],
    "admin":   ["collection_public", "collection_sales", "collection_support", "collection_management", "collection_admin"],
}

ROLE_TOOLS = {
    "sales": [
        "rag_search",
        "query_rewriter",
    ],
    "support": [
        "rag_search",
        "query_rewriter",
        "summarize_document",
    ],
    "manager": [
        "rag_search",
        "sql_query",
        "analytics_tool",
        "summarize_document",
        "query_rewriter",
    ],
    "admin": [
        "rag_search",
        "sql_query",
        "analytics_tool",
        "summarize_document",
        "query_rewriter",
        "manage_users",
        "manage_documents",
        "view_evaluations",
    ],
}

def has_collection_access(role: str, collection: str) -> bool:
    return collection in ROLE_COLLECTIONS.get(role, [])

def has_tool_access(role: str, tool_name: str) -> bool:
    return tool_name in ROLE_TOOLS.get(role, [])

def get_allowed_collections(role: str) -> list[str]:
    return ROLE_COLLECTIONS.get(role, [])

def get_allowed_tools(role: str) -> list[str]:
    return ROLE_TOOLS.get(role, [])
