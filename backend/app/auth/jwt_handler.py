from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from app.config import get_settings

@dataclass
class UserContext:
    user_id: str
    email: str
    role: str
    full_name: str

def create_jwt(user_id: str, email: str, role: str, full_name: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "app_metadata": {
            "provider": "email",
            "providers": ["email"]
        },
        "user_metadata": {
            "role": role,
            "full_name": full_name
        }
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def decode_jwt(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def extract_user_from_token(token: str) -> UserContext:
    payload = decode_jwt(token)
    
    user_id = payload.get("sub")
    email = payload.get("email", "")
    app_metadata = payload.get("app_metadata", {})
    user_metadata = payload.get("user_metadata", {})
    
    role = user_metadata.get("role", "sales") # Default to least privileged
    full_name = user_metadata.get("full_name", "")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload: missing user id")
        
    return UserContext(user_id=user_id, email=email, role=role, full_name=full_name)
