import os
from datetime import datetime
import uuid
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'mindease.db')}"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    email = Column(String, nullable=True)

    messages = relationship("ChatMessageModel", back_populates="session", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLogModel", back_populates="session", cascade="all, delete-orphan")

class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    role = Column(String)  # "user" or "assistant"
    content = Column(String)
    emotion_tag = Column(String, nullable=True)  # e.g., "🌿 Grounding", "💙 Empathy", "🧠 CBT Tip"
    sentiment_score = Column(Float, nullable=True)  # -1.0 to 1.0
    stress_severity = Column(String, nullable=True)  # Low, Moderate, High, Severe
    trauma_risk = Column(String, nullable=True)  # Minimal, Elevated, High, Crisis
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("SessionModel", back_populates="messages")

class MoodLogModel(Base):
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    score = Column(Integer)  # 1-10
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("SessionModel", back_populates="mood_logs")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Self-healing migration for SQLite columns
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('chat_messages')]
        
        with engine.connect() as conn:
            altered = False
            if 'sentiment_score' not in columns:
                conn.execute(text("ALTER TABLE chat_messages ADD COLUMN sentiment_score FLOAT;"))
                print("Migration: Added sentiment_score column to chat_messages")
                altered = True
            if 'stress_severity' not in columns:
                conn.execute(text("ALTER TABLE chat_messages ADD COLUMN stress_severity VARCHAR;"))
                print("Migration: Added stress_severity column to chat_messages")
                altered = True
            if 'trauma_risk' not in columns:
                conn.execute(text("ALTER TABLE chat_messages ADD COLUMN trauma_risk VARCHAR;"))
                print("Migration: Added trauma_risk column to chat_messages")
                altered = True
            
            if altered:
                conn.commit()
    except Exception as e:
        print(f"Self-healing database migration warning: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
