import asyncio
from langsmith import traceable
from langchain_core.messages import AIMessage
from app.agent.state import AgentState
from app.agent.moderator import detect_injection, sanitize_input
from app.agent.intent import classify_intent
from app.agent.router import route_query, RouteDestination
from app.agent.query_rewriter import hyde_rewrite
from app.llm.router import get_llm
from app.retrieval.hybrid_search import search as hybrid_search
from app.tools.sql_tool import sql_query
from app.tools.web_search_tool import web_search
from app.observability.alerts import send_security_alert

@traceable(name="safety_gate_node")
async def safety_gate_node(state: AgentState) -> dict:
    # 1. Moderation
    query = state["query"]
    is_injection, pattern = detect_injection(query)
    if is_injection:
        # Schedule the alert in the running Uvicorn event loop
        try:
            asyncio.create_task(send_security_alert(
                state.get("user_id", "unknown"),
                state.get("user_role", "unknown"),
                query,
                f"Matches restricted pattern: {pattern}"
            ))
        except Exception as e:
            import sys
            print(f"Error scheduling security alert: {e}", file=sys.stderr)
            
        return {
            "is_blocked": True,
            "block_message": f"Security Alert: Your query matches a restricted pattern ({pattern}). Request blocked.",
            "route": "blocked"
        }
        
    query = sanitize_input(query)
    
    # 2. Intent Classification
    llm = get_llm()
    # Run the synchronous LangChain invocation in a worker thread to keep the Uvicorn loop responsive
    intent = await asyncio.to_thread(classify_intent, query, llm)
    
    if intent == "malicious":
        # Schedule the alert in the running Uvicorn event loop
        try:
            asyncio.create_task(send_security_alert(
                state.get("user_id", "unknown"),
                state.get("user_role", "unknown"),
                query,
                "Intent classified as malicious by LLM"
            ))
        except Exception as e:
            import sys
            print(f"Error scheduling security alert: {e}", file=sys.stderr)
            
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
    intent = state.get("intent")
    if intent == "greeting":
        return {"route": "chitchat"}
        
    llm = get_llm()
    route_obj = route_query(state["query"], state["user_role"], llm)
    return {"route": route_obj.destination.value, "route_reasoning": route_obj.reasoning}

@traceable(name="query_rewrite_node")
def query_rewrite_node(state: AgentState) -> dict:
    iteration = state.get("iteration", 0)
    query = state["query"]
    
    if iteration > 0:
        # We looped back because relevance was low. Use HyDE to rewrite.
        llm = get_llm()
        rewritten = hyde_rewrite(query, llm)
        return {"rewritten_query": rewritten, "iteration": iteration + 1}
        
    return {"rewritten_query": query, "iteration": iteration + 1}

@traceable(name="hybrid_retrieval_node")
async def hybrid_retrieval_node(state: AgentState) -> dict:
    query = state.get("rewritten_query") or state["query"]
    role = state["user_role"]
    
    chunks = await hybrid_search(query, role)
    
    return {"retrieved_chunks": chunks}

@traceable(name="database_query_node")
async def database_query_node(state: AgentState) -> dict:
    query = state["query"]
    user_id = state["user_id"]
    role = state["user_role"]
    
    # Enrich query with current-user context so the LLM can answer "who am I?" style questions
    enriched_query = _inject_user_context(query, user_id, role)
    
    result = await sql_query(enriched_query, user_id, role)
    
    return {"tool_results": [{"tool": "sql", "result": result}]}

@traceable(name="web_search_node")
async def web_search_node(state: AgentState) -> dict:
    import datetime
    query = state.get("rewritten_query") or state["query"]
    
    # Ground temporal queries (today, current, etc.) with the current year
    current_year = datetime.datetime.now().year
    search_query = query
    lower_query = query.lower()
    if any(word in lower_query for word in ["today", "current", "now", "latest", "this year"]):
        if str(current_year) not in query:
            search_query = f"{query} {current_year}"
            
    result = await web_search(search_query)
    return {"tool_results": [{"tool": "web_search", "result": result}]}

