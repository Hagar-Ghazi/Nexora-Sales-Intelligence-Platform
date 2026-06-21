import re
from langsmith import traceable

INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?previous\s+instructions",
    r"act\s+as\s+(?:an?\s+)?(?:admin|root|system)",
    r"you\s+are\s+now",
    r"forget\s+your\s+(?:rules|instructions)",
    r"system\s+prompt",
    r"jailbreak",
    r"DAN\s+mode",
    r"pretend\s+you\s+are",
    r"\bDROP\s+TABLE\b",
    r"\bDELETE\s+FROM\b"
]

@traceable(name="detect_injection")
def detect_injection(query: str) -> tuple[bool, str]:
    query_lower = query.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, query_lower, re.IGNORECASE):
            return True, pattern
    return False, ""

def sanitize_input(query: str) -> str:
    # Strip null bytes and excessive whitespace
    query = query.replace("\x00", "")
    query = re.sub(r'\s+', ' ', query)
    return query.strip()
