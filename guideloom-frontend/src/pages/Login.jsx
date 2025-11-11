import React, {useState} from 'react'

export default function Login(){
  const [email,setEmail] = useState('')
  const [msg,setMsg] = useState(null)

  async function submit(e){
    e.preventDefault()
    const res = await fetch('/api/auth/login', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('gl_token', data.token)
      setMsg('Logged in (token stored in localStorage).')
    } else setMsg(JSON.stringify(data))
  }

  return (
    <div style={{maxWidth:420}}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:10}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{padding:10,borderRadius:8,border:'1px solid rgba(255,255,255,0.04)',background:'rgba(255,255,255,0.02)',color:'inherit'}} />
        <button className="cta" type="submit">Login</button>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
    </div>
  )
}
