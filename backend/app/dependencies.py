from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from redis import Redis
from qdrant_client import QdrantClient
from app.config import Settings, get_settings
from fastapi import Request

security = HTTPBearer(auto_error=False)

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

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    from app.auth.jwt_handler import extract_user_from_token
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is missing or invalid"
        )
    return extract_user_from_token(credentials.credentials)
