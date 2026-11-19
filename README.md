# SparkV / GuideLoom Adaptive Career Roadmap

GuideLoom is a MERN-stack adaptive roadmap platform. It keeps the existing GuideLoom pages and APIs and adds AI-assisted skill gap analysis, prerequisite roadmaps, progress tracking, and context-aware recommendations.

## Features

- Career-specific skill assessment with Beginner, Intermediate, and Advanced levels
- Skill gap report with Known, Improvement, and Missing categories
- MongoDB-persisted assessments and private adaptive roadmaps
- Locked, Available, and Completed topics enforced by prerequisites
- Phases, milestones, assignments, durations, and learning resources
- Topic completion, self-assessment, difficulty reporting, revision recommendations, and learning history
- Backend-only OpenAI integration with catalog fallbacks

## Run locally

Backend:

```powershell
cd d:\myfolders\Roadmaps\guideloom-backend
npm install
Copy-Item .env.example .env
# Edit MONGODB_URI, JWT_SECRET, and optionally OPENAI_API_KEY
npm run dev
```

Frontend:

```powershell
cd d:\myfolders\Roadmaps\guideloom-frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Register or login, then open **Adaptive roadmap**.

## Environment

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: optional; omit to use deterministic catalog fallbacks
- `AI_MODEL`: optional OpenAI model, defaults to `gpt-4o-mini`
- `PORT`: backend port, defaults to `4000`

## Main adaptive APIs

- `POST /api/assessments`
- `GET /api/assessments/latest`
- `POST /api/roadmaps/adaptive/generate`
- `GET /api/roadmaps/adaptive`
- `GET /api/roadmaps/adaptive/:career`
- `PATCH /api/roadmaps/adaptive/:career/topics/:topicId`
- `POST /api/roadmaps/adaptive/:career/recommendations`

All adaptive APIs require `Authorization: Bearer <JWT>`.
