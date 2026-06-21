import hashlib

def compute_file_hash(file_path: str) -> str:
    """Compute MD5 hash of a file for version tracking."""
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def is_document_changed(file_hash: str, doc_id: str, supabase_client) -> bool:
    """Check if the document hash has changed in the database."""
    response = supabase_client.table("documents").select("content_hash").eq("id", doc_id).execute()
    if not response.data:
        return True # Document doesn't exist
        
    db_hash = response.data[0].get("content_hash")
    return db_hash != file_hash

def update_document_hash(doc_id: str, file_hash: str, supabase_client):
    """Update the document hash in the database."""
    supabase_client.table("documents").update({"content_hash": file_hash}).eq("id", doc_id).execute()
