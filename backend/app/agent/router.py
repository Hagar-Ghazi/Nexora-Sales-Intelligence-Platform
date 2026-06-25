from enum import Enum
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langsmith import traceable

class RouteDestination(str, Enum):
    DOCUMENTS = "documents"
    DATABASE = "database"
    WEB_SEARCH = "web_search"
    BOTH = "both"              # documents + database
    DB_AND_WEB = "db_and_web"  # database + web search (e.g. prices + exchange rate)
    CHITCHAT = "chitchat"

class QueryRoute(BaseModel):
    destination: RouteDestination = Field(description="Where to route the query")
    reasoning: str = Field(description="Why this route was chosen")
    database_intent: str = Field(description="If database/both/db_and_web, what kind of data is needed (e.g. sales totals). Else empty string.")

ROUTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are the intelligent query router for an Enterprise RAG system.
Your job is to decide the best source of information to answer the user's query.

ROUTING RULES:
1. 'documents'   — The question is about product features, company policies, standard operating procedures,
                   troubleshooting, or "how-to" guides stored in the knowledge base.
2. 'database'    — The question asks for numbers, revenues, totals, rankings, counts, specific sales records,
                   comparisons of metrics over time, current user info, or lists of products/users/items
                   that live in our Supabase database.
3. 'web_search'  — The question needs LIVE or EXTERNAL information that is NOT in our database or documents:
                   exchange rates, currency conversions, current news, today's prices of external commodities,
                   general public knowledge, real-world facts, or anything requiring internet lookup.
4. 'both'        — The question requires BOTH documents (policies/features) AND database (live metrics/records).
5. 'db_and_web'  — The question requires BOTH database results AND a live web lookup.
                   Example: "Convert the max price of our products to Egyptian Pounds" needs product prices from
                   DB AND the current USD→EGP exchange rate from the web.
6. 'chitchat'    — Simple greetings, thanks, or completely off-topic conversation requiring no retrieval.

IMPORTANT EXAMPLES:
- "How many users are active?" → 'database'
- "What is the return policy?" → 'documents'
- "What is today's USD to EGP exchange rate?" → 'web_search'
- "Convert max price of our products to EGP" → 'db_and_web'
- "What is the policy for returns and how many returns this month?" → 'both'
- "Who am I / what is my current role?" → 'database'

User Role: {user_role}

Think carefully about the reasoning, then select the destination."""),
    ("human", "{query}")
])

@traceable(name="route_query")
def route_query(query: str, user_role: str, llm) -> QueryRoute:
    chain = ROUTER_PROMPT | llm.with_structured_output(QueryRoute)
    try:
        return chain.invoke({"query": query, "user_role": user_role})
    except Exception as e:
        # Try fallback LLM
        try:
            from app.config import get_settings
            from app.llm.router import get_llm
            settings = get_settings()
            fallback_llm = get_llm(settings.FALLBACK_LLM)
            fallback_chain = ROUTER_PROMPT | fallback_llm.with_structured_output(QueryRoute)
            return fallback_chain.invoke({"query": query, "user_role": user_role})
        except Exception as e_inner:
            # Fallback to documents
            return QueryRoute(
                destination=RouteDestination.DOCUMENTS,
                reasoning=f"Routing failed on both primary and fallback. Error: {str(e_inner)}",
                database_intent=""
            )
