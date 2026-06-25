from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.agent.state import AgentState
from app.agent.nodes import (
    safety_gate_node,
    router_node,
    query_rewrite_node,
    hybrid_retrieval_node,
    database_query_node,
    parallel_retrieval_node,
    web_search_node,
    db_and_web_node,
    context_assembly_node,
    llm_generation_node,
    relevance_eval_node,
    explanation_builder_node,
    direct_response_node
)
from app.agent.edges import (
    route_after_safety,
    route_after_router,
    route_after_eval
)

def build_agent_graph():
    # 1. Initialize StateGraph
    workflow = StateGraph(AgentState)
    
    # 2. Add Nodes
    workflow.add_node("safety_gate", safety_gate_node)
    workflow.add_node("router", router_node)
    workflow.add_node("query_rewrite", query_rewrite_node)
    workflow.add_node("hybrid_retrieval", hybrid_retrieval_node)
    workflow.add_node("database_query", database_query_node)
    workflow.add_node("parallel_retrieval", parallel_retrieval_node)
    workflow.add_node("web_search", web_search_node)
    workflow.add_node("db_and_web", db_and_web_node)
    workflow.add_node("context_assembly", context_assembly_node)
    workflow.add_node("llm_generation", llm_generation_node)
    workflow.add_node("relevance_eval", relevance_eval_node)
    workflow.add_node("explanation_builder", explanation_builder_node)
    workflow.add_node("direct_response", direct_response_node)
    
    # 3. Add Edges & Conditional Routing
    workflow.set_entry_point("safety_gate")
    
    # Safety -> Router or END
    workflow.add_conditional_edges(
        "safety_gate",
        route_after_safety,
        {
            "router": "router",
            "blocked": END
        }
    )
    
    # Router -> appropriate retrieval strategy
    workflow.add_conditional_edges(
        "router",
        route_after_router,
        {
            "hybrid_retrieval": "hybrid_retrieval",
            "database_query": "database_query",
            "parallel_retrieval": "parallel_retrieval",
            "web_search": "web_search",
            "db_and_web": "db_and_web",
            "direct_response": "direct_response"
        }
    )
    
    # All retrieval nodes -> Context Assembly
    workflow.add_edge("hybrid_retrieval", "context_assembly")
    workflow.add_edge("database_query", "context_assembly")
    workflow.add_edge("parallel_retrieval", "context_assembly")
    workflow.add_edge("web_search", "context_assembly")
    workflow.add_edge("db_and_web", "context_assembly")
    
    # Assembly -> Generation -> Eval
    workflow.add_edge("context_assembly", "llm_generation")
    workflow.add_edge("llm_generation", "relevance_eval")
    
    # Eval -> Rewrite or Explanation
    workflow.add_conditional_edges(
        "relevance_eval",
        route_after_eval,
        {
            "query_rewrite": "query_rewrite",
            "explanation_builder": "explanation_builder"
        }
    )
    
    # Rewrite -> Router (loop back)
    workflow.add_edge("query_rewrite", "router")
    
    # Endings
    workflow.add_edge("explanation_builder", END)
    workflow.add_edge("direct_response", END)
    
    # 4. Compile with Checkpointer for Memory
    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)

agent = build_agent_graph()

from langchain_core.messages import HumanMessage

async def run_agent(query: str, user_id: str, user_role: str, thread_id: str = "default"):
    """Helper function to run the compiled graph."""
    config = {"configurable": {"thread_id": thread_id}}
    initial_state = {
        "query": query,
        "user_id": user_id,
        "user_role": user_role,
        "iteration": 0,
        "max_iterations": 4,
        "messages": [HumanMessage(content=query)]
    }
    
    async for event in agent.astream_events(initial_state, config, version="v2"):
        yield event