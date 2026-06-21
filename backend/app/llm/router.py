from functools import lru_cache
from langchain_groq import ChatGroq
from langchain_community.chat_models import ChatOllama
from app.config import get_settings

@lru_cache
def get_llm():
    """
    Returns a ChatModel with automatic fallbacks.
    If the primary Groq model fails (e.g., rate limits), it automatically falls back
    to a secondary Groq model, and finally to a local Ollama model if everything fails.
    """
    settings = get_settings()
    
    # Primary: Fast, high-quality Groq model
    primary_llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.PRIMARY_LLM,
        temperature=0.1
    )
    
    # Secondary: Fallback Groq model
    fallback_llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.FALLBACK_LLM,
        temperature=0.1
    )
    
    # Tertiary: Local Ollama model (for complete offline/failure scenarios)
    local_llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model="llama3"
    )
    
    # Chain them with fallbacks
    return primary_llm.with_fallbacks([fallback_llm, local_llm])