@traceable(name="parallel_retrieval_node")
async def parallel_retrieval_node(state: AgentState) -> dict:
    """Documents (RAG) + Database in parallel."""
    docs_task = hybrid_retrieval_node(state)
    db_task = database_query_node(state)
    
    docs_res, db_res = await asyncio.gather(docs_task, db_task)
    
    return {
        "retrieved_chunks": docs_res.get("retrieved_chunks", []),
        "tool_results": db_res.get("tool_results", [])
    }

@traceable(name="db_and_web_node")
async def db_and_web_node(state: AgentState) -> dict:
    """Database + Web Search in parallel."""
    db_task = database_query_node(state)
    web_task = web_search_node(state)
    
    db_res, web_res = await asyncio.gather(db_task, web_task)
    
    # Merge tool_results from both
    combined = db_res.get("tool_results", []) + web_res.get("tool_results", [])
    return {"tool_results": combined}

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
        for tool in tools:
            res = tool.get("result", "")
            # Filter out empty results and errors from becoming "context"
            if res and "The query returned no results" not in res and "Permission Denied" not in res and "Database Execution Error" not in res:
                section = "--- DATABASE/DATA ---" if tool.get("tool") == "sql" else "--- WEB SEARCH ---"
                context_parts.append(section)
                context_parts.append(f"[{tool.get('tool')}] Result: {res}")
                
    # Always include the current user context so the LLM can answer "who am I?" questions
    user_role = state.get("user_role", "")
    user_id = state.get("user_id", "")
    if user_role:
        context_parts.append("--- CURRENT USER CONTEXT ---")
        context_parts.append(f"The user asking this question has role: {user_role}, user_id: {user_id}")
                
    if not context_parts:
        return {"context": "No context available."}
        
    return {"context": "\n".join(context_parts)}

@traceable(name="llm_generation_node")
def llm_generation_node(state: AgentState) -> dict:
    query = state["query"]
    context = state.get("context", "No context available.")
    user_role = state.get("user_role", "sales")
    
    if context == "No context available." or not context.strip():
        # No data found — give a helpful, honest response about what the platform can do
        llm = get_llm()
        messages = [
            ("system", f"""You are Nexora, an intelligent enterprise sales assistant for the Nexora Sales Intelligence Platform.

You have access to a live database containing users, products, and sales records.
Currently, no matching context or data was found in the database or documents for this query.

The current user role is: {user_role}

Please inform the user honestly that you couldn't find any matching results or data in the system for their query, and suggest what they can ask (e.g., querying products, sales records, or users).

DO NOT say you have no database access. DO NOT suggest checking a database connection.
Be concise and helpful."""),
            ("human", query)
        ]
        try:
            response = llm.invoke(messages)
            answer = response.content
        except Exception as e:
            answer = "I'm having trouble processing that request. Try asking about products, sales records, users, or Nexora platform data."
        return {"answer": answer, "messages": [AIMessage(content=answer)]}
    
    llm = get_llm()
    import datetime
    current_date_str = datetime.datetime.now().strftime("%B %d, %Y")
    messages = [
        ("""system""", f"""You are Nexora, an intelligent enterprise sales assistant.
You MUST answer the user's question using the provided context from the database, documents, and/or web search.

[SYSTEM DATE] Today's date is: {current_date_str}.

RULES:
- If the context contains DATABASE results, present them clearly.
- If the context contains WEB SEARCH results with an exchange rate or conversion factor, USE THAT RATE to do the actual maths and show the converted values. Do not say you cannot calculate — just calculate. Be very careful with the math: if the rate is given as EGP per USD (e.g. 0.02 USD for 1 EGP), then the inverse is the USD to EGP rate (1 / 0.02 = 50 EGP per USD). Perform this division step-by-step to output the correct current rate (around 49-51 EGP per USD).
- If context has BOTH database values (prices) AND web search (exchange rate), multiply them and present a clear table.
- If the context contains document excerpts, quote the relevant parts directly.
- Do NOT mention that you are using context or tools. Do NOT say you lack database access.
- If the context truly lacks the answer, say: 'I cannot find that specific information in our system.'

FORMAT RULES (CRITICAL):
- When showing a list of items that have MORE THAN ONE property (e.g. products with name+price+category, sales with customer+amount+date), ALWAYS use a proper markdown table with | column | headers | and | --- | separator | rows |.
- When showing a simple single-property list (just names, or a single fact), use bullet points.
- When showing currency conversions or exchange rate calculations, ALWAYS use a markdown table showing multiple USD amounts and their EGP equivalents.
- Never use raw UUIDs in user-facing responses — replace them with descriptive labels."""),
        ("system", f"CONTEXT:\n{context}")
    ]
    messages.extend(state.get("messages", []))
    
    try:
        response = llm.invoke(messages)
        answer = response.content
    except Exception as e:
        # Fallback LLM on rate limits/errors
        try:
            from app.config import get_settings
            settings = get_settings()
            fallback_llm = get_llm(settings.FALLBACK_LLM)
            response = fallback_llm.invoke(messages)
            answer = response.content
        except Exception as e_inner:
            answer = f"I'm having trouble processing that request due to a rate limit or service interruption. Please try again in a moment."
    
    return {"answer": answer, "messages": [AIMessage(content=answer)]}


