# GuideLoom Backend (scaffold)

This folder is a minimal Express scaffold for GuideLoom. It exposes simple endpoints for demo and local development.

Quick start (Windows PowerShell):

```powershell
cd d:/myfolders/Roadmaps/guideloom-backend
npm install
$env:JWT_SECRET = 'dev-secret'
npm run dev
```

API endpoints:

- GET /api/health
- GET /api/roadmaps
- GET /api/roadmaps/:slug
- POST /api/auth/login  (body: { email })
- POST /api/ai/query    (body: { prompt })

Notes:

- This is a scaffold. Replace the auth stub and AI proxy with production-ready implementations before deploying.
