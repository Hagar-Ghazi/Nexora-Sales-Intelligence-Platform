import re
from sqlalchemy import create_engine, text
from langsmith import traceable
from app.auth.db_permissions import (
    get_schema_for_role,
    validate_query_permissions,
    inject_row_filters,
    validate_sql_safety
)
from app.llm.router import get_llm
from app.config import get_settings

def get_db_url():
    settings = get_settings()
    # Use the IPv4 connection pooler string that you got from Supabase
    return f"postgresql://postgres.hmsdswtaszpgmzkqiaxe:{settings.SUPABASE_DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

@traceable(name="sql_query_tool")
async def sql_query(question: str, user_id: str, user_role: str) -> str:
    """
    Query the SQL database for numbers, analytics, and records.
    Implements a 4-layer security model.
    """
    # LAYER 1: Get filtered schema
    schema = get_schema_for_role(user_role)
    if not schema:
        return "You do not have permission to access the database."
        
    # Generate SQL using LLM
    llm = get_llm()
    prompt = f"""You are a PostgreSQL expert. Given the user's question, write a SQL query to answer it.
Return ONLY the raw SQL query, no markdown, no explanation.
If the user asks for data (like a specific column) that is NOT present in the provided schema, return EXACTLY the string: PERMISSION_DENIED

DATABASE SCHEMA:
{schema}

QUESTION: {question}
SQL QUERY:"""
    
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    if content == "PERMISSION_DENIED":
        return "Permission Denied: You do not have permission to view the requested data fields."

    # Robustly extract SQL from markdown blocks if the LLM ignores the "no markdown" instruction
    match = re.search(r"```(?:sql)?\n?(.*?)\n?```", content, re.DOTALL | re.IGNORECASE)
    if match:
        generated_sql = match.group(1).strip()
    else:
        generated_sql = content.replace("```sql", "").replace("```", "").strip()
    
    # LAYER 2: Validate SQL Safety
    is_safe, safety_msg = validate_sql_safety(generated_sql)
    if not is_safe:
        return f"This operation is not permitted. I can only read and retrieve data from the database. I cannot insert, update, or delete records. (Reason: {safety_msg})"
        
    # LAYER 3: Check Role Permissions
    is_allowed, perm_msg = validate_query_permissions(generated_sql, user_role)
    if not is_allowed:
        return f"Access Denied: {perm_msg}"
        
    # LAYER 4: Inject Row-Level Security Filters
    secure_sql = inject_row_filters(generated_sql, user_role, user_id)
    
    # Execute Query
    try:
        engine = create_engine(get_db_url())
        with engine.connect() as conn:
            result = conn.execute(text(secure_sql))
            rows = result.fetchall()
            
            if not rows:
                return "The query returned no results."
            
            # Format results
            formatted = "\n".join([str(row) for row in rows])
            return f"Database Results:\n{formatted}"
            
    except Exception as e:
        return f"⚠️ Database connection issue: {str(e)}"