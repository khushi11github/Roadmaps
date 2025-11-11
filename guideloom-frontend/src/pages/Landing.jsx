import React from 'react'

export default function Landing(){
  return (
    <section className="hero fade-in">
      <div className="left">
        <h1>Learn with clarity. Build with confidence.</h1>
        <p className="muted">GuideLoom provides curated roadmaps, videos, and an AI mentor to guide your learning journey across C++, Git, React, Node and more.</p>
        <div style={{marginTop:18}}>
          <a className="cta" href="/roadmaps">Explore Roadmaps</a>
        </div>
      </div>
      <div className="right" style={{width:380}}>
        <div style={{padding:18,background:'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',borderRadius:10}}>
          <h3 style={{marginTop:0}}>Featured roadmap</h3>
          <p className="muted">C++ — from basics to advanced topics with exercises and videos.</p>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <a className="cta" href="/roadmaps" style={{padding:'8px 12px',fontSize:14}}>Get Started</a>
            <a href="/ai" style={{alignSelf:'center',color:'var(--muted)',textDecoration:'none'}}>Ask the AI →</a>
          </div>
        </div>
      </div>
    </section>
  )
}

