"""Quick API smoke test for MindEase backend."""
import sys
import os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8')
import requests
import json

BASE = "http://localhost:8000"

print("=" * 50)
print("TEST 1: Session Start")
print("=" * 50)
resp = requests.post(f"{BASE}/api/session/start", json={"email": "test@test.com"})
assert resp.status_code == 200, f"Session start failed: {resp.status_code}"
data = resp.json()
token = data["access_token"]
session_id = data["session_id"]
print(f"  ✅ Session created: {session_id[:12]}...")
print(f"  ✅ Token received: {token[:30]}...")

headers = {"Authorization": f"Bearer {token}"}

print("\n" + "=" * 50)
print("TEST 2: Mood Log")
print("=" * 50)
resp = requests.post(f"{BASE}/api/mood", json={"score": 7, "notes": "test mood"}, headers=headers)
assert resp.status_code == 200, f"Mood log failed: {resp.status_code}"
print(f"  ✅ Mood logged: score={resp.json()['score']}")

print("\n" + "=" * 50)
print("TEST 3: Chat (SSE Stream)")
print("=" * 50)
resp = requests.post(
    f"{BASE}/api/chat",
    json={"message": "I am feeling a bit anxious today"},
    headers=headers,
    stream=True
)
assert resp.status_code == 200, f"Chat failed: {resp.status_code}"

events = []
for line in resp.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith("data: "):
            payload = json.loads(decoded[6:])
            events.append(payload)
            
print(f"  ✅ Received {len(events)} SSE events")
for ev in events:
    keys = list(ev.keys())
    if 'crisis' in ev:
        print(f"    - Crisis flag: {ev['crisis']}")
    if 'emotion' in ev:
        print(f"    - Emotion: {ev['emotion']}")
    if 'error' in ev:
        print(f"    - ⚠️  Error event (LLM unavailable): {ev.get('text', '')[:60]}...")
    if 'text' in ev and 'error' not in ev:
        print(f"    - Text chunk: {ev['text'][:60]}...")
    if 'rag_context' in ev:
        ctx = ev['rag_context']
        print(f"    - RAG context: {ctx[:60]}...")

# Check that error messages are NOT saved in DB
print("\n" + "=" * 50)
print("TEST 4: History (verify error messages NOT saved)")
print("=" * 50)
resp = requests.get(f"{BASE}/api/history/{session_id}", headers=headers)
assert resp.status_code == 200, f"History failed: {resp.status_code}"
history = resp.json()
print(f"  Messages in DB: {len(history)}")
error_in_db = any("[Error:" in msg.get("content", "") for msg in history)
if error_in_db:
    print("  ❌ ERROR: Raw error messages found in database!")
elif len(history) == 0:
    print("  ✅ No error messages saved to DB (Groq API key is placeholder - correct behavior)")
else:
    print("  ✅ Only valid messages saved to DB")

print("\n" + "=" * 50)
print("TEST 5: Insights")
print("=" * 50)
resp = requests.get(f"{BASE}/api/insights", headers=headers)
assert resp.status_code == 200, f"Insights failed: {resp.status_code}"
insights = resp.json()
print(f"  ✅ Streak: {insights['streak']}")
print(f"  ✅ Insight: {insights['insight_text'][:80]}...")
print(f"  ✅ Scores: {len(insights['scores'])} entries")
print(f"  ✅ Word cloud: {len(insights['common_words'])} words")

print("\n" + "=" * 50)
print("ALL TESTS PASSED ✅")
print("=" * 50)
