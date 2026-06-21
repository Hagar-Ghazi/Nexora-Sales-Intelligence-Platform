import os
from langchain_community.document_loaders import UnstructuredFileLoader
from langchain_core.documents import Document

def parse_document(file_path: str, file_type: str) -> list[Document]:
    """
    Parses a document using Unstructured.
    Unstructured is powerful because it preserves semantic structure (headers, tables, lists)
    which helps downstream semantic chunking.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} not found")
        
    try:
        # We use 'elements' mode to keep structural elements intact
        loader = UnstructuredFileLoader(file_path, mode="elements")
        docs = loader.load()
        return docs
    except Exception as e:
        # Fallback to simple text if Unstructured fails
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return [Document(page_content=text, metadata={"source": file_path})]
