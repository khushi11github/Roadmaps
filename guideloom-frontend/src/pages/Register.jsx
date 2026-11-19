import React, {useState} from 'react'

export default function Register(){
  const [form,setForm] = useState({name:'',email:'',password:''})
  const [msg,setMsg] = useState(null)

  async function submit(e){
    e.preventDefault()
    setMsg('Creating account...')
    try{
      const res = await fetch('/api/auth/register', {method:'POST',headers:{'content-type':'application/json'},body: JSON.stringify(form)})
      const data = await res.json()
      if (res.ok){
        localStorage.setItem('gl_token', data.token)
        setMsg('Registered and logged in')
      } else setMsg(data.error || JSON.stringify(data))
    } catch(err){
      setMsg('Network error')
    }
  }

  return (
    <div style={{maxWidth:480}}>
      <h2>Create account</h2>
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:10}}>
        <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{padding:10,borderRadius:8}} />
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{padding:10,borderRadius:8}} />
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{padding:10,borderRadius:8}} />
        <div style={{display:'flex',gap:8}}>
          <button className="cta" type="submit">Create account</button>
        </div>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
    </div>
  )
}
