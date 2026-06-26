from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env into os.environ
cur_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.abspath(os.path.join(cur_dir, "..", ".env"))
load_dotenv(dotenv_path)

class Settings(BaseSettings):
    # === LangSmith (free tier: 5000 traces/month) ===
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "enterprise-agentic-rag"
    LANGCHAIN_TRACING_V2: str = "true"


    # === LLM Providers ===
    GROQ_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"


    # === Supabase ===
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_DB_PASSWORD: str = ""


    # === Qdrant ===
    QDRANT_URL: str = "http://localhost:6333"


    # === Upstash Redis ===
    UPSTASH_REDIS_URL: str = ""
    UPSTASH_REDIS_TOKEN: str = ""


    # === Observability ===
    AXIOM_DATASET: str = "agentic-rag"
    AXIOM_TOKEN: str = ""
    JWT_SECRET: str = "your-64-char-random-string"


    # === Models ===
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"
    PRIMARY_LLM: str = "llama-3.3-70b-versatile"
    FALLBACK_LLM: str = "mixtral-8x7b-32768"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
