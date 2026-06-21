from typing import TypedDict, Annotated, Sequence, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # Input
    query: str
    user_id: str
    user_role: str  # sales | support | manager | admin
    
    # Routing & Classification
    intent: str  # greeting | business | out_of_scope | malicious
    route: str  # documents | database | both | chitchat
    route_reasoning: str
    
    # Processing
    rewritten_query: str
    iteration: int
    max_iterations: int
    
    # Retrieval
    retrieved_chunks: list[dict]  # [{content, source, page, score}]
    tool_results: list[dict]  # [{tool, result, source}]
    context: str
    
    # Evaluation
    relevance_score: float
    
    # Output
    answer: str
    explanation: dict  # {sources, tools_used, confidence, iterations}
    is_blocked: bool
    block_message: str
    
    # Conversation memory
    messages: Annotated[Sequence[BaseMessage], add_messages]
    
    # Metadata
    model_used: str
    latency_ms: int
    token_count_input: int
    token_count_output: int
