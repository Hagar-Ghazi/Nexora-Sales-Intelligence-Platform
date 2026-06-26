from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize startup events here
    print("Starting up Enterprise Agentic RAG backend...")
    yield
    print("Shutting down...")

app = FastAPI(
    title="Enterprise Agentic RAG API",
    description="Backend API for the Agentic RAG system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.feedback import router as feedback_router
from app.api.users import router as users_router
from app.api.health import router as health_router
from app.api.dashboard import router as dashboard_router

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(feedback_router)
app.include_router(users_router)
app.include_router(health_router)
app.include_router(dashboard_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Enterprise Agentic RAG API"}
