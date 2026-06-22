import os
import traceback
os.environ["LANGCHAIN_TRACING_V2"] = "true"
if "LANGCHAIN_API_KEY" in os.environ:
    del os.environ["LANGCHAIN_API_KEY"]
from langchain_groq import ChatGroq

try:
    llm = ChatGroq(model_name="llama3-8b-8192", api_key="test_key_which_is_invalid")
    llm.invoke("hello")
except Exception as e:
    traceback.print_exc()
