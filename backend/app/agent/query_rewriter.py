from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langsmith import traceable

HYDE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert at information retrieval.
Please write a hypothetical, detailed answer to the user's question.
This answer will be used for similarity search in a vector database, so focus on including the right terminology, keywords, and concepts that would likely appear in a relevant document.
Do not worry if you don't know the actual facts; plausibility and correct vocabulary are what matters.
Write a concise paragraph (no more than 4-5 sentences)."""),
    ("human", "{query}")
])

SIMPLE_REWRITE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert query optimizer. 
Rewrite the following user query to be more specific and optimized for a keyword search engine.
Extract the core entities and intent. Do not answer the query. Just output the optimized query string."""),
    ("human", "{query}")
])

@traceable(name="hyde_rewrite")
def hyde_rewrite(query: str, llm) -> str:
    """
    HyDE (Hypothetical Document Embeddings) is an agentic RAG technique.
    Instead of embedding the user's short query, we ask the LLM to generate a hypothetical answer.
    We then embed this hypothetical answer. Why? Because the embedding of a hypothetical answer
    is mathematically closer in the vector space to the actual document containing the answer,
    compared to the embedding of the question itself.
    """
    chain = HYDE_PROMPT | llm | StrOutputParser()
    try:
        return chain.invoke({"query": query})
    except Exception:
        return query

@traceable(name="simple_rewrite")
def simple_rewrite(query: str, llm) -> str:
    chain = SIMPLE_REWRITE_PROMPT | llm | StrOutputParser()
    try:
        return chain.invoke({"query": query})
    except Exception:
        return query
