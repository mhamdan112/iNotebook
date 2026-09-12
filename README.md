# iNotebook

iNotebook uses a React frontend, FastAPI API, Supabase Auth, and Supabase Postgres.

## Local setup

Create a root `.env` with the Supabase URL, public frontend key, server service-role key, API URL, and CORS origin. Never expose the service-role key to React.

Run the database setup once in the Supabase SQL Editor:

```text
supabase/schema.sql
```

Install and run the application:

```powershell
npm install
fastapi_app\.venv\Scripts\python.exe -m pip install -r fastapi_app\requirements.txt
npm run both
```

Open `http://localhost:3000`. FastAPI runs at `http://localhost:8000`, with API docs at `http://localhost:8000/docs`.

## Useful commands

```powershell
npm start
npm run build
fastapi_app\.venv\Scripts\python.exe -m uvicorn fastapi_app.main:app --reload --port 8000
```

## Deployment on Vercel

This repository deploys React and FastAPI together. Vercel serves the React build and sends `/api/*` requests to `api/index.py`.

Set these Vercel environment variables:

```text
REACT_APP_API_BASE_URL=https://your-app.vercel.app
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
CORS_ORIGIN=https://your-app.vercel.app
```

The service-role key must only be configured as a server environment variable. Run `npm run build` locally before deploying. The application no longer uses the retired Express, MongoDB, or Firebase backend.
