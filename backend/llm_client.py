import os
import re
import time
from typing import List, Generator, Tuple
from groq import Groq
from dotenv import load_dotenv

# Load .env from the backend directory
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

# Crisis keywords list for local high-reliability detection
CRISIS_KEYWORDS = [
    r"\bsuicid", r"\bself[- ]harm", r"\bkill myself\b", r"\bend my life\b", 
    r"\bwant to die\b", r"\boverdos", r"\bhanging myself\b", r"\bcutting myself\b",
    r"\bworthless\b.*?\blife\b", r"\bno reason to live\b", r"\bbetter off dead\b"
]

def check_crisis_distress(text: str) -> bool:
    """
    Check if the user input contains high-distress crisis keywords.
    """
    text_lower = text.lower()
    for pattern in CRISIS_KEYWORDS:
        if re.search(pattern, text_lower):
            return True
    return False

def has_valid_groq_key() -> bool:
    """
    Checks if a valid Groq API key is present in environment variables.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or "placeholder" in api_key.lower() or api_key.strip() == "your_groq_api_key_here":
        return False
    return True

def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY environment variable is not set!")
    return Groq(api_key=api_key)

def build_prompt(context: str, history: List[Tuple[str, str]], question: str) -> List[dict]:
    """
    Constructs the system prompt and chat history according to the RAG memory requirements.
    """
    # Instruct the LLM to output its unified diagnostics metadata on the very first line of response
    system_prompt = (
        "You are MindEase, a compassionate and non-judgmental mental health companion.\n"
        "You never diagnose. You listen actively, reflect emotions back, and offer "
        "evidence-based coping strategies (CBT, mindfulness, grounding techniques).\n"
        "If the user expresses crisis-level distress, always provide hotline resources.\n\n"
        "CRITICAL INSTRUCTION: You MUST start your response with exactly one unified diagnostics metadata tag on the first line: "
        "'[ANALYSIS: sentiment=X, stress=Y, trauma=Z, emotion=W]', where:\n"
        "- X is a float between -1.0 and 1.0 (representing sentiment score)\n"
        "- Y is one of: Low, Moderate, High, Severe (representing stress severity)\n"
        "- Z is one of: Minimal, Elevated, High, Crisis (representing trauma risk)\n"
        "- W is one of: 🌿 Grounding, 💙 Empathy, 🧠 CBT Tip (representing primary technique/emotion)\n"
        "Output a newline and begin your helpful, empathetic response immediately after.\n\n"
        f"Context from knowledge base:\n{context}\n\n"
    )

    messages = [
        {"role": "system", "content": system_prompt}
    ]

    # Add last 5 history turns
    last_turns = history[-5:] if history else []
    for user_msg, bot_msg in last_turns:
        messages.append({"role": "user", "content": user_msg})
        # If bot_msg has an ANALYSIS header, strip it for history clean prompt
        clean_bot_msg = re.sub(r"^\[ANALYSIS:.*?\]\n*", "", bot_msg, flags=re.MULTILINE).strip()
        messages.append({"role": "assistant", "content": clean_bot_msg})

    # Add current question
    messages.append({"role": "user", "content": question})
    return messages

def stream_mock_chat_response(question: str) -> Generator[str, None, None]:
    """
    Generates realistic, empathetic mock responses with diagnostics tags.
    """
    q_lower = question.lower()
    is_crisis = check_crisis_distress(question)
    
    # Default values
    sentiment = 0.0
    stress = "Low"
    trauma = "Minimal"
    emotion = "🌿 Grounding"
    
    # Classification logic based on keywords
    if is_crisis:
        sentiment = -0.85
        stress = "Severe"
        trauma = "Crisis"
        emotion = "🌿 Grounding"
        reply = (
            "I can hear how much pain you're carrying, and I want to make sure you're safe. "
            "Please remember that you don't have to carry this alone. Please reach out to a professional "
            "or contact Tele-MANAS immediately by calling 14416 or Kiran Helpline at 1800-599-0019. They are free, 24/7, "
            "and confidential. \n\nLet's take a slow breath together: Inhale for 4 seconds... hold... and release."
        )
    elif any(k in q_lower for k in ["hopeless", "worthless", "giving up", "depressed", "depressing", "empty", "lonely"]):
        sentiment = -0.70
        stress = "Severe"
        trauma = "High"
        emotion = "💙 Empathy"
        reply = (
            "I'm so sorry you're feeling this way right now. Hearing that things feel hopeless is heavy, and it's "
            "completely valid that you're exhausted. I am here as a safe space to listen to whatever you want to share. "
            "Please take it one moment at a time. What is one small thing that feels grounding to you right now?"
        )
    elif any(k in q_lower for k in ["anxious", "anxiety", "panic", "scared", "fear", "worry", "worried", "stressed", "stress"]):
        sentiment = -0.45
        stress = "High"
        trauma = "Elevated"
        emotion = "🌿 Grounding"
        reply = (
            "It sounds like you're experiencing a high level of stress or anxiety right now. When thoughts start racing, "
            "it helps to bring our attention back to the present. Let's try the 5-4-3-2-1 grounding technique. "
            "Can you identify 5 things you can see around you, and 4 things you can physically touch?"
        )
    elif any(k in q_lower for k in ["tired", "exhausted", "fatigue", "overwhelmed", "burnout", "work", "pressure"]):
        sentiment = -0.30
        stress = "Moderate"
        trauma = "Minimal"
        emotion = "🧠 CBT Tip"
        reply = (
            "Burnout and exhaustion are very real, especially under high pressure. Let's check in on your boundaries today. "
            "It is okay to pause and resting is a necessary part of productivity. What is one small task you can remove or delegate "
            "from your list today to give yourself some breathing room?"
        )
    elif any(k in q_lower for k in ["happy", "good", "great", "better", "peace", "calm", "thank"]):
        sentiment = 0.65
        stress = "Low"
        trauma = "Minimal"
        emotion = "💙 Empathy"
        reply = (
            "I'm so glad to hear that! It's wonderful to take a moment to acknowledge these lighter, more peaceful spaces. "
            "Building mental wellness is just as much about celebrating stable, positive moments as it is navigating difficult ones. "
            "Keep up this self-care practice!"
        )
    else:
        # Neutral fallback
        sentiment = 0.00
        stress = "Low"
        trauma = "Minimal"
        emotion = "🌿 Grounding"
        reply = (
            "Thank you for sharing that with me. I'm here to listen and help you navigate whatever is on your mind. "
            "We can explore coping mechanisms, talk through any stress you're feeling, or practice a grounding exercise together. "
            "What would feel most supportive for you right now?"
        )
        
    meta_line = f"[ANALYSIS: sentiment={sentiment:.2f}, stress={stress}, trauma={trauma}, emotion={emotion}]"
    yield meta_line + "\n"
    
    # Stream output simulated
    words = reply.split(" ")
    for i, word in enumerate(words):
        yield word + (" " if i < len(words)-1 else "")
        time.sleep(0.01)

def stream_chat_response(
    messages: List[dict],
    question: str = ""
) -> Generator[str, None, None]:
    """
    Queries Groq LLaMA 3.3 70B and yields text fragments in real-time.
    Falls back automatically to local mock responses if API credentials are missing.
    """
    if not has_valid_groq_key():
        yield from stream_mock_chat_response(question)
        return
        
    client = get_groq_client()
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=0.9,
            stream=True
        )
        
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back to mock generator.")
        yield from stream_mock_chat_response(question)
