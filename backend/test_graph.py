import asyncio
import os
import traceback
if "LANGCHAIN_API_KEY" in os.environ:
    del os.environ["LANGCHAIN_API_KEY"]
os.environ["LANGCHAIN_TRACING_V2"] = "false" # Disable tracing to avoid noise

from app.agent.graph import run_agent

async def test():
    try:
        async for event in run_agent("hello", "user_1", "sales"):
            if event["event"] == "on_chain_end":
                pass
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
