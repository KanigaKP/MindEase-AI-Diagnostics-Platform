import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import MoodLogModel, ChatMessageModel
from backend.llm_client import get_groq_client, has_valid_groq_key

def get_session_streak(db: Session, session_id: str) -> int:
    """
    Computes the consecutive days the user logged a mood score.
    """
    logs = db.query(MoodLogModel).filter(
        MoodLogModel.session_id == session_id
    ).order_by(desc(MoodLogModel.timestamp)).all()
    
    if not logs:
        return 0
        
    streak = 0
    current_date = datetime.utcnow().date()
    logged_dates = sorted(list(set(log.timestamp.date() for log in logs)), reverse=True)
    
    # Check if they logged today or yesterday
    if logged_dates[0] < current_date - timedelta(days=1):
        return 0
        
    for i in range(len(logged_dates)):
        if i == 0:
            if logged_dates[i] == current_date or logged_dates[i] == current_date - timedelta(days=1):
                streak += 1
        else:
            diff = logged_dates[i-1] - logged_dates[i]
            if diff.days == 1:
                streak += 1
            elif diff.days > 1:
                break
    return streak

def generate_weekly_insights(db: Session, session_id: str) -> dict:
    """
    Pulls mood history and chat context, feeds them to LLaMA 70B,
    and returns a summary of the weekly trends and topic words.
    """
    # 1. Fetch mood logs
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    mood_logs = db.query(MoodLogModel).filter(
        MoodLogModel.session_id == session_id,
        MoodLogModel.timestamp >= one_week_ago
    ).order_by(MoodLogModel.timestamp.asc()).all()
    
    # 2. Fetch recent user messages to generate topic/word tags
    chat_messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id,
        ChatMessageModel.role == "user",
        ChatMessageModel.timestamp >= one_week_ago
    ).all()

    if not mood_logs:
        return {
            "insight_text": "To view insights, please log your mood score using the check-in slider. Once you log a few entries, I will analyze your trends here.",
            "streak": get_session_streak(db, session_id),
            "common_words": [],
            "scores": []
        }

    # Format the inputs for the LLM
    mood_summary = ", ".join([f"Score: {log.score}/10 on {log.timestamp.strftime('%a')}" for log in mood_logs])
    avg_score = sum(log.score for log in mood_logs) / len(mood_logs)
    
    user_topics = " ".join([msg.content for msg in chat_messages])
    # Truncate text to avoid huge context sizes
    user_topics = user_topics[:4000]

    system_prompt = (
        "You are MindEase, a supportive mental health insights tracker.\n"
        "Your task is to analyze the user's weekly mood logs and brief text content, "
        "and write a short, empathetic analysis (2-3 sentences max). Make it positive, reflective, "
        "and suggest a concrete micro-exercise (e.g. box breathing or cognitive reframing).\n"
        "Do not diagnose. Maintain an encouraging and grounding tone."
    )
    
    user_prompt = (
        f"Here are the user's daily mood scores: [{mood_summary}]\n"
        f"Average Score: {avg_score:.1f}/10\n"
        f"Topics discussed: {user_topics if user_topics else 'General grounding and check-ins.'}\n\n"
        "Please provide the weekly summary report."
    )

    insight_text = "Your mood shows steady progress. Remember to practice mindfulness and check in regularly to track your growth."
    
    if not has_valid_groq_key():
        if avg_score >= 7.5:
            insight_text = (
                "Your cognitive telemetry indicates a stable and vibrant baseline this week. "
                "Coping indicators suggest high resilience. Continue incorporating active grounding "
                "mechanisms during quiet moments to sustain this positive emotional index."
            )
        elif avg_score >= 5.0:
            insight_text = (
                "Your daily mood check-ins are showing moderate fluctuations. "
                "While emotional states remain stable overall, cognitive loads are elevated. "
                "Consider practicing structured box breathing exercises during high-stress hours "
                "to reinforce emotional baseline signals."
            )
        else:
            insight_text = (
                "Telemetry analysis indicates severe emotional strain and high stress profiles this week. "
                "Somatic indicators suggest emotional exhaustion. We recommend triggering progressive grounding exercises, "
                "focusing on the 5-4-3-2-1 technique, and accessing the crisis safety hotlines in your terminal if you need direct support."
            )
    else:
        try:
            groq_client = get_groq_client()
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=250
            )
            insight_text = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating LLM insights: {e}")
            # Fallback to score-based mock
            if avg_score >= 7.5:
                insight_text = "Your cognitive telemetry indicates a stable and vibrant baseline this week. Coping indicators suggest high resilience."
            elif avg_score >= 5.0:
                insight_text = "Your daily mood check-ins show moderate fluctuations. Consider practicing structured box breathing exercises."
            else:
                insight_text = "Telemetry analysis indicates severe emotional strain this week. We recommend triggering progressive grounding exercises."

    # Generate a simple mock word cloud list from common topics (excluding boring words)
    stop_words = {"the", "and", "a", "of", "to", "in", "i", "my", "me", "feel", "am", "is", "it", "that", "was", "for", "on", "with", "as", "at", "by", "an", "be"}
    words = re.findall(r"\b[a-zA-Z]{4,12}\b", user_topics.lower())
    filtered_words = [w for w in words if w not in stop_words]
    
    # Count frequencies
    freq = {}
    for w in filtered_words:
        freq[w] = freq.get(w, 0) + 1
    
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    # Return top 8 words
    cloud_words = [{"text": w, "value": count * 5 + 10} for w, count in sorted_words[:8]]

    # If no word cloud items, create a few standard positive words
    if not cloud_words:
        cloud_words = [
            {"text": "Mindfulness", "value": 20},
            {"text": "Peace", "value": 15},
            {"text": "Healing", "value": 25},
            {"text": "Safety", "value": 18},
            {"text": "Calm", "value": 22}
        ]

    # Format return list of scores
    scores_data = [
        {"day": log.timestamp.strftime("%a %d"), "score": log.score} 
        for log in mood_logs
    ]

    # Fetch all user messages in the last 7 days to calculate stats
    all_user_messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id,
        ChatMessageModel.role == "user",
        ChatMessageModel.timestamp >= one_week_ago
    ).all()
    
    # Calculate average sentiment
    sentiment_scores = [msg.sentiment_score for msg in all_user_messages if msg.sentiment_score is not None]
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
    
    # Count stress severity
    stress_counts = {"Low": 0, "Moderate": 0, "High": 0, "Severe": 0}
    for msg in all_user_messages:
        if msg.stress_severity in stress_counts:
            stress_counts[msg.stress_severity] += 1
        elif msg.stress_severity:
            # Handle minor differences if any
            stress_counts["Low"] += 1
            
    # Count trauma risk
    trauma_counts = {"Minimal": 0, "Elevated": 0, "High": 0, "Crisis": 0}
    for msg in all_user_messages:
        if msg.trauma_risk in trauma_counts:
            trauma_counts[msg.trauma_risk] += 1
        elif msg.trauma_risk:
            # Handle minor differences if any
            trauma_counts["Minimal"] += 1

    stress_distribution = [{"level": k, "count": v} for k, v in stress_counts.items()]
    trauma_distribution = [{"level": k, "count": v} for k, v in trauma_counts.items()]
    
    recent_diagnostics = []
    for msg in all_user_messages[-10:]:
        recent_diagnostics.append({
            "message": msg.content,
            "sentiment": msg.sentiment_score or 0.0,
            "stress": msg.stress_severity or "Low",
            "trauma": msg.trauma_risk or "Minimal",
            "emotion": msg.emotion_tag or "🌿 Grounding",
            "timestamp": msg.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        })

    return {
        "insight_text": insight_text,
        "streak": get_session_streak(db, session_id),
        "common_words": cloud_words,
        "scores": scores_data,
        "avg_sentiment": avg_sentiment,
        "stress_distribution": stress_distribution,
        "trauma_distribution": trauma_distribution,
        "recent_diagnostics": recent_diagnostics
    }
