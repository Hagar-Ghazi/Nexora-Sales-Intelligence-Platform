import asyncio
import os
import json
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from typing import TypedDict

class State(TypedDict):
    input: str
    output: str

def generate_node(state: State):
    llm = ChatGroq(model_name="llama3-8b-8192", api_key=os.environ.get("GROQ_API_KEY", "fake"))
    response = llm.invoke(state["input"])
    return {"output": response.content}

workflow = StateGraph(State)
workflow.add_node("llm_generation", generate_node)
workflow.set_entry_point("llm_generation")
workflow.add_edge("llm_generation", END)
app = workflow.compile()

async def main():
    events = []
    try:
        async for event in app.astream_events({"input": "Say hello"}, version="v2"):
            if event["event"] == "on_chat_model_stream":
                events.append(event["metadata"])
    except Exception as e:
        print("Error:", e)
        
    print(json.dumps(events, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
