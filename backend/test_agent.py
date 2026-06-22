import asyncio
from app.agent.graph import run_agent

async def main():
    print("Starting agent test...")
    try:
        async for event in run_agent("how are you", "user_123", "sales", "test_thread"):
            print("EVENT:", event["event"], "NAME:", event.get("name"))
            
            if event["event"] == "on_chain_end":
                output = event.get("data", {}).get("output", {})
                if isinstance(output, dict) and "answer" in output:
                    print("FINAL ANSWER:", output["answer"])
                    
    except Exception as e:
        print("ERROR:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
