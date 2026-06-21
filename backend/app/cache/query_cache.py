import json
import hashlib
from typing import Optional
from app.dependencies import get_redis_client

class QueryCache:
    def __init__(self, redis_client=None):
        # Allow passing mock client for tests, otherwise get from dependencies
        self.redis = redis_client if redis_client else get_redis_client()
        
    def _hash_query(self, query: str, role: str) -> str:
        """Create a unique cache key based on query AND role (for security)."""
        # Lowercase and strip to normalize
        normalized_query = query.lower().strip()
        hash_input = f"{role}:{normalized_query}".encode('utf-8')
        return f"cache:{hashlib.md5(hash_input).hexdigest()}"
        
    def get(self, query: str, role: str) -> Optional[dict]:
        key = self._hash_query(query, role)
        result = self.redis.get(key)
        if result:
            return json.loads(result)
        return None
        
    def set(self, query: str, role: str, answer_data: dict, ttl: int = 3600):
        """Cache the answer for 1 hour by default."""
        key = self._hash_query(query, role)
        self.redis.setex(key, ttl, json.dumps(answer_data))
        
    def invalidate(self, query: str, role: str):
        key = self._hash_query(query, role)
        self.redis.delete(key)
