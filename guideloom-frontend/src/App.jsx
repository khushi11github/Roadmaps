import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import Roadmaps from './pages/Roadmaps'
import AIAssistant from './pages/AIAssistant'
import Login from './pages/Login'
import Register from './pages/Register'
import RoadmapDetail from './pages/RoadmapDetail'
import AdaptiveRoadmap from './pages/AdaptiveRoadmap'

export default function App(){
  return (
    <div>
      <nav>
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <Link to="/" style={{fontWeight:800,color:'#fff',fontSize:18,textDecoration:'none'}}>GuideLoom</Link>
            <Link to="/roadmaps">Roadmaps</Link>
            <Link to="/adaptive">Adaptive roadmap</Link>
            <Link to="/ai">AI Assistant</Link>
          </div>
          <div>
            <Link to="/login" style={{padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',color:'#cbd5e1',textDecoration:'none'}}>Login</Link>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/roadmaps" element={<Roadmaps/>} />
          <Route path="/roadmaps/:slug" element={<RoadmapDetail/>} />
          <Route path="/adaptive" element={<AdaptiveRoadmap/>} />
          <Route path="/ai" element={<AIAssistant/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
        </Routes>
        <div className="footer">
          Built with care — GuideLoom © 2025
        </div>
      </main>
    </div>
  )
}
