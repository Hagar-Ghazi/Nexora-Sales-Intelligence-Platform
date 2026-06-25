import asyncio
import sys
from app.agent.graph import run_agent

async def run_query(query: str, role: str = "sales"):
    print("\n" + "="*80)
    print(f"QUERY: {query} (Role: {role})")
    print("="*80)
    try:
        async for event in run_agent(query, "user_123", role, "test_thread"):
            if event["event"] == "on_chain_end":
                output = event.get("data", {}).get("output", {})
                if isinstance(output, dict) and "answer" in output:
                    print("ANSWER:", output["answer"])
    except Exception as e:
        print("ERROR:", str(e))

async def main():
    # 1. Test database products query
    await run_query("What products do we have?")
    
    # 2. Test EGP vs USD exchange rate (web search)
    await run_query("what is the amount of pound egypt today VS usd?")
    
    # 3. Test out of scope rejection
    await run_query("How do I bake a cake?")

if __name__ == "__main__":
    asyncio.run(main())
