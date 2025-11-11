import React, {useState} from 'react'

export default function AIAssistant(){
  const [prompt,setPrompt] = useState('')
  const [reply,setReply] = useState(null)

  async function send(){
    const res = await fetch('/api/ai/query', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ prompt })
    })
    const data = await res.json()
    setReply(data.reply || JSON.stringify(data))
  }

  return (
    <div>
      <h2 style={{marginTop:6}}>Ask GuideLoom</h2>
      <div className="ai-box" style={{marginTop:12}}>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={6} placeholder="Ask for a roadmap, resources, or a short explanation..." />
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="cta" onClick={send}>Ask</button>
          <button onClick={()=>{setPrompt(''); setReply(null)}} style={{background:'transparent',border:'none',color:'var(--muted)'}}>Clear</button>
        </div>
      </div>

      {reply && (
        <div style={{marginTop:16,padding:14,borderRadius:10,background:'rgba(255,255,255,0.02)'}}>
          <strong>GuideLoom AI</strong>
          <div style={{marginTop:8}}>{reply}</div>
        </div>
      )}
    </div>
  )
}
