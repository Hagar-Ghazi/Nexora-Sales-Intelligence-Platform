from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.auth.jwt_handler import create_jwt, UserContext, extract_user_from_token
from app.dependencies import get_current_user
from app.auth import user_store

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    full_name: str
    role: str

class SetupRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    full_name: str

@router.get("/setup-status")
def setup_status():
    users = user_store.load_users()
    return {"setup_required": len(users) == 0}

@router.post("/setup")
def setup(payload: SetupRequest):
    users = user_store.load_users()
    if len(users) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System has already been set up."
        )
        
    try:
        new_user = user_store.create_user(
            email=payload.email,
            password_plain=payload.password,
            full_name=payload.full_name,
            role="admin"
        )
        
        token = create_jwt(
            user_id=new_user["user_id"],
            email=new_user["email"],
            role=new_user["role"],
            full_name=new_user["full_name"]
        )
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "user_id": new_user["user_id"],
                "email": new_user["email"],
                "role": new_user["role"],
                "full_name": new_user["full_name"]
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
def login(payload: LoginRequest):
    user = user_store.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
        
    if not user_store.verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    token = create_jwt(
        user_id=user["user_id"],
        email=user["email"],
        role=user["role"],
        full_name=user["full_name"]
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

@router.post("/register")
def register(payload: RegisterRequest, current_user: UserContext = Depends(get_current_user)):
    # Only Admin can create users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can create users"
        )
        
    allowed_roles = ["admin", "manager", "sales", "support"]
    if payload.role.lower() not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles are: {', '.join(allowed_roles)}"
        )
        
    try:
        new_user = user_store.create_user(
            email=payload.email,
            password_plain=payload.password,
            full_name=payload.full_name,
            role=payload.role.lower()
        )
        return {
            "user_id": new_user["user_id"],
            "email": new_user["email"],
            "role": new_user["role"],
            "full_name": new_user["full_name"],
            "status": new_user["status"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me")
def me(current_user: UserContext = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": current_user.full_name
    }
