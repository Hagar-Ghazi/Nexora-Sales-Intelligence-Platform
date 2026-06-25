from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from redis import Redis
from qdrant_client import QdrantClient
from app.config import Settings, get_settings

security = HTTPBearer()

def get_supabase_client(settings: Settings = Depends(get_settings)) -> Client:
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not connect to Supabase")

def get_redis_client(settings: Settings = Depends(get_settings)) -> Redis:
    try:
        return Redis.from_url(settings.UPSTASH_REDIS_URL, decode_responses=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not connect to Redis")

def get_qdrant_client(settings: Settings = Depends(get_settings)) -> QdrantClient:
    try:
        return QdrantClient(url=settings.QDRANT_URL)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not connect to Qdrant")

from fastapi import Request

_user_role_cache = {}

def get_current_user(request: Request):
    from app.auth.jwt_handler import UserContext
    # For development/demo purposes, we bypass JWT and extract role from a custom header
    role = request.headers.get("X-Mock-Role", "sales")
    
    if role in _user_role_cache:
        return _user_role_cache[role]
        
    try:
        from sqlalchemy import create_engine, text
        from app.tools.sql_tool import get_db_url
        engine = create_engine(get_db_url())
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, email, full_name FROM users WHERE role = :role LIMIT 1"),
                {"role": role}
            )
            row = result.fetchone()
            if row:
                user_ctx = UserContext(
                    user_id=str(row[0]),
                    email=row[1],
                    role=role,
                    full_name=row[2]
                )
                _user_role_cache[role] = user_ctx
                return user_ctx
    except Exception as e:
        import sys
        print(f"Error fetching mock user from DB: {e}", file=sys.stderr)
        
    # Hardcoded fallbacks if DB connection fails temporarily
    fallback_users = {
        "sales": ("alice@company.com", "Alice Smith"),
        "support": ("bob@company.com", "Bob Jones"),
        "manager": ("charlie@company.com", "Charlie Brown"),
        "admin": ("diana@company.com", "Diana Prince"),
    }
    email, name = fallback_users.get(role, ("demo@company.com", "Demo User"))
    return UserContext(user_id="00000000-0000-0000-0000-000000000000", email=email, role=role, full_name=name)
