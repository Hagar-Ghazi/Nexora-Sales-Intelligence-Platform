import os
import traceback
if "LANGCHAIN_API_KEY" in os.environ:
    del os.environ["LANGCHAIN_API_KEY"]
from langchain_groq import ChatGroq
from pydantic import BaseModel

class Intent(BaseModel):
    intent: str

try:
    llm = ChatGroq(model_name="llama3-8b-8192", api_key="invalid")
    chain = llm.with_structured_output(Intent)
    chain.invoke("hello")
except Exception as e:
    traceback.print_exc()
