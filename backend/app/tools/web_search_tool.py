"""
Web search tool using multiple DuckDuckGo strategies.
No API key or billing required. Returns plain-text snippets
that the LLM uses to answer questions needing live/external data
(exchange rates, news, real-world lookups, etc.).
"""
import httpx
import re
import logging
from langsmith import traceable

logger = logging.getLogger(__name__)


def _clean(text: str) -> str:
    """Remove HTML tags and excessive whitespace."""
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


@traceable(name="web_search_tool")
async def web_search(query: str, max_results: int = 5) -> str:
    """
    Search the web via DuckDuckGo and return the top snippets
    as a single formatted string.

    Strategy:
    1. Try duckduckgo_search Python library (most reliable, handles anti-bot)
    2. Fallback: DuckDuckGo HTML scrape with full browser headers + cookies
    3. Fallback: DuckDuckGo instant-answer JSON API
    """
    # Strategy 1: Use the duckduckgo_search library
    try:
        from duckduckgo_search import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                body = r.get("body", "").strip()
                if body:
                    results.append(f"• {body}")
        if results:
            logger.info(f"Web search via DDGS: {len(results)} results for '{query}'")
            return "Web Search Results:\n" + "\n".join(results)
    except ImportError:
        logger.warning("duckduckgo_search not installed, falling back to HTTP scrape.")
    except Exception as e:
        logger.warning(f"duckduckgo_search library failed: {e}")

    # Strategy 2: DuckDuckGo HTML scrape with full browser headers + cookies
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cookie": "dcm=3; ay=b",  # Consent/redirect bypass cookies
            "Referer": "https://duckduckgo.com/",
        }
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query, "kl": "us-en"},
                headers=headers,
            )
            if resp.status_code == 200 and "result__snippet" in resp.text:
                raw = resp.text
                result_texts = re.findall(
                    r'class="result__snippet"[^>]*>(.*?)</(?:a|span)>', raw, re.DOTALL
                )
                if result_texts:
                    cleaned = [_clean(t) for t in result_texts[:max_results] if _clean(t)]
                    if cleaned:
                        logger.info(f"Web search via HTML scrape: {len(cleaned)} results")
                        return "Web Search Results:\n" + "\n".join(f"• {c}" for c in cleaned)
    except Exception as e:
        logger.warning(f"DuckDuckGo HTML scrape failed: {e}")

    # Strategy 3: DuckDuckGo instant-answer JSON API
    try:
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params=params,
                headers={"User-Agent": "Mozilla/5.0 (compatible; Nexora/1.0)"},
            )
            resp.raise_for_status()
            data = resp.json()

        snippets: list[str] = []
        answer = _clean(data.get("Answer", ""))
        if answer:
            snippets.append(f"[Direct Answer] {answer}")
        abstract = _clean(data.get("AbstractText", ""))
        if abstract:
            source = data.get("AbstractSource", "DuckDuckGo")
            snippets.append(f"[{source}] {abstract}")
        infobox = data.get("Infobox", {})
        if isinstance(infobox, dict):
            for item in infobox.get("content", [])[:3]:
                label = item.get("label", "")
                value = item.get("value", "")
                if label and value:
                    snippets.append(f"• {label}: {value}")
        for topic in data.get("RelatedTopics", [])[:max_results]:
            if isinstance(topic, dict) and "Text" in topic:
                text = _clean(topic["Text"])
                if text:
                    snippets.append(f"• {text}")
        if snippets:
            logger.info(f"Web search via JSON API: {len(snippets)} results")
            return "Web Search Results:\n" + "\n".join(snippets[:max_results + 2])

    except Exception as e:
        logger.warning(f"DuckDuckGo JSON API fallback failed: {e}")

    return "Web search returned no relevant results for this query."
