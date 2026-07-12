# Developer Installation Guide

This document outlines the steps required to configure, initialize, and run the **MindEase AI Diagnostics Platform** on a clean Windows development system.

---

## 1. Prerequisites

Verify that your system has the following requirements installed:

- **Python**: Version 3.10 to 3.14. Verify installation using:
  ```powershell
  python --version
  ```
- **Node.js & npm**: Version 18+ (Node) and 9+ (npm). Verify installation using:
  ```powershell
  node --version
  npm --version
  ```
- **Git**: Verification using:
  ```powershell
  git --version
  ```

---

## 2. Windows Execution Policy Configurations

On clean Windows installations, executing PowerShell scripts is disabled by default, causing scripts like virtual environment activators to fail with:
`script.ps1 cannot be loaded because running scripts is disabled on this system.`

To resolve this:
1. Open PowerShell as **Administrator**.
2. Run the command below to permit local script executions:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
   ```
3. Enter `Y` to confirm.

---

## 3. Directory Structure Setup

To avoid the Windows 260-character path limit (MAX_PATH) when installing dependencies such as PyTorch or ONNX, create your Python virtual environment (`venv`) outside nested folders.

### Step 3.1: Navigate to the Workspace Directory
```powershell
cd "c:\Users\sarca\OneDrive\Documents\projects\stress-trauma-detection"
```

---

## 4. Backend Service Installation

### Step 4.1: Initialize the Python Virtual Environment
Construct the virtual environment at a shortened directory path:
```powershell
python -m venv c:\Users\sarca\OneDrive\Documents\projects\stress-trauma-detection\venv
```

### Step 4.2: Activate the Virtual Environment
Activate the environment in your PowerShell console:
```powershell
c:\Users\sarca\OneDrive\Documents\projects\stress-trauma-detection\venv\Scripts\Activate.ps1
```

### Step 4.3: Install Python Dependencies
Update package managers and install requirements:
```powershell
python -m pip install --upgrade pip
pip install -r mental-health-support-chat-bot--main/mental-health-support-chat-bot--main/backend/requirements.txt
```
This command installs:
- FastAPI and Uvicorn.
- SQLAlchemy ORM.
- ChromaDB vector search clients.
- sentence-transformers for local text embeddings.
- PyTorch (CPU-only version).

### Step 4.4: Configure Environment Variables
Create a `.env` file in the `backend/` directory. Use the template below:
```env
# Groq Cloud API Key (Optional. Leave placeholder to run in Heuristic Mock Mode)
GROQ_API_KEY=gsk_your_groq_api_key_placeholder

# Security Configurations
JWT_SECRET=mindease-neon-cyber-secret-hash-1337-replace-in-production
ADMIN_TOKEN=mindease-admin-bypass-key

# Vector Database Configurations
CHROMA_HOST=localhost
CHROMA_PORT=8001
```

---

## 5. Database Initialization

The relational SQLite database compiles schemas automatically on backend startup. The startup script (`backend/database.py`) executes non-destructive schema migrations to verify that the target tables match all active models.

Start the FastAPI application server to initialize the database:
```powershell
cd mental-health-support-chat-bot--main/mental-health-support-chat-bot--main/backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Upon startup, the database file `mindease.db` is created in the `backend/data/` folder.

---

## 6. Frontend Client Installation

### Step 6.1: Install Node Dependencies
Open a second PowerShell console, navigate to the frontend directory, and run the installation script:
```powershell
cd "c:\Users\sarca\OneDrive\Documents\projects\stress-trauma-detection\mental-health-support-chat-bot--main\mental-health-support-chat-bot--main\frontend"
npm install
```

### Step 6.2: Configure Frontend Environments
Create a `.env` file pointing the React client to your backend server:
```env
VITE_API_URL=http://localhost:8000
```

### Step 6.3: Start Client Dev Server
Execute the launch script:
```powershell
npm run dev
```
Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## 7. Troubleshooting Guide

### 7.1 Port 8000 Conflict
- **Problem**: Backend fails to run with `[Errno 10048] address already in use`.
- **Fix**: Locate the active process running on port 8000 and terminate it:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
  ```

### 7.2 ChromaDB connection warnings
- **Problem**: Uvicorn prints `Failed to connect to ChromaDB server... Falling back to local DB.`
- **Fix**: This is expected behavior during local development. The system falls back to a self-contained local SQLite vector indexing engine and processes RAG lookups correctly. If deploying in a containerized environment, ensure the separate `chroma` service container is running.
