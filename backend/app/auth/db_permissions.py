import sqlparse
import re

DATABASE_PERMISSIONS = {
    "sales": {
        "allowed_tables": {
            "products": {
                "columns": ["name", "category", "price", "tier", "stock_quantity", "is_active"],
            },
            "sales_records": {
                "columns": ["product_id", "customer_name", "quantity", "unit_price",
                            "total_amount", "region", "status", "sale_date"],
                "row_filter": "sales_rep_id = '{user_id}'",
            },
        },
        "denied_message": "As a Sales representative, you can view product information and your own sales records. For company-wide analytics, please ask your manager.",
    },
    "support": {
        "allowed_tables": {
            "products": {
                "columns": ["name", "category", "price", "tier", "stock_quantity", "is_active"],
            },
        },
        "denied_message": "As a Support agent, you can look up product details. Sales data and analytics are restricted to Managers and Admins.",
    },
    "manager": {
        "allowed_tables": {
            "products": {
                "columns": ["name", "category", "price", "tier", "stock_quantity", "is_active"],
            },
            "sales_records": {
                "columns": ["product_id", "sales_rep_id", "customer_name", "customer_email",
                            "quantity", "unit_price", "total_amount", "region", "status", "sale_date"],
            },
            "users": {
                "columns": ["full_name", "email", "role", "department", "is_active"],
            },
            "feedback": {
                "columns": ["message_id", "user_id", "score", "correction_text", "created_at"],
            },
            "evaluation_scores": {
                "columns": ["message_id", "faithfulness", "answer_relevance",
                            "context_precision", "llm_judge_grade", "evaluated_at"],
            },
            "query_analytics": {
                "columns": "*",
            },
        },
        "denied_message": "As a Manager, you have access to all sales data and team analytics. System configuration is restricted to Admins.",
    },
    "admin": {
        "allowed_tables": {
            "products":          {"columns": "*"},
            "sales_records":     {"columns": "*"},
            "users":             {"columns": "*"},
            "feedback":          {"columns": "*"},
            "evaluation_scores": {"columns": "*"},
            "query_analytics":   {"columns": "*"},
            "documents":         {"columns": "*"},
            "conversations":     {"columns": "*"},
            "messages":          {"columns": "*"},
        },
        "denied_message": "",
    },
}

ALL_TABLE_SCHEMAS = {
    "products": ["id (PRIMARY KEY, UUID)", "name", "category", "price", "tier", "stock_quantity", "is_active", "created_at"],
    "sales_records": ["id", "product_id (FOREIGN KEY to products.id)", "sales_rep_id (FOREIGN KEY to users.id)", "customer_name", "customer_email", "quantity", "unit_price", "total_amount", "region", "status", "sale_date", "created_at"],
    "users": ["id (PRIMARY KEY, UUID)", "email", "full_name", "role", "department", "is_active", "created_at", "last_login"],
    "feedback": ["id", "message_id", "user_id", "score", "correction_text", "feedback_type", "created_at"],
    "evaluation_scores": ["id", "message_id", "faithfulness", "answer_relevance", "context_precision", "llm_judge_grade", "llm_judge_reasoning", "evaluated_at"],
    "query_analytics": ["id", "date", "total_queries", "unique_users", "avg_latency_ms", "cache_hit_rate", "avg_faithfulness", "avg_relevance", "top_intents", "top_products_asked", "queries_by_role", "created_at"],
    "documents": ["id", "filename", "file_type", "file_size_bytes", "storage_path", "uploaded_by", "access_roles", "document_type", "content_hash", "qdrant_collection", "chunk_count", "status", "created_at", "updated_at"],
    "conversations": ["id", "user_id", "title", "message_count", "created_at", "last_message_at"],
    "messages": ["id", "conversation_id", "role", "content", "sources", "tools_used", "relevance_score", "latency_ms", "token_count_input", "token_count_output", "model_used", "created_at"]
}

