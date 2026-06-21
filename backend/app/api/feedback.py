from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.auth.jwt_handler import UserContext

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

class FeedbackRequest(BaseModel):
    message_id: str
    score: float # 0.0 or 1.0 (thumbs down / thumbs up)
    correction_text: str = ""

@router.post("")
def submit_feedback(request: FeedbackRequest, user: UserContext = Depends(get_current_user)):
    """User submits thumbs up/down and optional correction for a message."""
    # In a real implementation: store in Supabase and send to LangSmith
    return {"status": "success", "message": "Feedback recorded"}

@router.get("")
def list_feedback(user: UserContext = Depends(get_current_user)):
    """Managers and Admins can view feedback to improve the system."""
    if user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    return {"data": []}
