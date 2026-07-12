# Changelog

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-07-12

### Added
- **AI Diagnostics Pipeline**: Integrated real-time sentiment analysis, stress severity, and trauma risk classification.
- **Server-Sent Events (SSE) Processing**: Designed structured telemetry packet emissions in the `/api/chat` endpoint.
- **Heuristic Mock Fallback Engine**: Implemented `has_valid_groq_key` check in the LLM client to redirect request flows locally if Groq credentials are absent.
- **Self-Healing SQL Migrations**: Programmed startup schema inspections in `database.py` that dynamically add new columns to `chat_messages` without wiping tables.
- **Cyberpunk UI Redesign**: Rewrote `frontend/src/index.css` with glowing violet/cyan variables and glassmorphic panels.
- **Advanced Diagnostics Dashboard**: Rebuilt `Insights.jsx` with Recharts mood line charts, stress bar charts, and historical telemetry tables.
- **Automated Integration Tests**: Wrote `test_integration.py` to validate API streams and SQLite persistence against positive, moderate, severe, and crisis scenarios.

### Changed
- Refactored `useSSEStream.js` and `useMoodStore.js` to parse and store incoming diagnostics data.
- Redesigned the breathing pacer Landing gate and session initialization overlays.

---

## [1.0.0] - 2026-07-11

### Added
- Initial baseline release of the mental health chat companion.
- SQLite database schema configurations.
- LangChain RAG vector retrieval framework.
- Uvicorn backend execution routines.
