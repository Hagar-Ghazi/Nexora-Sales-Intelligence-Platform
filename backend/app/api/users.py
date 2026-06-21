from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.auth.jwt_handler import UserContext

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me")
def get_me(user: UserContext = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name
    }

@router.get("")
def list_users(user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    return {"users": []}

@router.put("/{user_id}/role")
def update_user_role(user_id: str, role: str, user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    return {"message": "Role updated"}
