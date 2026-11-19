const express = require('express');
const cors = require('cors');
const bodyParser = require('express').json;
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');
const SkillAssessment = require('./models/SkillAssessment');
const AdaptiveRoadmap = require('./models/AdaptiveRoadmap');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser());

const proficiencyRank = { Beginner: 1, Intermediate: 2, Advanced: 3 };

const careerCatalog = {
  'MERN Stack Developer': [
    ['HTML', 'Intermediate'], ['CSS', 'Intermediate'], ['JavaScript', 'Advanced'],
    ['React', 'Advanced'], ['Node.js', 'Advanced'], ['Express.js', 'Advanced'],
    ['MongoDB', 'Intermediate'], ['REST APIs', 'Advanced'], ['Git', 'Intermediate'],
    ['Testing', 'Intermediate']
  ],
  'Backend Developer': [
    ['JavaScript', 'Advanced'], ['Node.js', 'Advanced'], ['Express.js', 'Advanced'],
    ['MongoDB', 'Intermediate'], ['REST APIs', 'Advanced'], ['Databases', 'Advanced'],
    ['Authentication', 'Advanced'], ['Git', 'Intermediate'], ['Testing', 'Intermediate'],
    ['System Design', 'Advanced']
  ],
  'Frontend Developer': [
    ['HTML', 'Advanced'], ['CSS', 'Advanced'], ['JavaScript', 'Advanced'],
    ['React', 'Advanced'], ['Responsive Design', 'Advanced'], ['Accessibility', 'Intermediate'],
    ['Git', 'Intermediate'], ['Testing', 'Intermediate'], ['TypeScript', 'Intermediate'],
    ['Performance', 'Intermediate']
  ]
};

function authRequired(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function mongoReady(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'MongoDB is not connected. Configure MONGODB_URI and restart the server.' });
    return false;
  }
  return true;
}

async function askAI(prompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a career learning architect. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return JSON.parse(text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
  } catch (err) {
    console.error('AI request failed:', err.message);
    return null;
  }
}

// Connect to MongoDB if provided
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (mongoUri) {
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(()=> console.log('Connected to MongoDB'))
    .catch(err=> console.error('MongoDB connection error:', err.message));
} else {
  console.warn('MONGODB_URI not set — running with in-memory sample data only. Set MONGODB_URI in .env to enable persistence.');
}

