from app.agent.state import AgentState

def route_after_safety(state: AgentState) -> str:
    """Decide what to do after the safety gate."""
    if state.get("is_blocked"):
        return "blocked"
    return "router"

def route_after_router(state: AgentState) -> str:
    """Map the intent route to the correct node."""
    route = state.get("route", "documents")
    
    if route == "documents":
        return "hybrid_retrieval"
    elif route == "database":
        return "database_query"
    elif route == "both":
        return "parallel_retrieval"
    elif route == "chitchat":
        return "direct_response"
        
    return "hybrid_retrieval" # Fallback

def route_after_eval(state: AgentState) -> str:
    """Decide if we need to loop back and rewrite the query based on relevance."""
    score = state.get("relevance_score", 1.0)
    iteration = state.get("iteration", 1)
    max_iter = state.get("max_iterations", 4)
    
    # If the score is too low and we have iterations left, try again
    if score < 0.7 and iteration < max_iter:
        return "query_rewrite"
        
    # Otherwise, we're done
    return "explanation_builder"
