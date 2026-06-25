import asyncio
from app.agent.graph import run_agent

async def main():
    query = "what is the amount of pound egypt today VS usd?"
    # We will trace the state
    from app.agent.state import AgentState
    from app.agent.nodes import safety_gate_node, router_node, db_and_web_node, context_assembly_node
    
    state = AgentState(
        query=query,
        user_id="user_123",
        user_role="sales",
        messages=[],
        is_blocked=False,
        route="",
        retrieved_chunks=[],
        tool_results=[],
        context="",
        answer="",
        iteration=0,
        relevance_score=0.0,
        explanation={}
    )
    
    state.update(safety_gate_node(state))
    state.update(router_node(state))
    # Mocking execution of db_and_web_node
    tool_res = await db_and_web_node(state)
    state.update(tool_res)
    context_res = context_assembly_node(state)
    state.update(context_res)
    
    print("ASSEMBLED CONTEXT:")
    print(state["context"])

if __name__ == "__main__":
    asyncio.run(main())
