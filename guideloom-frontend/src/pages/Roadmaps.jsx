import React, {useEffect, useState} from 'react'

export default function Roadmaps(){
  const [roadmaps,setRoadmaps] = useState([])
  useEffect(()=>{
    fetch('/api/roadmaps')
      .then(r=>r.json())
      .then(setRoadmaps)
      .catch(()=>setRoadmaps([]))
  },[])

  return (
    <div>
      <h2 style={{marginTop:8}}>Roadmaps</h2>
      {roadmaps.length===0 && <p className="muted">No roadmaps loaded — make sure the backend is running (see README).</p>}

      <div className="cards">
        {roadmaps.map(r=> (
          <article className="card fade-in" key={r.slug}>
            <h3>{r.title}</h3>
            <p className="muted">{r.description}</p>
            <div style={{marginTop:12,display:'flex',gap:8}}>
              <a className="cta" href={`/api/roadmaps/${r.slug}`} style={{padding:'8px 10px',fontSize:13}}>Open</a>
              <a href={`/api/roadmaps/${r.slug}`} style={{alignSelf:'center',color:'var(--muted)'}}>View JSON</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
