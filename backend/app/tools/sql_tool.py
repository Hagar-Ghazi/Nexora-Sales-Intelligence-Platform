import re
import logging
from sqlalchemy import create_engine, text
from langsmith import traceable

logger = logging.getLogger(__name__)
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
    import urllib.parse
    # Extract project ref from SUPABASE_URL (e.g., https://sewcbgtqkgjeunkmfhuy.supabase.co -> sewcbgtqkgjeunkmfhuy)
    if settings.SUPABASE_URL:
        # Match the subdomain part before .supabase.co
        match = re.search(r"https://([^.]+)\.supabase\.co", settings.SUPABASE_URL)
        if match:
            project_ref = match.group(1)
            encoded_password = urllib.parse.quote_plus(settings.SUPABASE_DB_PASSWORD)
            return f"postgresql://postgres.{project_ref}:{encoded_password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
    
    # Fallback to a hardcoded format if parsing fails (should not happen in prod)
    encoded_password = urllib.parse.quote_plus(settings.SUPABASE_DB_PASSWORD)
    return f"postgresql://postgres.sewcbgtqkgjeunkmfhuy:{encoded_password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

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
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
    except Exception as e:
        try:
            from app.config import get_settings
            from app.llm.router import get_llm as get_llm_internal
            settings = get_settings()
            fallback_llm = get_llm_internal(settings.FALLBACK_LLM)
            response = fallback_llm.invoke(prompt)
            content = response.content.strip()
        except Exception as e_inner:
            return f"Database Execution Error (rate limit): {str(e_inner)}"
    
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
        logger.warning(f"SQL Safety validation failed for query '{generated_sql}': {safety_msg}")
        return f"SQL Error: {safety_msg}"

    # LAYER 3: Check Role Permissions
    is_allowed, perm_msg = validate_query_permissions(generated_sql, user_role)
    if not is_allowed:
        logger.warning(f"SQL Permission check failed for query '{generated_sql}' and role '{user_role}': {perm_msg}")
        return f"Permission Denied: {perm_msg}"
        
    # LAYER 4: Inject Row-Level Security Filters
    secure_sql = inject_row_filters(generated_sql, user_role, user_id)
    logger.info(f"Executing SQL query (Role: {user_role}, UserID: {user_id}): {secure_sql}")
    
    # Execute Query
    try:
        engine = create_engine(get_db_url())
        with engine.connect() as conn:
            result = conn.execute(text(secure_sql))
            rows = result.fetchall()
            
            logger.info(f"Query executed successfully. Returned {len(rows)} rows.")
            if not rows:
                return "The query returned no results."
            
            # Format results with column names for the LLM to understand
            col_names = list(result.keys())
            header = " | ".join(col_names)
            separator = "-" * len(header)
            formatted_rows = []
            for row in rows:
                formatted_rows.append(" | ".join(str(v) if v is not None else "NULL" for v in row))
            
            formatted = f"{header}\n{separator}\n" + "\n".join(formatted_rows)
            return f"Database Results:\n{formatted}"
            
    except Exception as e:
        logger.error(f"Database execution error running query '{secure_sql}': {str(e)}", exc_info=True)
        return f"Database Execution Error: {str(e)}"