// Enriched in-memory sample roadmaps (includes resource links and videos)
const sampleRoadmaps = [
  {
    slug: 'c-plus-plus',
    title: 'C++ Roadmap',
    description: 'Beginner → Intermediate → Advanced C++ topics, with curated resources and video links.',
    topics: [
      { id: 'basics', title: 'Basics', description: 'Syntax, variables, control flow, functions.',
        resources: [
          { type: 'doc', label: 'cppreference', url: 'https://en.cppreference.com' },
          { type: 'book', label: 'C++ Primer', url: 'https://www.pearson.com' }
        ],
        videoLinks: ['https://www.youtube.com/watch?v=Rub-JsjMhWY']
      },
      { id: 'stl', title: 'STL & Data Structures', description: 'Vectors, maps, sets, iterators.',
        resources: [ { type: 'article', label: 'STL tutorial', url: 'https://www.geeksforgeeks.org/the-c-standard-template-library-stl/' } ],
        videoLinks: ['https://www.youtube.com/watch?v=PyZm0iqi9ZM']
      },
      { id: 'advanced', title: 'Advanced', description: 'Templates, smart pointers, concurrency.',
        resources: [ { type: 'article', label: 'Modern C++ Features', url: 'https://en.cppreference.com/w/cpp/overview' } ],
        videoLinks: ['https://www.youtube.com/watch?v=1v_4dL8Ckro']
      }
    ]
  },
  {
    slug: 'git-github',
    title: 'Git & GitHub',
    description: 'Version control fundamentals, branching, PR workflows, and GitHub features.',
    topics: [
      { id: 'git-basics', title: 'Git Basics', description: 'Commits, branches, merges.',
        resources: [ { type:'book', label:'Pro Git', url:'https://git-scm.com/book/en/v2' } ],
        videoLinks: ['https://www.youtube.com/watch?v=8JJ101D3knE']
      },
      { id: 'github', title: 'GitHub', description: 'Pull requests, actions, issues.',
        resources: [ { type:'site', label:'GitHub Learning Lab', url:'https://lab.github.com' } ],
        videoLinks: ['https://www.youtube.com/watch?v=w3jLJU7DT5E']
      }
    ]
  },
  {
    slug: 'react',
    title: 'React Roadmap',
    description: 'React fundamentals, hooks, routing, state management and testing.',
    topics: [
      { id:'jsx', title:'JSX & Components', description:'JSX syntax and component patterns', resources:[{type:'doc',label:'React docs',url:'https://react.dev'}], videoLinks:[] },
      { id:'hooks', title:'Hooks', description:'useState, useEffect, custom hooks', resources:[{type:'article',label:'Hooks guide',url:'https://react.dev/learn'}], videoLinks:[] }
    ]
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

// Auth endpoints: register + login using MongoDB (if configured)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, interests } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    const user = new User({ name: name || '', email, passwordHash, interests: interests || [] })
    await user.save()
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    console.error('Register error:', err.message)
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' })
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const user = await User.findOne({ email }).exec()
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/assessments', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const career = String(req.body?.career || '').trim();
  const existingSkills = Array.isArray(req.body?.existingSkills) ? req.body.existingSkills : [];
  if (!career || !careerCatalog[career]) return res.status(400).json({ error: 'Choose a supported career' });
  if (existingSkills.length > 50) return res.status(400).json({ error: 'Maximum 50 existing skills' });

  const normalizedExisting = existingSkills
    .filter(skill => skill && typeof skill.name === 'string')
    .map(skill => ({
      name: skill.name.trim(),
      proficiency: ['Beginner', 'Intermediate', 'Advanced'].includes(skill.proficiency) ? skill.proficiency : 'Beginner'
    }))
    .filter(skill => skill.name);

  const ai = await askAI(JSON.stringify({
    task: 'Create required skills for this career',
    career,
    catalogFallback: careerCatalog[career].map(([name, proficiency]) => ({ name, proficiency })),
    instructions: 'Return JSON with requiredSkills [{name,proficiency}], and summary.'
  }));

  const requiredSkills = Array.isArray(ai?.requiredSkills) && ai.requiredSkills.length
    ? ai.requiredSkills
      .filter(skill => skill?.name)
      .slice(0, 20)
      .map(skill => ({ name: String(skill.name).trim(), proficiency: ['Beginner', 'Intermediate', 'Advanced'].includes(skill.proficiency) ? skill.proficiency : 'Intermediate' }))
    : careerCatalog[career].map(([name, proficiency]) => ({ name, proficiency }));

  const existingMap = new Map(normalizedExisting.map(skill => [skill.name.toLowerCase(), skill]));
  const gaps = requiredSkills.map(required => {
    const existing = existingMap.get(required.name.toLowerCase());
    let category = existing ? 'Known' : 'Missing';
    if (existing && proficiencyRank[existing.proficiency] < proficiencyRank[required.proficiency]) category = 'Improvement';
    const rankDifference = existing ? proficiencyRank[required.proficiency] - proficiencyRank[existing.proficiency] : 3;
    const priority = rankDifference >= 2 ? 'High' : rankDifference === 1 ? 'Medium' : 'Low';
    return {
      name: required.name,
      currentProficiency: existing ? existing.proficiency : 'None',
      requiredProficiency: required.proficiency,
      category,
      priority,
      resources: [
        `https://developer.mozilla.org/search?q=${encodeURIComponent(required.name)}`,
        `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(required.name)}`
      ]
    };
  });

  try {
    const assessment = await SkillAssessment.create({
      user: req.user.id,
      career,
      existingSkills: normalizedExisting,
      requiredSkills,
      gaps,
      summary: typeof ai?.summary === 'string' ? ai.summary : `Skill profile generated for ${career}.`,
      provider: ai ? 'ai' : 'catalog'
    });
    res.status(201).json(assessment);
  } catch (err) {
    console.error('Assessment error:', err.message);
    res.status(500).json({ error: 'Could not save skill assessment' });
  }
});

app.get('/api/assessments/latest', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const assessment = await SkillAssessment.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  if (!assessment) return res.status(404).json({ error: 'No skill assessment found' });
  res.json(assessment);
});

