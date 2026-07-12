# API Reference Manual

This manual documents the REST endpoints and Server-Sent Events (SSE) streaming protocols implemented in the **MindEase AI Diagnostics Platform**.

---

## 1. Global Authentication
Endpoints marked with `JWT Required` require a signed JSON Web Token (JWT) transmitted via the standard HTTP Authorization header:
```http
Authorization: Bearer <your_access_token>
```

---

## 2. API Endpoints Reference

### 2.1 Start Session
Initializes a user session and retrieves a signed JWT access token.
- **URL**: `/api/session/start`
- **Method**: `POST`
- **Authentication**: None
- **Purpose**: Creates an active session context for tracking chat transcripts and mood check-ins.
- **Request Schema (JSON)**:
  - `email` (string, optional): User email address.
- **Example Payload**:
  ```json
  {
    "email": "developer@mindease.in"
  }
  ```
- **Response Schema (JSON)**:
  - `session_id` (string): Unique UUID assigned to the session.
  - `access_token` (string): HMAC SHA-256 JWT access token.
  - `token_type` (string): Protocol type (e.g. `bearer`).
- **Example Response**:
  ```json
  {
    "session_id": "ca51e6f3-ed7a-42c2-bca0-fa204b4c739c",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...",
    "token_type": "bearer"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid email schema.

---

### 2.2 Send Message (SSE Stream)
Streams back conversational dialogue fragments alongside diagnostic telemetry assessments.
- **URL**: `/api/chat`
- **Method**: `POST`
- **Authentication**: JWT Required
- **Purpose**: Processes text prompts, performs RAG context retrieval, executes diagnostics classifications, and opens a Server-Sent Events stream.
- **Request Schema (JSON)**:
  - `message` (string): User message input.
- **Example Payload**:
  ```json
  {
    "message": "I am feeling highly anxious and overwhelmed today from work."
  }
  ```
- **Response Schema**: `text/event-stream` (See Section 3 for the streaming packet sequence structure).
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid JWT token.
  - `422 Unprocessable Entity`: Request body validation failure.

---

### 2.3 Retrieve Chat History
Fetches the full sorted dialogue transcripts for a given session.
- **URL**: `/api/history/{session_id}`
- **Method**: `GET`
- **Authentication**: JWT Required
- **Purpose**: Restores the historical context inside the chat workspace window.
- **Request Schema**: Path parameter `session_id` (string).
- **Response Schema (JSON)**: Array of message records containing:
  - `id` (integer): Message index.
  - `role` (string): `user` or `assistant`.
  - `content` (string): Dialogue text.
  - `emotion_tag` (string, nullable): Tone classification.
  - `sentiment_score` (float, nullable): Score between `-1.00` and `+1.00`.
  - `stress_severity` (string, nullable): `Low`, `Moderate`, `High`, or `Severe`.
  - `trauma_risk` (string, nullable): `Minimal`, `Elevated`, `High`, or `Crisis`.
  - `timestamp` (string): UTC timestamp.
- **Example Response**:
  ```json
  [
    {
      "id": 12,
      "role": "user",
      "content": "I am feeling stressed",
      "emotion_tag": null,
      "sentiment_score": null,
      "stress_severity": null,
      "trauma_risk": null,
      "timestamp": "2026-07-12T15:30:00Z"
    },
    {
      "id": 13,
      "role": "assistant",
      "content": "It sounds like you're experiencing a high level of stress...",
      "emotion_tag": "🌿 Grounding",
      "sentiment_score": -0.45,
      "stress_severity": "High",
      "trauma_risk": "Elevated",
      "timestamp": "2026-07-12T15:30:02Z"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid JWT token.
  - `404 Not Found`: Session ID does not exist in SQLite database.

---

### 2.4 Log Daily Mood
Submits a self-reported mood rating log.
- **URL**: `/api/mood`
- **Method**: `POST`
- **Authentication**: JWT Required
- **Purpose**: Records daily check-in ratings to compile baseline mood trends.
- **Request Schema (JSON)**:
  - `score` (integer): Mood score from `1` (Heavy) to `10` (Vibrant).
  - `notes` (string, optional): Explanatory triggers.
- **Example Payload**:
  ```json
  {
    "score": 4,
    "notes": "Had a fight with my friend."
  }
  ```
- **Response Schema (JSON)**:
  - `success` (boolean): Process validation status.
  - `mood_id` (integer): SQLite primary key index.
  - `score` (integer): Submitted score.
  - `timestamp` (string): UTC timestamp.
- **Example Response**:
  ```json
  {
    "success": true,
    "mood_id": 8,
    "score": 4,
    "timestamp": "2026-07-12T15:31:00Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Score out of range (1-10).
  - `401 Unauthorized`: Invalid token credentials.

---

### 2.5 Retrieve Weekly Insights
Aggregates streak histories, average sentiments, stress distributions, and chronological logs.
- **URL**: `/api/insights`
- **Method**: `GET`
- **Authentication**: JWT Required
- **Purpose**: Feeds metrics and recommendations into the Insights page dashboard.
- **Response Schema (JSON)**:
  - `insight_text` (string): Coping summary recommendations.
  - `streak` (integer): Consecutive day count.
  - `common_words` (array): Frequency distribution.
  - `scores` (array): Historical rating lists.
  - `avg_sentiment` (float): Mean sentiment score.
  - `stress_distribution` (array): Categorized stress counts.
  - `trauma_distribution` (array): Categorized trauma counts.
  - `recent_diagnostics` (array): Last 10 conversation evaluations.
- **Example Response**:
  ```json
  {
    "insight_text": "Your daily mood check-ins are showing moderate fluctuations.",
    "streak": 1,
    "common_words": [{"text": "stressed", "value": 1}],
    "scores": [{"day": "Sun 12", "score": 4}],
    "avg_sentiment": -0.45,
    "stress_distribution": [
      {"level": "Low", "count": 0},
      {"level": "Moderate", "count": 0},
      {"level": "High", "count": 1},
      {"level": "Severe", "count": 0}
    ],
    "trauma_distribution": [
      {"level": "Minimal", "count": 0},
      {"level": "Elevated", "count": 1},
      {"level": "High", "count": 0},
      {"level": "Crisis", "count": 0}
    ],
    "recent_diagnostics": [
      {
        "message": "feeling stressed",
        "sentiment": -0.45,
        "stress": "High",
        "trauma": "Elevated",
        "emotion": "🌿 Grounding",
        "timestamp": "2026-07-12T15:30:02Z"
      }
    ]
  }
  ```

---

### 2.6 Upload PDF Guide
Ingests reference files into the semantic search engine.
- **URL**: `/api/upload-pdf`
- **Method**: `POST`
- **Authentication**: `X-Admin-Token` header required.
- **Purpose**: Segments uploaded PDFs and loads vector embeddings into ChromaDB.
- **Request Schema (Multipart Form)**:
  - `file`: PDF binary data.
- **Example Headers**:
  `X-Admin-Token: mindease-admin-bypass-key`
- **Response Schema (JSON)**:
  - `message` (string): Upload status.
  - `details` (object): Chunk processing summary.
- **Example Response**:
  ```json
  {
    "message": "Successfully parsed and embedded guide.pdf",
    "details": {
      "success": true,
      "chunks_added": 8,
      "pages_processed": 2
    }
  }
  ```

---

## 3. Server-Sent Events Payload Structure

The `/api/chat` endpoint yields events sequentially over an active connection using standard `data: ` block lines.

### 3.1 Event 1: Crisis Assessment
Dispatched instantly on connection to indicate if input requires immediate override redirection.
- **Structure**:
  `data: {"crisis": <boolean>}`
- **Example**:
  `data: {"crisis": false}`

### 3.2 Event 2: RAG Context Source
Dispatched when semantic reference context matches are found in ChromaDB.
- **Structure**:
  `data: {"rag_context": "<string>"}`
- **Example**:
  `data: {"rag_context": "[guide.pdf - Page 1]: Grounding techniques..."}`

### 3.3 Event 3: Diagnostics Telemetry
Dispatched after inference evaluates parameters, updating active charts and databases.
- **Structure**:
  `data: {"sentiment_score": <float>, "stress_severity": "<string>", "trauma_risk": "<string>", "emotion": "<string>"}`
- **Example**:
  `data: {"sentiment_score": -0.45, "stress_severity": "High", "trauma_risk": "Elevated", "emotion": "🌿 Grounding"}`

### 3.4 Events 4+: Text Stream Tokens
Dispatched sequentially to render responses in real-time.
- **Structure**:
  `data: {"text": "<string>"}`
- **Example**:
  `data: {"text": "It "}`
  `data: {"text": "sounds "}`
  `data: {"text": "like "}`
