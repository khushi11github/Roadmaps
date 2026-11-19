# GuideLoom Backend

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
- POST /api/assessments
- GET /api/assessments/latest
- POST /api/roadmaps/adaptive/generate
- GET /api/roadmaps/adaptive
- GET /api/roadmaps/adaptive/:career
- PATCH /api/roadmaps/adaptive/:career/topics/:topicId
- POST /api/roadmaps/adaptive/:career/recommendations

User persistence (optional):

1. Create a MongoDB Atlas cluster or use a local MongoDB and set the connection string in `.env` as `MONGODB_URI`.
2. Add a `.env` file in this folder (not committed) with keys:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/guideloom
JWT_SECRET=your_jwt_secret_here
```

3. Restart the dev server. The scaffold will use MongoDB to register and login users.

New endpoints:

- POST /api/auth/register  (body: { name, email, password, interests })
- POST /api/auth/login     (body: { email, password })

Notes:

- The auth implementation uses bcrypt and JWT for the scaffold. Replace or harden for production (email verification, rate limiting).


Notes:

- This is a scaffold. Replace the auth stub and AI proxy with production-ready implementations before deploying.
