import os
import json
import uuid
import re
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Header, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel, Field

from backend.database import init_db, get_db, SessionModel, ChatMessageModel, MoodLogModel
from backend.security import create_session_token, get_current_session_id
from backend.rag_pipeline import retrieve_context, process_and_embed_pdf, PDF_DIR
from backend.llm_client import check_crisis_distress, build_prompt, stream_chat_response
from backend.mood_tracker import generate_weekly_insights

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MindEase API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda r, e: JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please slow down."}
    )
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)

# Create database tables at startup
@app.on_event("startup")
def on_startup():
    init_db()

# Pydantic Schemas
class StartSessionRequest(BaseModel):
    email: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)

class MoodRequest(BaseModel):
    score: int = Field(..., ge=1, le=10)
    notes: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    emotion_tag: Optional[str] = None
    sentiment_score: Optional[float] = None
    stress_severity: Optional[str] = None
    trauma_risk: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# --- API ENDPOINTS ---

@app.post("/api/session/start")
@limiter.limit("15/minute")
def start_session(request: Request, req: StartSessionRequest, db: Session = Depends(get_db)):
    """
    Creates a new anonymous or email session and returns a JWT access token.
    """
    session_id = str(uuid.uuid4())
    db_session = SessionModel(id=session_id, email=req.email)
    db.add(db_session)
    db.commit()
    
    token = create_session_token(session_id, req.email)
    return {
        "session_id": session_id,
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat_endpoint(
    request: Request,
    req: ChatRequest,
    session_id: str = Depends(get_current_session_id),
    db: Session = Depends(get_db)
):
    """
    Streams SSE response containing matching PDF RAG context, last 5 chat turns,
    and character typewriter response chunks from LLaMA 70B.
    """
    user_message = req.message
    
    # 1. Local crisis keywords check
    is_crisis = check_crisis_distress(user_message)
    
    # 2. Retrieve history (last 5 turns)
    history_records = db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id
    ).order_by(ChatMessageModel.timestamp.asc()).all()
    
    # Structure messages as list of tuples (user, assistant)
    history = []
    temp_user = None
    for msg in history_records:
        if msg.role == "user":
            temp_user = msg.content
        elif msg.role == "assistant" and temp_user is not None:
            history.append((temp_user, msg.content))
            temp_user = None

    # 3. Query RAG context from ChromaDB
    rag_context = retrieve_context(user_message, k=3)
    
    # 4. Formulate LLM prompts
    messages = build_prompt(context=rag_context, history=history, question=user_message)
    
    # SSE Stream generator
    async def sse_generator():
        # First send crisis meta-data if triggered
        if is_crisis:
            yield f"data: {json.dumps({'crisis': True})}\n\n"
        else:
            yield f"data: {json.dumps({'crisis': False})}\n\n"
            
        # Send raw context snippet back (optional, helps trace RAG source)
        yield f"data: {json.dumps({'rag_context': rag_context})}\n\n"
        
        buffer = ""
        analysis_extracted = False
        sentiment_score = 0.0
        stress_severity = "Low"
        trauma_risk = "Minimal"
        emotion_tag = "🌿 Grounding"
        full_response = ""
        has_error = False
        
        # Stream from Groq client
        for chunk in stream_chat_response(messages, question=user_message):
            # Detect error messages from the LLM client
            if chunk.startswith("[Error:"):
                has_error = True
                error_msg = "I'm having a moment of reflection and can't respond right now. Please try again in a moment."
                yield f"data: {json.dumps({'emotion': emotion_tag})}\n\n"
                yield f"data: {json.dumps({'error': True, 'text': error_msg})}\n\n"
                full_response = error_msg
                print(f"LLM streaming error detected: {chunk}")
                break
                
            if not analysis_extracted:
                buffer += chunk
                # Scan for [ANALYSIS: sentiment=X, stress=Y, trauma=Z, emotion=W]
                if "\n" in buffer:
                    first_line, remaining = buffer.split("\n", 1)
                    match = re.search(r"\[ANALYSIS:\s*sentiment=(.*?),\s*stress=(.*?),\s*trauma=(.*?),\s*emotion=(.*?)\]", first_line)
                    if match:
                        try:
                            sentiment_score = float(match.group(1).strip())
                            stress_severity = match.group(2).strip()
                            trauma_risk = match.group(3).strip()
                            emotion_tag = match.group(4).strip()
                        except Exception as parse_err:
                            print(f"Error parsing metadata values: {parse_err}")
                        
                        yield f"data: {json.dumps({
                            'sentiment_score': sentiment_score,
                            'stress_severity': stress_severity,
                            'trauma_risk': trauma_risk,
                            'emotion': emotion_tag
                        })}\n\n"
                        analysis_extracted = True
                        buffer = remaining
                        if buffer:
                            yield f"data: {json.dumps({'text': buffer})}\n\n"
                            full_response += buffer
                    else:
                        # Fallback parsing for old first line format [EMOTION: ...]
                        match_old = re.search(r"\[EMOTION:\s*(.*?)\]", first_line)
                        if match_old:
                            emotion_tag = match_old.group(1).strip()
                        yield f"data: {json.dumps({'emotion': emotion_tag})}\n\n"
                        analysis_extracted = True
                        buffer = remaining
                        if buffer:
                            yield f"data: {json.dumps({'text': buffer})}\n\n"
                            full_response += buffer
                elif len(buffer) > 120:
                    # Fallback if AI didn't format tags correctly
                    yield f"data: {json.dumps({'emotion': emotion_tag})}\n\n"
                    analysis_extracted = True
                    yield f"data: {json.dumps({'text': buffer})}\n\n"
                    full_response += buffer
                    buffer = ""
            else:
                yield f"data: {json.dumps({'text': chunk})}\n\n"
                full_response += chunk
                
        # 5. Insert history records into SQLite database after stream finishes
        # Only save to DB if we got a valid (non-error) response
        if full_response.strip() and not has_error:
            try:
                db_user_msg = ChatMessageModel(
                    session_id=session_id,
                    role="user",
                    content=user_message,
                    sentiment_score=sentiment_score,
                    stress_severity=stress_severity,
                    trauma_risk=trauma_risk,
                    emotion_tag=emotion_tag,
                    timestamp=datetime.utcnow()
                )
                db.add(db_user_msg)
                
                db_bot_msg = ChatMessageModel(
                    session_id=session_id,
                    role="assistant",
                    content=full_response.strip(),
                    sentiment_score=sentiment_score,
                    stress_severity=stress_severity,
                    trauma_risk=trauma_risk,
                    emotion_tag=emotion_tag,
                    timestamp=datetime.utcnow()
                )
                db.add(db_bot_msg)
                db.commit()
            except Exception as err:
                print(f"Error saving chat logs to DB: {err}")
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@app.get("/api/history/{session_id}", response_model=List[MessageResponse])
@limiter.limit("20/minute")
def get_chat_history(
    request: Request,
    session_id: str,
    active_session: str = Depends(get_current_session_id),
    db: Session = Depends(get_db)
):
    """
    Returns the message history for the current session.
    """
    # Ensure they can only query their own history
    if active_session != session_id:
        raise HTTPException(status_code=403, detail="Access denied to this session's history.")
        
    messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id
    ).order_by(ChatMessageModel.timestamp.asc()).all()
    
    return messages

