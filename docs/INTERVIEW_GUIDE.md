# Technical Interview Preparation Guide

This guide compiles structural technical answers to common architectural, system design, and database questions concerning the **MindEase** platform.

---

## 1. System Architecture Overview

MindEase is constructed on a decoupled client-server architecture. The frontend is a React 19 Single-Page Application (SPA) compiled via Vite, while the backend is an asynchronous ASGI service powered by FastAPI and Uvicorn. 

Data storage is split into two components:
1. **Relational Database**: A local SQLite database managed via the SQLAlchemy ORM for user session storage, message log preservation, and mood score telemetry.
2. **Vector Database**: A local ChromaDB collection that stores tokenized document chunks to support Retrieval-Augmented Generation (RAG) processes.

Interactions are processed asynchronously. Dialogues are initiated via HTTP POST, and replies are returned as a stream of Server-Sent Events (SSE). Real-time diagnostics evaluate incoming user statements to classify sentiment indices and distress markers.

---

## 2. Framework Decisions & System Design

### 2.1 Why FastAPI was Chosen
- **Asynchronous Execution (async/await)**: FastAPI supports non-blocking ASGI loops. This is crucial for SSE streaming operations where a connection must remain open for long durations without blockading thread pools.
- **Auto-generated Documentation**: FastAPI automatically produces OpenAPI-compliant JSON specs and interactive Swagger UI routes at `/docs` out-of-the-box.
- **Type Safety and Validation**: Integrations with Pydantic enforce compile-time and runtime type checking for request models, preventing payload corruption.

### 2.2 Why SQLite was Chosen
- **Low Administrative Overhead**: SQLite is a self-contained, serverless database engine. It requires zero server processes, simplifying initial developer setup.
- **Performance Characteristics**: Since user sessions are processed independently, SQLite's write lock behavior does not present blockades for local development.
- **Portability**: The entire database is stored in a single file (`backend/data/mindease.db`), enabling easy backups, tests, and configuration migrations.

### 2.3 Why ChromaDB was Chosen
- **Lightweight Embeddings Storage**: ChromaDB is a vector database optimized for local AI development. It integrates directly with sentence-transformers Python bindings.
- **Persistence**: Supports local filesystem persistence, enabling rapid indexing and context retrieval without requiring a separate network server.

### 2.4 Why SSE was Used Instead of WebSockets
- **Unidirectional Streaming Flow**: Empathetic chat responses require streaming data from server to client. Since user inputs are sent as discrete HTTP requests, full duplex communication is unnecessary.
- **Native Browser Support**: SSE is built upon standard HTTP protocols. Unlike WebSockets, it has built-in auto-reconnection mechanisms, handles firewalls easily, and utilizes simple stream decoders on the client.
- **Reduced Overhead**: SSE uses fewer network resources and runs on standard HTTP/1.1 or HTTP/2 ports (80/443), making it simpler to deploy behind standard reverse proxies.

---

## 3. Operations and Pipeline Workflows

### 3.1 Offline Fallback Architecture
To prevent application failures when external LLM providers are offline:
- The backend checks for a valid `GROQ_API_KEY` on startup.
- If invalid or absent, requests are routed to a local heuristic mock engine.
- This engine evaluates incoming text using keyword matching to categorize distress severity, and yields simulated empathetic responses alongside correctly formatted metadata.
- This guarantees that database writing, dashboard graphs, and crisis overlays continue working.

### 3.2 Database Migration Strategy
- MindEase uses a self-healing database check inside `database.py`.
- On server startup, the engine queries the active SQLite schema.
- If columns added in recent updates (`sentiment_score`, `stress_severity`, `trauma_risk`) are absent in the `chat_messages` table, the script issues direct `ALTER TABLE` SQL statements.
- This updates developer databases automatically without deleting existing rows.

### 3.3 Scalability Considerations
For production scaling, several components must be upgraded:
- **Database**: Migrate the SQLite engine to a managed **PostgreSQL** instance (such as Supabase or AWS RDS) to support concurrent connection pooling.
- **Vector Store**: Transition local ChromaDB to a managed cluster (such as Qdrant or Pinecone) to isolate search indexing compute workloads.
- **Server Instances**: Deploy the FastAPI container using container runners like Google Cloud Run or AWS ECS behind an Application Load Balancer (ALB).
- **Session Management**: Migrate in-memory session mappings to a Redis cache to support stateless, load-balanced backends.

### 3.4 Security Considerations
- **JWT Authorization**: Protect endpoints by requiring signed JSON Web Tokens for all chats and metrics logger routes.
- **Input Sanitization**: Validate payload variables using Pydantic models to prevent buffer overflows or injection payloads.
- **CORS Constraints**: Restrict allowed CORS origins from wildcards to specific client subdomains.
- **Admin Authentication**: Secure administrative endpoints (like `/api/upload-pdf`) with high-entropy token checks (`X-Admin-Token`).
