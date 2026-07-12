# Deployment and Infrastructure Guide

This guide outlines deployment configurations, database migration procedures, environment variable management, and network security parameters for the **MindEase AI Diagnostics Platform**.

---

## 1. Local Deployment
Local configurations utilize the embedded Uvicorn server and Vite client. Follow the instructions in [INSTALLATION.md](file:///c:/Users/sarca/OneDrive/Documents/projects/stress-trauma-detection/mental-health-support-chat-bot--main/mental-health-support-chat-bot--main/INSTALLATION.md) to launch the environment.

---

## 2. Docker Deployment (Orchestration Stack)

The system includes a root `docker-compose.yml` defining a multi-container stack.

### 2.1 Services Layout
- **`chroma`**: Managed vector database engine running on port 8001.
- **`backend`**: FastAPI application service running on port 8000.
- **`frontend`**: React static builder serving assets on port 5173.

### 2.2 Execution
Deploy the container stack in detached mode:
```bash
docker-compose up --build -d
```
Verify container statuses:
```bash
docker-compose ps
```

---

## 3. Cloud Deployment Procedures

### 3.1 Render Deployment
1. **FastAPI Backend**:
   - Create a new **Web Service** on Render.
   - Point Render to your repository.
   - Set **Runtime** to `Python 3` (or choose `Docker` to use the provided `Dockerfile`).
   - Define the build command: `pip install -r backend/requirements.txt`
   - Define the start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add your environment variables in the Render Dashboard (see Section 5).
2. **React Frontend**:
   - Create a new **Static Site** on Render.
   - Set the build command: `npm run build`
   - Set the publish directory: `dist`
   - Set the environment variable `VITE_API_URL` to point to the live Render Backend Web Service URL.

### 3.2 Railway Deployment
1. Connect your GitHub repository to Railway.
2. Railway detects the `docker-compose.yml` or standard config:
   - For the **Backend**: Allocate a custom service pointing to the `backend/` subdirectory. Define the environment variables.
   - For the **Frontend**: Allocate a separate static service pointing to the `frontend/` subdirectory. Configure `VITE_API_URL` as a build-time variable.

### 3.3 Vercel Deployment (Frontend Only)
1. Link your repository in Vercel.
2. Select the `frontend` folder as the root directory.
3. Configure the framework preset to **Vite**.
4. Define the build variable:
   - Name: `VITE_API_URL`
   - Value: `<your_deployed_fastapi_backend_url>`
5. Click **Deploy**.

---

## 4. Production Database Migrations

For multi-user staging and production scaling, migrate the local SQLite file storage to PostgreSQL or Supabase.

### 4.1 Install Driver
Install the PostgreSQL engine driver:
```bash
pip install psycopg2-binary
```

### 4.2 Supabase / PostgreSQL Configuration
1. Provision a PostgreSQL database instance on Supabase.
2. Retrieve the transaction or session connection string.
3. Update the `DATABASE_URL` environment variable inside your production container variables:
   ```env
   DATABASE_URL=postgresql://postgres.your_project:your_password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
4. Upon server initialization, the migration logic inside `backend/database.py` evaluates the new PostgreSQL target and generates all table schemas, primary keys, and indexes automatically.

---

## 5. Security & Network Configuration

### 5.1 Environment Variable Management
Never commit `.env` files containing production secrets to git. Manage credentials using:
- **Render Environment Groups**
- **Railway Shared Variables**
- **Vercel Project Settings**

### 5.2 HTTPS Configuration
- Enforce secure connections in production. If utilizing cloud hosts (such as Render or Railway), SSL termination is managed automatically at their load balancers.
- To enforce HTTPS at the FastAPI level, configure `HTTPSRedirectMiddleware` inside `backend/main.py`:
  ```python
  from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
  app.add_middleware(HTTPSRedirectMiddleware)
  ```

### 5.3 CORS Configuration
Update the Allowed Origins list in `backend/main.py` to match the exact URL of your static frontend host:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
