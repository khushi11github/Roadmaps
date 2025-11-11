const express = require('express');
const cors = require('cors');
const bodyParser = require('express').json;
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser());

// Simple in-memory sample roadmaps
const sampleRoadmaps = [
  {
    slug: 'c-plus-plus',
    title: 'C++ Roadmap',
    description: 'Beginner to advanced C++ topics',
    topics: [
      { id: 'basics', title: 'Basics', resources: [{type:'doc',label:'cppreference',url:'https://en.cppreference.com'}], videoLinks: [] },
      { id: 'stl', title: 'STL', resources: [], videoLinks: [] }
    ]
  },
  {
    slug: 'git-github',
    title: 'Git & GitHub',
    description: 'Version control fundamentals and GitHub workflows',
    topics: [ { id: 'git-basics', title: 'Git Basics', resources: [], videoLinks: [] } ]
  }
];

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/roadmaps', (req, res) => {
  res.json(sampleRoadmaps);
});

app.get('/api/roadmaps/:slug', (req, res) => {
  const roadmap = sampleRoadmaps.find(r => r.slug === req.params.slug);
  if (!roadmap) return res.status(404).json({ error: 'Not found' });
  res.json(roadmap);
});

// Auth: lightweight stub (do NOT use in production)
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  // Return a fake JWT for the scaffold
  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token, user: { email } });
});

// AI proxy stub - returns deterministic helpful message. Replace with real provider integration.
app.post('/api/ai/query', (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  // Minimal deterministic response
  res.json({
    reply: `GuideLoom AI stub: received your prompt. Example recommendation: start with basics, then practice projects. (Echo: ${prompt.slice(0,200)})`
  });
});

app.listen(PORT, () => console.log(`GuideLoom backend listening on http://localhost:${PORT}`));

// Serve frontend in production (optional): expects build in ../guideloom-frontend/dist
const path = require('path');
if (process.env.NODE_ENV === 'production'){
  const staticPath = path.join(__dirname, '..', 'guideloom-frontend', 'dist')
  app.use(express.static(staticPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'))
  })
}