@app.post("/api/mood")
@limiter.limit("15/minute")
def log_mood(
    request: Request,
    req: MoodRequest,
    session_id: str = Depends(get_current_session_id),
    db: Session = Depends(get_db)
):
    """
    Logs user mood score (1-10) with timestamp.
    """
    mood_entry = MoodLogModel(
        session_id=session_id,
        score=req.score,
        notes=req.notes,
        timestamp=datetime.utcnow()
    )
    db.add(mood_entry)
    db.commit()
    db.refresh(mood_entry)
    
    return {
        "success": True,
        "mood_id": mood_entry.id,
        "score": mood_entry.score,
        "timestamp": mood_entry.timestamp
    }

@app.get("/api/insights")
@limiter.limit("10/minute")
def get_insights(
    request: Request,
    session_id: str = Depends(get_current_session_id),
    db: Session = Depends(get_db)
):
    """
    Returns weekly mood averages, check-in streak, and word cloud tags compiled via LLaMA.
    """
    insights_data = generate_weekly_insights(db, session_id)
    return insights_data

@app.post("/api/upload-pdf")
@limiter.limit("5/minute")
def upload_knowledge_pdf(
    request: Request,
    file: UploadFile = File(...),
    x_admin_token: str = Header(None, alias="X-Admin-Token"),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to upload reference mental health guides, split text, re-embed, and load to ChromaDB.
    """
    ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "mindease-admin-pass")
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Token header."
        )
        
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported.")
        
    file_path = os.path.join(PDF_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
            
        print(f"Admin uploaded {file.filename}, initiating embedding...")
        result = process_and_embed_pdf(file_path)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error"))
            
        return {
            "message": f"Successfully parsed and embedded {file.filename}",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
