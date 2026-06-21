import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user, get_supabase_client
from app.auth.jwt_handler import UserContext
from app.ingestion.pipeline import ingest_document
from supabase import Client

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    access_roles: str = Form(...), # Comma separated: "sales,manager"
    document_type: str = Form("policy"),
    user: UserContext = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """Admin-only endpoint to upload and ingest new documents."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload documents.")
        
    roles_list = [r.strip() for r in access_roles.split(",")]
    
    # Save file temporarily
    temp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    # In a real app, upload to Supabase Storage here
    
    doc_id = str(uuid.uuid4())
    
    # Trigger ingestion pipeline
    try:
        result = ingest_document(
            file_path=temp_path,
            file_type=file.content_type,
            access_roles=roles_list,
            document_type=document_type,
            uploaded_by=user.user_id,
            doc_id=doc_id
        )
        return result
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("")
def list_documents(user: UserContext = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)):
    """List documents the user has access to."""
    # Real implementation would use RLS in Supabase
    return {"message": "List of documents"}

@router.delete("/{doc_id}")
def delete_document(doc_id: str, user: UserContext = Depends(get_current_user)):
    """Admin-only endpoint to delete a document."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete documents.")
    return {"message": f"Document {doc_id} deleted"}
