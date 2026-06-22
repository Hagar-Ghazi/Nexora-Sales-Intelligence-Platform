from functools import lru_cache
from langchain_groq import ChatGroq
from app.config import get_settings

@lru_cache
def get_llm():
    settings = get_settings()
    primary_llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.PRIMARY_LLM,
        temperature=0.1
    )
    return primary_llm

   
