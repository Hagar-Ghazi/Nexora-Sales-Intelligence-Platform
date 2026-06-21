import asyncio
from langsmith import traceable
from langchain_core.messages import AIMessage
from app.agent.state import AgentState
from app.agent.moderator import detect_injection, sanitize_input
from app.agent.intent import classify_intent
from app.agent.router import route_query, RouteDestination
from app.agent.query_rewriter import hyde_rewrite

# Mock imports for now until these modules are built
# from app.llm.router import get_llm
# from app.retrieval.hybrid_search import search as hybrid_search
# from app.tools.sql_tool import sql_query
# from app.cache.query_cache import get_query_cache

@traceable(name="safety_gate_node")
def safety_gate_node(state: AgentState) -> dict:
    # 1. Moderation
    query = state["query"]
    is_injection, pattern = detect_injection(query)
    if is_injection:
        return {
            "is_blocked": True,
            "block_message": f"Security Alert: Your query matches a restricted pattern ({pattern}). Request blocked.",
            "route": "blocked"
        }
        
    query = sanitize_input(query)
    
    # 2. Intent Classification
    # llm = get_llm()
    # intent = classify_intent(query, llm)
    intent = "business" # Mock until LLM is hooked up
    
    if intent == "malicious":
        return {
            "is_blocked": True,
            "block_message": "Security Alert: Query classified as malicious.",
            "route": "blocked"
        }
        
    return {
        "query": query,
        "intent": intent,
        "is_blocked": False
    }

@traceable(name="router_node")
def router_node(state: AgentState) -> dict:
    if state.get("intent") == "chitchat" or state.get("intent") == "greeting":
        return {"route": "chitchat"}
        
    # llm = get_llm()
    # route_obj = route_query(state["query"], state["user_role"], llm)
    # return {"route": route_obj.destination.value, "route_reasoning": route_obj.reasoning}
    return {"route": "documents", "route_reasoning": "Mock routing"}

@traceable(name="query_rewrite_node")
def query_rewrite_node(state: AgentState) -> dict:
    iteration = state.get("iteration", 0)
    query = state["query"]
    
    if iteration > 0:
        # We looped back because relevance was low. Use HyDE to rewrite.
        # llm = get_llm()
        # rewritten = hyde_rewrite(query, llm)
        rewritten = f"Hypothetical answer for: {query}"
        return {"rewritten_query": rewritten, "iteration": iteration + 1}
        
    return {"rewritten_query": query, "iteration": iteration + 1}

@traceable(name="hybrid_retrieval_node")
async def hybrid_retrieval_node(state: AgentState) -> dict:
    query = state.get("rewritten_query", state["query"])
    role = state["user_role"]
    
    # chunks = await hybrid_search(query, role)
    chunks = [{"content": "Mock retrieved doc", "source": "doc1.txt", "score": 0.9}]
    
    return {"retrieved_chunks": chunks}

@traceable(name="database_query_node")
async def database_query_node(state: AgentState) -> dict:
    query = state["query"]
    user_id = state["user_id"]
    role = state["user_role"]
    
    # result = await sql_query(query, user_id, role)
    result = "Mock SQL result"
    
    return {"tool_results": [{"tool": "sql", "result": result}]}

@traceable(name="parallel_retrieval_node")
async def parallel_retrieval_node(state: AgentState) -> dict:
    # Run both simultaneously
    docs_task = hybrid_retrieval_node(state)
    db_task = database_query_node(state)
    
    docs_res, db_res = await asyncio.gather(docs_task, db_task)
    
    return {
        "retrieved_chunks": docs_res.get("retrieved_chunks", []),
        "tool_results": db_res.get("tool_results", [])
    }

@traceable(name="context_assembly_node")
def context_assembly_node(state: AgentState) -> dict:
    context_parts = []
    
    chunks = state.get("retrieved_chunks", [])
    if chunks:
        context_parts.append("--- DOCUMENTS ---")
        for idx, chunk in enumerate(chunks):
            context_parts.append(f"Source {idx+1} ({chunk.get('source')}): {chunk.get('content')}")
            
    tools = state.get("tool_results", [])
    if tools:
        context_parts.append("--- DATABASE/DATA ---")
        for tool in tools:
            context_parts.append(f"[{tool.get('tool')}] Result: {tool.get('result')}")
            
    return {"context": "\n".join(context_parts)}

@traceable(name="llm_generation_node")
def llm_generation_node(state: AgentState) -> dict:
    query = state["query"]
    context = state.get("context", "No context available.")
    
    # llm = get_llm()
    # messages = [("system", "Answer based on context: " + context), ("human", query)]
    # response = llm.invoke(messages)
    # answer = response.content
    
    answer = f"Mock Answer based on {context}"
    
    return {"answer": answer, "messages": [AIMessage(content=answer)]}

@traceable(name="relevance_eval_node")
def relevance_eval_node(state: AgentState) -> dict:
    # Evaluate if answer actually addresses query
    # Mock for now
    score = 0.9
    return {"relevance_score": score}

@traceable(name="explanation_builder_node")
def explanation_builder_node(state: AgentState) -> dict:
    exp = {
        "iterations": state.get("iteration", 1),
        "confidence": state.get("relevance_score", 0.0),
        "sources": [c.get("source") for c in state.get("retrieved_chunks", [])],
        "tools": [t.get("tool") for t in state.get("tool_results", [])]
    }
    return {"explanation": exp}

@traceable(name="direct_response_node")
def direct_response_node(state: AgentState) -> dict:
    query = state["query"]
    # For chitchat
    # llm = get_llm()
    # response = llm.invoke([("human", query)])
    # answer = response.content
    answer = "Mock chitchat response"
    return {"answer": answer, "explanation": {"type": "chitchat"}, "messages": [AIMessage(content=answer)]}
