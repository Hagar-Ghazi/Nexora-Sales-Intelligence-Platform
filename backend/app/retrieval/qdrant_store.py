from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance
from langchain_qdrant import QdrantVectorStore

COLLECTION_NAMES = [
    "collection_public",
    "collection_sales",
    "collection_support",
    "collection_management",
    "collection_admin"
]

def get_qdrant_client(url: str) -> QdrantClient:
    return QdrantClient(url=url)

def create_collection_if_not_exists(client: QdrantClient, collection_name: str, vector_size: int = 384):
    """
    Creates a collection if it doesn't exist.
    Uses Cosine distance which works best with MiniLM embeddings.
    """
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )

def get_vector_store(collection_name: str, embeddings, url: str) -> QdrantVectorStore:
    client = get_qdrant_client(url)
    create_collection_if_not_exists(client, collection_name)
    return QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings
    )

def list_collections(client: QdrantClient) -> list[str]:
    response = client.get_collections()
    return [c.name for c in response.collections]
