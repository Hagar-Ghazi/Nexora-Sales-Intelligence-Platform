import traceback
from langchain_groq import ChatGroq

print("TEST 1: api_key=None")
try:
    llm = ChatGroq(model_name="llama3-8b-8192", api_key=None)
    llm.invoke("hello")
except Exception as e:
    traceback.print_exc()

print("\nTEST 2: api_key=''")
try:
    llm = ChatGroq(model_name="llama3-8b-8192", api_key='')
    llm.invoke("hello")
except Exception as e:
    traceback.print_exc()
