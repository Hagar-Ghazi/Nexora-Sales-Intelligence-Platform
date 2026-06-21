from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

def chunk_documents(documents: list[Document]) -> list[Document]:
    """
    Chunks documents using RecursiveCharacterTextSplitter.
    Why this method?
    It tries to split on double newlines (paragraphs) first, then single newlines, then spaces.
    This respects the natural boundaries of the text, keeping related concepts together.
    
    Chunk size: 600 tokens is a sweet spot for MiniLM embeddings (which max out at 512).
    Overlap: 100 ensures we don't cut off context midway through a thought.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=100,
        separators=["\n\n", "\n", ".", " ", ""],
        length_function=len
    )
    
    # TextSplitter automatically preserves metadata
    chunks = splitter.split_documents(documents)
    return chunks