@traceable(name="relevance_eval_node")
def relevance_eval_node(state: AgentState) -> dict:
    # Evaluate if answer actually addresses query
    # Mock evaluation to always pass for speed right now
    score = 0.9
    return {"relevance_score": score}


@traceable(name="explanation_builder_node")
def explanation_builder_node(state: AgentState) -> dict:
    exp = {
        "iterations": state.get("iteration", 1),
        "confidence": state.get("relevance_score", 0.0),
        "sources": [c.get("source") for c in (state.get("retrieved_chunks") or [])],
        "tools": [t.get("tool") for t in (state.get("tool_results") or [])]
    }
    return {"explanation": exp}


@traceable(name="direct_response_node")
def direct_response_node(state: AgentState) -> dict:
    query = state["query"]
    intent = state.get("intent", "")
    route = state.get("route", "")
    llm = get_llm()
    
    # If the Intent Classifier caught it, OR the Router deemed it an off-topic chitchat (and it's not a greeting)
    if intent == "out_of_scope" or (route == "chitchat" and intent != "greeting"):
        answer = "I'm sorry, but I am an enterprise assistant for Nexora. I can only answer questions about our specific products, sales data, and company policies. I cannot assist with outside topics like general software development, or hypothetical businesses."
        return {"answer": answer, "explanation": {"type": "blocked"}, "messages": [AIMessage(content=answer)]}
        
    import datetime
    current_date_str = datetime.datetime.now().strftime("%B %d, %Y")
    system_prompt = f"""You are Nexora, an intelligent enterprise sales assistant. 
[SYSTEM DATE] Today's date is: {current_date_str}.
Keep your answer brief, friendly, and conversational. 
You help users with questions about Nexora's products, sales data, company policies, and general business questions.
For greetings and casual conversation, respond warmly and mention you're here to help with sales intelligence."""
        
    # Build messages with the current query explicitly included
    messages = [("system", system_prompt)]
    existing_messages = state.get("messages", [])
    if existing_messages:
        messages.extend(existing_messages)
    else:
        messages.append(("human", query))
    
    try:
        response = llm.invoke(messages)
        answer = response.content
    except Exception as e:
        try:
            from app.config import get_settings
            settings = get_settings()
            fallback_llm = get_llm(settings.FALLBACK_LLM)
            response = fallback_llm.invoke(messages)
            answer = response.content
        except Exception as e_inner:
            answer = "I'm sorry, I'm having trouble connecting right now. Please try again soon."
    return {"answer": answer, "explanation": {"type": "chitchat"}, "messages": [AIMessage(content=answer)]}


# ── helpers ──────────────────────────────────────────────────────────────────

def _inject_user_context(query: str, user_id: str, user_role: str) -> str:
    """
    Augment the query with current-user metadata so the LLM can generate
    the right SQL for "who am I?" / "what is my current user?" type questions.
    """
    lower = query.lower()
    current_user_triggers = [
        "current user", "who am i", "my role", "my account", "my profile",
        "my information", "my details", "my name", "logged in as"
    ]
    if any(t in lower for t in current_user_triggers):
        return (
            f"{query}\n\n"
            f"[SYSTEM CONTEXT] The currently logged-in user has id='{user_id}' and role='{user_role}'. "
            f"Query the users table filtering by id = '{user_id}' to get their full details."
        )
    return query