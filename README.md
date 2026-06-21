# Nexora Sales Intelligence Platform

**Nexora** is an enterprise-grade, highly secure Agentic RAG (Retrieval-Augmented Generation) and Text-to-SQL platform designed specifically for sales organizations. It bridges the gap between unstructured company knowledge (policies, product catalogs) and structured live data (sales metrics, inventory), wrapped in a 4-layer security model that ensures strict Row-Level Security (RLS) and query sanitization.

## 🏗️ Architecture & Technology Stack

Nexora leverages a state-of-the-art AI stack to deliver sub-second, highly accurate, and secure intelligent responses.

### 🧠 Agent Intelligence & Orchestration
* **LangGraph**: Powers the core agent state machine, allowing for complex decision loops, self-correction, and iterative reasoning.
* **LangChain**: Framework for building the LLM tool integrations.
* **Groq**: Blazing-fast inference engine running Llama 3 and Mixtral models, enabling the agent to "think" in complex loops without user-facing latency.

### 🔍 Advanced Hybrid Retrieval (RAG)
* **Qdrant**: High-performance vector database for dense semantic search using `all-MiniLM-L6-v2` embeddings.
* **BM25**: In-memory sparse keyword retrieval to capture exact-match SKUs and domain-specific acronyms.
* **HuggingFace Cross-Encoders**: Acts as a re-ranker (`bge-reranker-base`) to score and filter the combined results from Qdrant and BM25, solving the "Lost in the Middle" problem.
* **HyDE (Hypothetical Document Embeddings)**: Query rewriting technique that generates hypothetical answers to improve vector space alignment.

### 🛡️ Security & Database
* **Supabase (PostgreSQL)**: Primary database utilizing strict Row-Level Security (RLS) policies to isolate data.
* **FastAPI**: High-performance Python backend managing the API routes and JWT authentication.
* **4-Layer Text-to-SQL Security**: 
  1. **Schema Filtering**: The LLM only sees the schema the user's role is permitted to see.
  2. **SQL Sanitization**: Regex and `sqlparse` block malicious statements (`DROP`, `DELETE`).
  3. **Role Validation**: Ensures the generated query aligns with the user's RBAC matrix.
  4. **RLS Injection**: Dynamically injects `user_id` and `role` context into the SQL before execution.

### ⚡ Caching & Observability
* **Upstash Redis**: Serverless Redis used for high-speed query caching, preventing redundant LLM calls for frequent queries.
* **LangSmith**: Deep agent observability, tracing every LLM thought, tool call, and token usage for continuous evaluation.
* **OpenTelemetry**: Distributed tracing for backend services (DB, Redis, Qdrant).
* **RAGAS**: Framework for automated evaluation of Faithfulness and Answer Relevance.

### 🎨 Frontend Presentation
* **Next.js 14 (App Router)**: React framework handling the user interface and routing.
* **Tailwind CSS & Framer Motion**: Delivers a premium, enterprise-grade glassmorphism UI with smooth micro-animations.
* **Server-Sent Events (SSE)**: Streams the agent's thought process and tokens in real-time to the user interface.

---

## 🚀 Getting Started

The platform is split into a Python FastAPI backend and a Next.js frontend.

### Running the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