def get_schema_for_role(role: str) -> str:
    perms = DATABASE_PERMISSIONS.get(role, {})
    if not perms:
        return ""
        
    schema_parts = []
    for table_name, table_config in perms.get("allowed_tables", {}).items():
        columns = table_config["columns"]
        if columns == "*":
            col_list = ALL_TABLE_SCHEMAS.get(table_name, [])
        else:
            col_list = columns
            
        schema_parts.append(f"TABLE: {table_name}")
        for col in col_list:
            schema_parts.append(f"  - {col}")
            
        if "row_filter" in table_config:
            schema_parts.append(f"  ⚠️ NOTE: You can only query YOUR OWN records in this table.")
        schema_parts.append("")
        
    return "\n".join(schema_parts)

def extract_table_names(sql: str) -> set[str]:
    pattern = r'(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
    matches = re.findall(pattern, sql, re.IGNORECASE)
    return set(matches)

def extract_columns_for_table(sql: str, table: str) -> set[str]:
    pattern = rf'{table}\.([a-zA-Z_][a-zA-Z0-9_]*)'
    explicit = set(re.findall(pattern, sql, re.IGNORECASE))
    if re.search(r'SELECT\s+\*', sql, re.IGNORECASE):
        return {"*"}
    return explicit

def validate_query_permissions(sql: str, role: str) -> tuple[bool, str]:
    perms = DATABASE_PERMISSIONS.get(role, {})
    if not perms:
        return False, "Role has no database permissions."
        
    allowed_tables = set(perms.get("allowed_tables", {}).keys())
    referenced_tables = extract_table_names(sql)
    
    for table in referenced_tables:
        if table not in allowed_tables:
            return False, f"Your role ({role}) does not have permission to access the '{table}' table. {perms.get('denied_message', '')}"
            
        table_config = perms["allowed_tables"][table]
        if table_config["columns"] != "*":
            referenced_cols = extract_columns_for_table(sql, table)
            if "*" in referenced_cols:
                return False, f"Your role ({role}) cannot use SELECT * on the '{table}' table."
            allowed_cols = set(table_config["columns"])
            unauthorized = referenced_cols - allowed_cols
            if unauthorized:
                return False, f"Your role ({role}) cannot access these columns in '{table}': {', '.join(unauthorized)}"
                
    return True, "OK"

def inject_row_filters(sql: str, role: str, user_id: str) -> str:
    perms = DATABASE_PERMISSIONS.get(role, {})
    if not perms:
        return sql
        
    referenced_tables = extract_table_names(sql)
    for table_name, table_config in perms.get("allowed_tables", {}).items():
        if "row_filter" not in table_config or table_name not in referenced_tables:
            continue
            
        row_filter = table_config["row_filter"].format(user_id=user_id)
        if re.search(r'\bWHERE\b', sql, re.IGNORECASE):
            sql = re.sub(r'\bWHERE\b', f'WHERE {row_filter} AND', sql, count=1, flags=re.IGNORECASE)
        else:
            insert_point = re.search(r'\b(GROUP BY|ORDER BY|LIMIT|HAVING|$)', sql, re.IGNORECASE)
            pos = insert_point.start() if insert_point else len(sql)
            sql = sql[:pos] + f' WHERE {row_filter} ' + sql[pos:]
            
    return sql

def validate_sql_safety(sql: str) -> tuple[bool, str]:
    DANGEROUS_PATTERNS = [
        r'\bDROP\b', r'\bDELETE\b', r'\bUPDATE\b', r'\bINSERT\b',
        r'\bALTER\b', r'\bTRUNCATE\b', r'\bCREATE\b', r'\bGRANT\b',
        r'\bREVOKE\b', r'\bEXEC\b', r'\bEXECUTE\b', r'--', r';.*\bDROP\b',
    ]
    sql_upper = sql.upper().strip()
    
    if not sql_upper.startswith(('SELECT', 'WITH')):
        return False, "Only SELECT queries are allowed."
        
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, sql_upper):
            return False, f"Dangerous SQL pattern detected: {pattern}"
            
    return True, "OK"
