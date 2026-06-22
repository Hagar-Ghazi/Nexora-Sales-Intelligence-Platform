from functools import lru_cache
from langchain_groq import ChatGroq
from app.config import get_settings

@lru_cache
def get_llm():
    settings = get_settings()
    primary_llm = ChatGroq(
        api_key="invalid_key_for_testing",
        model_name="llama3-8b-8192",
        temperature=0.1
    )
    return primary_llm
