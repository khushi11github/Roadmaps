import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Roadmaps(){
  const [roadmaps,setRoadmaps] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  useEffect(()=>{
    setLoading(true)
    fetch('/api/roadmaps')
      .then(async r=> {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Roadmaps could not be loaded')
        return data
      })
      .then(setRoadmaps)
      .catch(err=>setError(err.message))
      .finally(()=>setLoading(false))
  },[])

  return (
    <div>
      <h2 style={{marginTop:8}}>Roadmaps</h2>
      {loading && <p className="muted">Loading roadmaps...</p>}
      {error && <div className="alert">{error}</div>}
      {!loading && !error && roadmaps.length===0 && <p className="muted">No roadmaps are available yet.</p>}

      <div className="cards">
        {roadmaps.map(r=> (
          <article className="card fade-in" key={r.slug}>
            <h3>{r.title}</h3>
            <p className="muted">{r.description}</p>
            <div style={{marginTop:12,display:'flex',gap:8}}>
              <Link className="cta" to={`/roadmaps/${r.slug}`} style={{padding:'8px 10px',fontSize:13}}>Open</Link>
              <a href={`/api/roadmaps/${r.slug}`} style={{alignSelf:'center',color:'var(--muted)'}}>View JSON</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
