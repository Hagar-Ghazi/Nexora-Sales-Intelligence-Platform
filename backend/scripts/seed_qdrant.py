import os
import sys

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generate_seed_docs import generate_docs
from app.ingestion.pipeline import ingest_document

def seed_qdrant():
    print("Generating seed documents...")
    generate_docs()
    
    docs_dir = os.path.join(os.path.dirname(__file__), "..", "seed_documents")
    if not os.path.exists(docs_dir):
        print("Error: seed_documents directory not found.")
        return
        
    print("\nIngesting documents into Qdrant...")
    for filename in os.listdir(docs_dir):
        if filename.endswith(".md"):
            filepath = os.path.join(docs_dir, filename)
            print(f"Ingesting {filename}...")
            
            # Everyone gets access to these seed docs
            access_roles = ["sales", "manager", "support", "admin"]
            
            try:
                result = ingest_document(
                    file_path=filepath,
                    file_type="text/markdown",
                    access_roles=access_roles,
                    document_type="policy",
                    uploaded_by="system",
                    doc_id=filename.replace(".md", "")
                )
                print(f"Success: {result['chunks_created']} chunks created.")
            except Exception as e:
                print(f"Error ingesting {filename}: {str(e)}")
                
    print("\nDone! Documents are now ready to be queried.")

if __name__ == "__main__":
    seed_qdrant()
