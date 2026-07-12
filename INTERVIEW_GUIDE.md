# Technical Interview Reference Guide

This guide compiles structural technical answers to system design, database choice, and streaming architecture questions concerning the **MindEase AI Diagnostics Platform**.

---

## 1. Why FastAPI?
FastAPI was selected for the backend service due to its native support for asynchronous execution (`async/await`) and ASGI servers like Uvicorn. This is critical for Server-Sent Events (SSE) streaming, where open connections must not block thread pools. Furthermore, FastAPI enforces request validation and data serialization using Pydantic, reducing runtime errors. The auto-generation of interactive Swagger UI documentation at `/docs` also speeds up frontend integration workflows.

---

## 2. Why React?
React was selected for the frontend application because of its component-based architecture and state lifecycle management. Using standard state hooks and Zustand, we can easily maintain modular UI states like active chat logs, volume controls, and dashboard configurations. React's virtual DOM reconciliation loop ensures fluid rendering of Recharts graphs and Framer Motion micro-animations without degrading performance.

---

## 3. Why SQLite?
SQLite was chosen for the local development database because it is a serverless, file-based engine. This removes the administrative overhead of configuring separate database services during developer onboarding. The entire database is contained within a single file (`backend/data/mindease.db`), allowing portable schema creation, rapid local transactions, and simplified testing.

---

## 4. Why ChromaDB?
ChromaDB is a lightweight vector database optimized for local AI development. It integrates directly with HuggingFace's sentence-transformers Python bindings, enabling local vector embedding storage and retrieval on CPU. This avoids the cost and network overhead of external vector storage APIs during the design phase.

---

## 5. Why Server-Sent Events (SSE) instead of WebSockets?
Server-Sent Events (SSE) was selected because the communication pattern of dialogue generation is unidirectional (server to client). User requests are sent as discrete HTTP POST payloads, and only the response requires streaming. Unlike WebSockets, SSE operates over standard HTTP/1.1 or HTTP/2 protocols, eliminating custom handshake configurations. SSE also includes built-in auto-reconnection and standard browser event-source decoding APIs out-of-the-box, making it simpler and more resilient than WebSockets.

---

## 6. Why use Retrieval-Augmented Generation (RAG)?
Generative Large Language Models (LLMs) can produce factual errors (hallucinations) and lack access to specific clinical guidelines. Integrating a RAG pipeline allows the backend to retrieve the top 2 matching context blocks from evidence-based coping documents stored in ChromaDB and inject them into the system prompt. This guarantees that all streamed recommendations are grounded in verified guidelines without requiring fine-tuning.

---

## 7. Offline Fallback Design
To ensure application resilience when external APIs are unavailable, the system implements a local heuristic mock engine. If the `GROQ_API_KEY` is invalid or missing, chat requests are intercepted. The mock engine parses the input text for specific distress keywords and streams back realistic, empathetic dialogues prepended with structured diagnostic telemetry tags matching the query severity. This ensures that the user interface, SQLite logging, and crisis overlays remain operational.

---

## 8. Database Migration Strategy
We implemented a self-healing schema migration script inside the backend startup lifecycle in `database.py`. On startup, the engine queries the active SQLite schema using SQLAlchemy's reflection inspectors. If newer columns (`sentiment_score`, `stress_severity`, `trauma_risk`) are absent in the `chat_messages` table, the script issues direct `ALTER TABLE` SQL commands. This updates developer instances automatically without losing historical user data.

---

## 9. Scalability Considerations
For production scaling, we recommend the following modifications:
- **Database**: Migrate the local SQLite engine to a managed **PostgreSQL** instance (such as Supabase) to support concurrent connection pooling and transaction logging.
- **Vector Store**: Transition ChromaDB to a managed cloud cluster (such as Qdrant or Pinecone) to isolate vector search workloads.
- **Compute**: Deploy the FastAPI container behind an Application Load Balancer (ALB) using GCP Cloud Run or AWS ECS Fargate, allocating a minimum of 2GB RAM per container to handle embeddings model weights.
- **Session Cache**: Deploy a Redis cluster to store active session tokens, enabling stateless container execution.

---

## 10. Deployment Considerations
When deploying to cloud hosts, manage environment secrets using cloud-native configuration managers rather than committing `.env` files. Terminate SSL at the load balancer level to enforce HTTPS, and update CORS configurations to restrict allowed origins specifically to the domain of your static frontend host.
