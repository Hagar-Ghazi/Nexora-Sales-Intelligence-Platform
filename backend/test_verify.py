import asyncio
import logging
from app.agent.graph import run_agent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

async def run_query(query: str, role: str = "sales"):
    print("\n" + "="*80)
    print(f"QUERY: {query} (Role: {role})")
    print("="*80)
    answer = ""
    async for event in run_agent(query, "user_123", role, "test_thread"):
        if event["event"] == "on_chain_end":
            output = event.get("data", {}).get("output", {})
            name = event.get("name", "")
            if isinstance(output, dict) and "answer" in output and name not in ["LangGraph"]:
                answer = output["answer"]
    if answer:
        print("ANSWER:", answer)
        # Check if it contains a table
        if "|" in answer and "---" in answer:
            print(">>> TABLE DETECTED: Structured Data Window would show")
        else:
            print(">>> No table in response — stays in chat bubble only")

async def main():
    await run_query("What is the return policy?")
    await run_query("can u give me summary about our doucment for our system?")
    await run_query("can u give me inforamtion about the 1 usd is equal how many pound egypt todat?")

if __name__ == "__main__":
    asyncio.run(main())
