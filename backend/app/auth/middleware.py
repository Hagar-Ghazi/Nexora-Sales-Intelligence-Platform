from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.auth.jwt_handler import extract_user_from_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow open routes
        if request.url.path in ["/health", "/health/detailed", "/metrics", "/docs", "/openapi.json"] or request.method == "OPTIONS":
            return await call_next(request)
            
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing or invalid authorization header"})
            
        token = auth_header.split(" ")[1]
        try:
            user_context = extract_user_from_token(token)
            # Inject user context into request state for route handlers
            request.state.user = user_context
        except Exception as e:
            return JSONResponse(status_code=401, content={"detail": str(e)})
            
        return await call_next(request)
