# System Architecture and Component Blueprints

This document provides a detailed overview of the system architecture, component topologies, and data pipelines for the **MindEase** AI Diagnostics Platform.

---

## 1. High-Level Architecture Diagram

The system uses a decoupled client-server architecture. The React frontend interacts with the FastAPI backend through REST APIs and Server-Sent Events (SSE).

```mermaid
graph TD
    Client[React Client] <-->|REST / SSE| Backend[FastAPI Backend]
    Backend <-->|SQLAlchemy ORM| DB[(SQLite Database)]
    Backend <-->|Embeddings / Retrieval| VectorDB[(ChromaDB Vector Store)]
    Backend <-->|Inference Stream| LLM[Groq LLaMA Engine]
    Backend <-->|Local Fallback Heuristics| MockEngine[Mock Diagnostics Engine]
```

---

## 2. Authentication Flow Diagram

Authentication is token-based. Sessions are initiated anonymously or using an email, which is encoded in a JWT returned to the client.

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Auth as Security Core (JWT)
    participant DB as SQLite Database

    Client->>Auth: POST /api/session/start {email}
    Auth->>DB: Check or insert session record
    DB-->>Auth: Confirm record
    Auth->>Auth: Generate access_token (JWT signed)
    Auth-->>Client: Return token & session_id
```

---

## 3. Chat Request Lifecycle Diagram

This diagram displays the lifecycle of a user prompt, showing how context retrieval, diagnostics, and text streaming are orchestrated.

```mermaid
graph TD
    UserMsg[User Message] --> AuthCheck{JWT Valid?}
    AuthCheck -->|No| Reject[401 Unauthorized]
    AuthCheck -->|Yes| RAG[Retrieve ChromaDB Context]
    RAG --> ModelSelect{Groq Key Valid?}
    ModelSelect -->|Yes| Groq[Call Groq LLaMA 3.3]
    ModelSelect -->|No| Mock[Execute Heuristics Mock]
    Groq --> Extract[Extract Diagnostics Metadata]
    Mock --> Extract
    Extract --> Stream[Stream to SSE Pipeline]
    Stream --> Save[Commit Chat Message to SQLite]
```

---

## 4. Diagnostics Pipeline Diagram

The diagnostics pipeline extracts emotional indicators from user messages.

```mermaid
graph LR
    Input[User Input] --> Parse[Inference Engine]
    Parse --> Sentiment[Sentiment Score: -1.0 to 1.0]
    Parse --> Stress[Stress level: Low/Moderate/High/Severe]
    Parse --> Trauma[Trauma index: Minimal/Elevated/High/Crisis]
    Parse --> Tone[Tone Category: CBT/Grounding/Empathy]
```

---

## 5. RAG Retrieval Flowchart

This diagram outlines the process of chunking, embedding, indexing, and retrieving mental health guidelines.

```mermaid
graph TD
    PDF[Ingest Mental Health PDF] --> Chunk[Split: 750 Chars, 100 Overlap]
    Chunk --> Embed[Encode via sentence-transformers CPU]
    Embed --> Index[Store in ChromaDB Collection]
    UserQuery[User Chat Input] --> EncodeQuery[Encode via sentence-transformers CPU]
    EncodeQuery --> Search[Query ChromaDB for Top 2 Results]
    Search --> Context[Inject Context into System Prompt]
```

---

## 6. Crisis Escalation Workflow

When computed metrics exceed safety thresholds, the system overrides standard chat operations.

```mermaid
graph TD
    Input[Incoming Diagnostics Metadata] --> Check{Stress == Severe OR Trauma == Crisis?}
    Check -->|No| Normal[Render Chat Bubble with diagnostics metrics]
    Check -->|Yes| Alert[Trigger Crisis Overlay State]
    Alert --> Display[Overlay Support Hotlines & Box Breathing Pacer]
```

---

## 7. SSE Streaming Sequence Diagram

Server-Sent Events are utilized to stream response text concurrently with metadata payload chunks.

```mermaid
sequenceDiagram
    participant Client as React Client
    participant SSE as SSE Generator Loop
    participant Inference as Inference Service

    Client->>SSE: POST /api/chat {message}
    SSE->>Inference: Request stream
    Inference-->>SSE: [ANALYSIS: sentiment=X, stress=Y, trauma=Z]
    SSE-->>Client: data: {"sentiment_score": X, "stress_severity": Y}
    Inference-->>SSE: Response Text Token
    SSE-->>Client: data: {"text": "token"}
    Inference-->>SSE: Stream Ends
    SSE-->>Client: data: [DONE]
```

---

## 8. Database Entity Relationship Diagram

The relational data model tracks active sessions, chat history, and mood logs.

```mermaid
erDiagram
    SESSIONS ||--o{ CHAT_MESSAGES : holds
    SESSIONS ||--o{ MOOD_LOGS : tracks
    SESSIONS {
        string id PK
        datetime created_at
        string email
    }
    CHAT_MESSAGES {
        integer id PK
        string session_id FK
        string role
        string content
        string emotion_tag
        float sentiment_score
        string stress_severity
        string trauma_risk
        datetime timestamp
    }
    MOOD_LOGS {
        integer id PK
        string session_id FK
        integer score
        string notes
        datetime timestamp
    }
```

---

## 9. Application Startup Flow

The backend runs startup lifecycle checks before accepting incoming network requests.

```mermaid
graph TD
    Start[Uvicorn Startup] --> LoadEnv[Load .env Configurations]
    LoadEnv --> InitDB[Connect SQLite database]
    InitDB --> Migration{Missing columns in chat_messages?}
    Migration -->|Yes| Alter[Run ALTER TABLE SQL migrations]
    Migration -->|No| ChromaConnect[Connect local ChromaDB collection]
    Alter --> ChromaConnect
    ChromaConnect --> ModelLoad[Load sentence-transformers on CPU]
    ModelLoad --> Listen[FastAPI Ready and Listening on Port 8000]
```

---

## 10. Deployment Architecture Diagram

This diagram displays the multi-container configuration orchestrated using Docker Compose.

```mermaid
graph TD
    User([User Client Browser]) -->|Port 5173| Frontend[Vite React Frontend Container]
    Frontend -->|Port 8000| Backend[FastAPI Backend Container]
    Backend -->|Port 8001| Chroma[ChromaDB Vector Store Container]
    Backend -->|Local volume| SQLite[(SQLite Database File)]
```