const roadmapCatalog = {
  'MERN Stack Developer': {
    title: 'Personalized MERN Stack Roadmap',
    topics: [
      ['html-css', 'HTML & CSS Fundamentals', 'Semantic HTML, layouts, responsive design.', [], 10, ['Build a responsive landing page'], 'HTML'],
      ['javascript', 'JavaScript Fundamentals', 'Variables, functions, arrays, objects, DOM and ES modules.', ['html-css'], 18, ['Build an interactive to-do app'], 'JavaScript'],
      ['advanced-js', 'Advanced JavaScript', 'Promises, async/await, closures, modules and design patterns.', ['javascript'], 16, ['Convert a callback API flow to async/await'], 'JavaScript'],
      ['git', 'Git & GitHub', 'Version control, branches, commits and pull requests.', ['javascript'], 6, ['Create a branch, PR and resolve a merge'], 'Git'],
      ['node', 'Node.js', 'Runtime, modules, events and package management.', ['advanced-js'], 12, ['Create a command-line utility'], 'Node.js'],
      ['express', 'Express.js', 'Routing, middleware, validation and REST APIs.', ['node'], 14, ['Build a CRUD API'], 'Express.js'],
      ['mongo', 'MongoDB', 'Document modeling, CRUD, indexes and aggregation.', ['node'], 12, ['Create a modeled data store'], 'MongoDB'],
      ['react', 'React', 'Components, state, effects, routing and forms.', ['advanced-js'], 18, ['Build a routed dashboard'], 'React'],
      ['mern', 'MERN Integration', 'Connect React, Express and MongoDB securely.', ['express', 'mongo', 'react'], 20, ['Build full-stack authentication and CRUD'], 'REST APIs'],
      ['testing', 'Testing & Deployment', 'Unit tests, API tests, CI and deployment.', ['mern'], 10, ['Deploy and test a production app'], 'Testing']
    ]
  },
  'Backend Developer': {
    title: 'Personalized Backend Developer Roadmap',
    topics: [
      ['javascript', 'JavaScript Fundamentals', 'Core syntax and asynchronous programming.', [], 16, ['Build a CLI tool'], 'JavaScript'],
      ['node', 'Node.js', 'Modules, streams, events and package management.', ['javascript'], 14, ['Build a file-processing service'], 'Node.js'],
      ['express', 'Express.js', 'Routing, middleware and REST API design.', ['node'], 16, ['Build a validated REST API'], 'Express.js'],
      ['databases', 'Database Fundamentals', 'Schema design and data modeling.', ['node'], 12, ['Model users and resources'], 'Databases'],
      ['mongo', 'MongoDB', 'CRUD, indexes and aggregation.', ['databases'], 12, ['Implement efficient queries'], 'MongoDB'],
      ['auth', 'Authentication & Security', 'Passwords, JWT, authorization and secure headers.', ['express', 'databases'], 14, ['Implement role-based authentication'], 'Authentication'],
      ['testing', 'API Testing', 'Unit, integration and contract testing.', ['express', 'mongo'], 10, ['Test every endpoint'], 'Testing'],
      ['system-design', 'System Design', 'Caching, queues, scaling and observability.', ['auth', 'testing'], 16, ['Create a scalable service design'], 'System Design']
    ]
  },
  'Frontend Developer': {
    title: 'Personalized Frontend Developer Roadmap',
    topics: [
      ['html', 'HTML Fundamentals', 'Semantic structure and accessible markup.', [], 8, ['Build an accessible document'], 'HTML'],
      ['css', 'CSS Fundamentals', 'Layouts, responsive design and animation.', ['html'], 12, ['Create a responsive layout'], 'CSS'],
      ['javascript', 'JavaScript Fundamentals', 'DOM, events, modules and async code.', ['html'], 18, ['Build an interactive app'], 'JavaScript'],
      ['react', 'React', 'Components, hooks, state and routing.', ['javascript'], 20, ['Build a routed UI'], 'React'],
      ['typescript', 'TypeScript', 'Types, generics and React typing.', ['react'], 12, ['Convert a React app to TypeScript'], 'TypeScript'],
      ['a11y', 'Accessibility', 'Keyboard access, semantics and testing.', ['css', 'javascript'], 8, ['Audit and fix an interface'], 'Accessibility'],
      ['testing', 'Frontend Testing', 'Component and end-to-end tests.', ['react'], 10, ['Test the critical user journey'], 'Testing'],
      ['performance', 'Web Performance', 'Core Web Vitals, assets and rendering.', ['typescript', 'a11y'], 10, ['Improve a Lighthouse score'], 'Performance']
    ]
  }
};

