import logging
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name
        }
        if hasattr(record, "extra"):
            log_obj.update(record.extra)
        return json.dumps(log_obj)

def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Avoid adding handlers multiple times
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        
    return logger

def log_query(query: str, user: str, intent: str, route: str, latency: int):
    logger = setup_logger("query_logger")
    logger.info("Agent query processed", extra={
        "extra": {
            "query_length": len(query),
            "user_id": user,
            "intent": intent,
            "route": route,
            "latency_ms": latency
        }
    })
