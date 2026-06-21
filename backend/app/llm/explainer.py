from typing import List, Dict, Any

def format_sources(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Formats retrieved chunks into a clean sources list."""
    sources = []
    seen = set()
    
    for chunk in chunks:
        source_name = chunk.get("source", "Unknown Document")
        page = chunk.get("page", 1)
        
        # Simple deduplication by source + page
        identifier = f"{source_name}_p{page}"
        if identifier not in seen:
            seen.add(identifier)
            sources.append({
                "document": source_name,
                "page": page,
                "relevance_score": chunk.get("score", 0.0)
            })
            
    return sources

def build_explanation(chunks: List[Dict[str, Any]], tools_used: List[str], score: float, iterations: int) -> dict:
    """
    Builds the structured explanation object that the frontend will render
    to show the user exactly HOW the agent arrived at its answer.
    """
    return {
        "confidence_score": score,
        "iterations": iterations,
        "tools_used": tools_used,
        "sources": format_sources(chunks)
    }
