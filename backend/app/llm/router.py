from functools import lru_cache
from langchain_groq import ChatGroq
from app.config import get_settings

@lru_cache
def get_llm(model_name: str = None):
    settings = get_settings()
    target_model = model_name or settings.PRIMARY_LLM
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=target_model,
        temperature=0.1
    )

   
