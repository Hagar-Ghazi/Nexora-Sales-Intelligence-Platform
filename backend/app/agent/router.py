from enum import Enum
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langsmith import traceable

class RouteDestination(str, Enum):
    DOCUMENTS = "documents"
    DATABASE = "database"
    BOTH = "both"
    CHITCHAT = "chitchat"

class QueryRoute(BaseModel):
    destination: RouteDestination = Field(description="Where to route the query")
    reasoning: str = Field(description="Why this route was chosen")
    database_intent: str = Field(description="If database/both, what kind of data is needed (e.g. sales totals). Else empty string.")

ROUTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are the intelligent query router for an Enterprise RAG system.
Your job is to decide the best source of information to answer the user's query.

ROUTING RULES:
1. 'documents': Choose this if the question is about product features, company policies, standard operating procedures, troubleshooting, or "how-to" guides.
2. 'database': Choose this if the question asks for numbers, revenues, totals, rankings, user counts, specific sales records, comparisons of metrics over time, or lists of products, users, or items.
3. 'both': Choose this if the question requires understanding a policy/feature AND looking up live metrics/data (e.g., "What is the policy for returns, and how many returns did I have this month?").
4. 'chitchat': Choose this for simple greetings, thanks, or completely off-topic conversation that needs no retrieval.

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
        # Fallback to documents
        return QueryRoute(
            destination=RouteDestination.DOCUMENTS,
            reasoning=f"Routing failed, defaulting to documents. Error: {str(e)}",
            database_intent=""
        )
