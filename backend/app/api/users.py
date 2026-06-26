from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.auth.jwt_handler import UserContext
from app.auth import user_store

router = APIRouter(prefix="/api/users", tags=["users"])

class UpdateUserRequest(BaseModel):
    email: str
    full_name: str
    role: str
    password: str | None = None

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
    return {"users": user_store.list_users()}

@router.put("/{user_id}")
def update_user_details(user_id: str, payload: UpdateUserRequest, user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
        
    allowed_roles = ["admin", "manager", "sales", "support"]
    if payload.role.lower() not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {allowed_roles}")
        
    try:
        updated = user_store.update_user(
            user_id=user_id,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role.lower(),
            password_plain=payload.password if payload.password and len(payload.password.strip()) > 0 else None
        )
        return {
            "user_id": updated["user_id"],
            "email": updated["email"],
            "role": updated["role"],
            "full_name": updated["full_name"],
            "status": updated["status"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}/role")
def update_user_role(user_id: str, role: str, user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
        
    allowed_roles = ["admin", "manager", "sales", "support"]
    if role.lower() not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {allowed_roles}")
        
    users = user_store.load_users()
    found = False
    for u in users:
        if u["user_id"] == user_id:
            u["role"] = role.lower()
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_store.save_users(users)
    return {"message": "Role updated"}

@router.delete("/{user_id}")
def delete_existing_user(user_id: str, user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    try:
        deleted = user_store.delete_user(user_id)
        return {"message": "User deleted successfully", "user_id": deleted["user_id"]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
