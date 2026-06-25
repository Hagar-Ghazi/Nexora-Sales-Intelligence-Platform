import asyncio
from app.tools.web_search_tool import web_search

async def main():
    q = "what is the amount of pound egypt today VS usd? 2026"
    res = await web_search(q)
    print("QUERY:", q)
    print("RESULT:")
    print(res)

if __name__ == "__main__":
    asyncio.run(main())