function recomputeRoadmap(roadmap) {
  const completed = new Set(roadmap.topics.filter(topic => topic.status === 'Completed').map(topic => topic.id));
  roadmap.topics.forEach(topic => {
    if (topic.status !== 'Completed') {
      topic.status = topic.prerequisites.every(id => completed.has(id)) ? 'Available' : 'Locked';
    }
  });
  roadmap.milestones.forEach(milestone => {
    milestone.status = milestone.topicIds.length && milestone.topicIds.every(id => completed.has(id))
      ? 'Completed'
      : milestone.topicIds.some(id => roadmap.topics.find(topic => topic.id === id)?.status === 'Available')
        ? 'Available' : 'Locked';
  });
  roadmap.completionPercent = roadmap.topics.length
    ? Math.round((completed.size / roadmap.topics.length) * 100) : 0;
  roadmap.updatedAt = new Date();
  return roadmap;
}

app.post('/api/roadmaps/adaptive/generate', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const career = String(req.body?.career || '').trim();
  if (!careerCatalog[career]) return res.status(400).json({ error: 'Choose a supported career' });
  const assessment = await SkillAssessment.findOne({ user: req.user.id, career }).sort({ createdAt: -1 });
  if (!assessment) return res.status(400).json({ error: 'Complete a skill assessment before generating a roadmap' });

  const catalog = roadmapCatalog[career];
  const existingMap = new Map(assessment.existingSkills.map(skill => [skill.name.toLowerCase(), skill]));
  let topics = catalog.topics.map((row, index) => {
    const [id, title, description, prerequisites, estimatedHours, assignments, skillName] = row;
    const existing = existingMap.get(skillName.toLowerCase());
    const completed = existing?.proficiency === 'Advanced';
    return {
      id, title, description, prerequisites, estimatedHours, assignments,
      resources: [
        { type: 'doc', label: `${skillName} documentation`, url: `https://developer.mozilla.org/search?q=${encodeURIComponent(skillName)}` },
        { type: 'course', label: `FreeCodeCamp ${skillName}`, url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skillName)}` }
      ],
      status: completed ? 'Completed' : 'Locked',
      struggling: false,
      assessment: 'Not set',
      completedAt: completed ? new Date() : null
    };
  });

  const topicIds = topics.map(topic => topic.id);
  const chunks = [topicIds.slice(0, 3), topicIds.slice(3, 6), topicIds.slice(6, 8), topicIds.slice(8)];
  const milestoneTitles = ['Foundations', 'Core Skills', 'Applied Skills', 'Career Project'];
  const milestones = chunks.filter(chunk => chunk.length).map((chunk, index) => ({
    id: `milestone-${index + 1}`,
    title: milestoneTitles[index],
    topicIds: chunk,
    status: 'Locked'
  }));
  const phases = [
    { id: 'phase-1', title: 'Foundations', description: 'Build core prerequisites.', topicIds: chunks[0] || [] },
    { id: 'phase-2', title: 'Core Development', description: 'Learn primary tools and concepts.', topicIds: chunks[1] || [] },
    { id: 'phase-3', title: 'Integration', description: 'Combine skills into real applications.', topicIds: chunks[2] || [] },
    { id: 'phase-4', title: 'Career Readiness', description: 'Validate and ship a complete project.', topicIds: chunks[3] || [] }
  ].filter(phase => phase.topicIds.length);

  const payload = {
    user: req.user.id, assessment: assessment._id, career, title: catalog.title,
    description: `A prerequisite-based ${career} path generated from your latest skill assessment.`,
    phases, topics, milestones, history: [], recommendations: ['Complete the first available topic and submit a self-assessment.']
  };
  const roadmap = await AdaptiveRoadmap.findOneAndUpdate(
    { user: req.user.id, career },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  recomputeRoadmap(roadmap);
  await roadmap.save();
  res.status(201).json(roadmap);
});

app.get('/api/roadmaps/adaptive', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const roadmaps = await AdaptiveRoadmap.find({ user: req.user.id }).sort({ updatedAt: -1 }).lean();
  res.json(roadmaps);
});

app.get('/api/roadmaps/adaptive/:career', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const roadmap = await AdaptiveRoadmap.findOne({ user: req.user.id, career: req.params.career });
  if (!roadmap) return res.status(404).json({ error: 'No adaptive roadmap found' });
  recomputeRoadmap(roadmap);
  await roadmap.save();
  res.json(roadmap);
});

app.patch('/api/roadmaps/adaptive/:career/topics/:topicId', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const { completed, assessment, struggling, note } = req.body || {};
  const allowedAssessments = ['Easy', 'Good', 'Challenging', 'Struggled'];
  if (assessment !== undefined && !allowedAssessments.includes(assessment)) return res.status(400).json({ error: 'Invalid self-assessment' });
  if (typeof completed !== 'boolean' && typeof struggling !== 'boolean' && assessment === undefined) {
    return res.status(400).json({ error: 'Provide completed, struggling, or assessment' });
  }

  const roadmap = await AdaptiveRoadmap.findOne({ user: req.user.id, career: req.params.career });
  if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
  const topic = roadmap.topics.find(item => item.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  recomputeRoadmap(roadmap);
  if (topic.status === 'Locked' && completed) return res.status(409).json({ error: 'Complete prerequisite topics first' });

  if (typeof completed === 'boolean') {
    topic.status = completed ? 'Completed' : 'Available';
    topic.completedAt = completed ? new Date() : null;
    if (completed) roadmap.history.push({ topicId: topic.id, action: 'completed', note: String(note || '') });
  }
  if (typeof struggling === 'boolean') {
    topic.struggling = struggling;
    if (struggling) roadmap.history.push({ topicId: topic.id, action: 'struggled', note: String(note || '') });
  }
  if (assessment) {
    topic.assessment = assessment;
    topic.struggling = assessment === 'Struggled';
    roadmap.history.push({ topicId: topic.id, action: 'assessed', assessment, note: String(note || '') });
  }
  recomputeRoadmap(roadmap);

  const newlyAvailable = roadmap.topics.filter(item => item.status === 'Available').slice(0, 3).map(item => item.title);
  roadmap.recommendations = [
    topic.struggling
      ? `Revision recommended for ${topic.title}: rework the assignments and add 2 extra practice exercises.`
      : completed
        ? `Next eligible topics: ${newlyAvailable.join(', ') || 'Review your completed milestones.'}`
        : 'Continue with an available topic and record your self-assessment.'
  ];
  await roadmap.save();
  res.json(roadmap);
});

app.post('/api/roadmaps/adaptive/:career/recommendations', authRequired, async (req, res) => {
  if (!mongoReady(res)) return;
  const roadmap = await AdaptiveRoadmap.findOne({ user: req.user.id, career: req.params.career });
  if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
  const assessment = await SkillAssessment.findById(roadmap.assessment).lean();
  const struggling = roadmap.topics.filter(topic => topic.struggling);
  const eligible = roadmap.topics.filter(topic => topic.status === 'Available');

  const ai = await askAI(JSON.stringify({
    task: 'Generate context-aware learning recommendations',
    career: roadmap.career,
    assessment: assessment?.gaps || [],
    completedTopics: roadmap.topics.filter(topic => topic.status === 'Completed').map(topic => topic.title),
    strugglingTopics: struggling.map(topic => topic.title),
    eligibleTopics: eligible.map(topic => topic.title),
    learningHistory: roadmap.history.slice(-10),
    instructions: 'Return JSON with recommendations [strings]. Do not recommend locked topics or topics with incomplete prerequisites.'
  }));
  roadmap.recommendations = Array.isArray(ai?.recommendations) && ai.recommendations.length
    ? ai.recommendations.slice(0, 5)
    : [
      ...(struggling.length ? [`Revise ${struggling[0].title} with extra practice exercises and a mini-project.`] : []),
      eligible.length ? `Start next: ${eligible[0].title}.` : 'Continue revising completed topics and prepare for your milestone.',
      roadmap.completionPercent >= 100 ? 'Build a portfolio project using all major skills.' : 'Track your self-assessment after each topic.'
    ];
  await roadmap.save();
  res.json({ recommendations: roadmap.recommendations, eligibleTopics: eligible.map(topic => topic.id), completionPercent: roadmap.completionPercent });
});

// AI proxy - OpenAI API key stays on the server. The response is deterministic when no key is configured.
app.post('/api/ai/query', async (req, res) => {
  const { prompt, history = [] } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'prompt required' });

  let learningContext = null;
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (token && mongoose.connection.readyState === 1) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const [assessment, roadmap] = await Promise.all([
        SkillAssessment.findOne({ user: decoded.id }).sort({ createdAt: -1 }).lean(),
        AdaptiveRoadmap.findOne({ user: decoded.id }).sort({ updatedAt: -1 }).lean()
      ]);
      learningContext = {
        career: assessment?.career || roadmap?.career || null,
        completedTopics: roadmap?.topics?.filter(topic => topic.status === 'Completed').map(topic => topic.title) || [],
        availableTopics: roadmap?.topics?.filter(topic => topic.status === 'Available').map(topic => topic.title) || [],
        strugglingTopics: roadmap?.topics?.filter(topic => topic.struggling).map(topic => topic.title) || [],
        completionPercent: roadmap?.completionPercent || 0,
        skillGaps: assessment?.gaps?.filter(gap => gap.category !== 'Known').map(gap => gap.name) || []
      };
    } catch (err) {
      learningContext = null;
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    const lowerPrompt = prompt.toLowerCase();
    let reply;
    if (/^(hii|hi|hello|hey|namaste|good (morning|afternoon|evening))[!.,\s]*$/.test(lowerPrompt)) {
      reply = learningContext?.career
        ? `Hey! Great to see you. I can help with ${learningContext.career}, your next eligible topic, revision exercises, or a practice project. What would you like to work on?`
        : 'Hey! Great to see you. I can help you choose a career roadmap, plan a study week, understand a topic, or build a practice project. What would you like to work on first?';
    } else if (/^(how are you|how(?:'s| is) it going|what's up|whats up)[?!.]*$/.test(lowerPrompt)) {
      reply = 'I’m doing great - and I’m ready to help you make progress. What are you learning or working through today?';
    } else if (/^(i am fine|i'm fine|i am good|i'm good|not bad)[!.,?]*$/.test(lowerPrompt)) {
      reply = 'Good to hear! What would you like to focus on now - a new concept, a revision session, or your next roadmap milestone?';
    } else if (/(can we (talk|chat)|let's talk|lets talk|just chatting|just (saying|checking))/.test(lowerPrompt)) {
      reply = 'Of course - we can chat. I can be useful for career planning, learning strategies, coding concepts, and practice ideas. Which direction feels most helpful right now?';
    } else if (/(explain|what is|what are|how does|why does|help me understand)/.test(lowerPrompt)) {
      const concept = prompt.replace(/^(please\s+)?(explain|what is|what are|how does|why does|help me understand)\s*/i, '').replace(/[?.!]+$/, '').trim();
      reply = concept
        ? `${concept} is easier to understand when we connect it to a small example. First, tell me what you already know about it. If you are a beginner, I can explain it step by step with a simple exercise.`
        : 'Sure - which concept would you like me to explain? Tell me your level too, and I’ll keep the explanation beginner-friendly.';
    } else if (/async(hronous)? (javascript|js)|javascript.*async|promise|async await|async\/await/.test(lowerPrompt)) {
      reply = `Async JavaScript feels confusing at first because code is not always executed in the order it appears.\n\nHere is a simple three-step exercise:\n1. Create a \`Promise\` that returns "Done" after 1 second.\n2. Consume it with \`.then()\`, then rewrite the same code with \`async/await\`.\n3. Add \`try/catch\` and simulate an error.\n\nStart with this tiny example:\n\`\`\`js\nasync function loadMessage() {\n  try {\n    const message = await Promise.resolve("Done");\n    console.log(message);\n  } catch (error) {\n    console.error(error);\n  }\n}\n\nloadMessage();\n\`\`\`\n\nShare the exact code or error you are stuck on, and I’ll trace it with you line by line.`;
    } else if (/(i am stuck|i'm stuck|im stuck|struggling|don't understand|dont understand|confused)/.test(lowerPrompt)) {
      const topic = prompt.replace(/.*?(?:with|on|at)\s+/i, '').replace(/[?.!]+$/, '').trim();
      reply = `That happens - let’s simplify it. ${topic && topic.length < 80 ? `Start with one small example of ${topic}. ` : ''}Try reading the requirement once, write down what you expect, then test just one small part. Tell me the exact error or confusing line, and we’ll work through it together.`;
    } else if (/(\bjavascript\b|\bmern\b|\breact\b|\bnode\b|\bexpress\b|\bmongodb\b)/.test(lowerPrompt)) {
      reply = `Nice choice - ${prompt.match(/\b(JavaScript|MERN|React|Node(?:\.js)?|Express(?:\.js)?|MongoDB)\b/i)?.[0] || 'that skill'} is a practical topic to learn through building. What is your current level, and is there a specific concept or project you want to understand?`;
    } else if (/(thank|thanks|that helps|great)/.test(lowerPrompt)) {
      reply = 'You’re welcome - happy to help! Tell me what you are learning now, and I can turn it into your next small practice step.';
    } else if (/(what can you do|help me|how can you help|features)/.test(lowerPrompt)) {
      reply = 'I can recommend your next topic, create a focused study plan, explain coding concepts, suggest a practice project, or prepare revision exercises. If you are logged in, I can also use your assessment and roadmap progress.';
    } else if (/(who are you|your name)/.test(lowerPrompt)) {
      reply = 'I’m GuideLoom, your adaptive career learning coach. I help you learn in the right order and adapt to your progress.';
    } else if (lowerPrompt.includes('next') || lowerPrompt.includes('roadmap')) {
      reply = learningContext?.availableTopics?.length
        ? `Your next eligible topic is ${learningContext.availableTopics[0]}. Complete its prerequisite work, finish the topic assignment, and submit a self-assessment.`
        : 'Start with the first available foundational topic, complete its assignment, then submit a self-assessment.';
    } else if (lowerPrompt.includes('7-day') || lowerPrompt.includes('study plan')) {
      reply = 'A 7-day plan:\nDay 1: Review fundamentals and take notes.\nDay 2: Practice core syntax and functions.\nDay 3: Build a small console or DOM project.\nDay 4: Study asynchronous behavior.\nDay 5: Add error handling and tests.\nDay 6: Build a timed mini-project.\nDay 7: Revise weak areas and explain the concepts aloud.';
    } else if (lowerPrompt.includes('project')) {
      reply = 'Build a focused task-manager app. Include CRUD operations, input validation, local storage or MongoDB, responsive UI, and one automated test. Stretch goal: add authentication.';
    } else if (learningContext?.strugglingTopics?.length) {
      reply = `Your roadmap shows difficulty with ${learningContext.strugglingTopics.join(', ')}. Review the lesson, complete 2 short practice exercises, then rebuild a small example without notes.`;
    } else {
      reply = 'Use active learning: explain the concept briefly, solve one small example without notes, add an automated check, then teach the result back. Ask me for an exercise when you select a topic.';
    }
    return res.json({
      reply,
      context: learningContext,
      personalized: Boolean(learningContext)
    });
  }
  try {
    const safeHistory = Array.isArray(history)
      ? history.filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string').slice(-10)
      : [];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: `You are GuideLoom, an adaptive career learning coach. Use this private learning context only to personalize advice and never recommend a topic whose prerequisite is incomplete. Context: ${JSON.stringify(learningContext || {})}` },
          ...safeHistory.map(item => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })),
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!response.ok) return res.status(502).json({ error: 'AI provider request failed' });
    const data = await response.json();
    res.json({
      reply: data.choices?.[0]?.message?.content || 'No AI response was generated.',
      context: learningContext,
      personalized: Boolean(learningContext)
    });
  } catch (err) {
    res.status(502).json({ error: 'AI provider unavailable' });
  }
});

// Simple AI health/ping endpoint to verify routing and backend availability
app.get('/api/ai/ping', (req, res) => {
  res.json({ ok: true, timestamp: Date.now(), msg: 'AI endpoint OK (stub)' })
})

app.listen(PORT, () => console.log(`GuideLoom backend listening on http://localhost:${PORT}`));

// Serve frontend in production (optional): expects build in ../guideloom-frontend/dist
if (process.env.NODE_ENV === 'production'){
  const staticPath = path.join(__dirname, '..', 'guideloom-frontend', 'dist')
  app.use(express.static(staticPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'))
  })
}
