import React, { useEffect, useRef, useState } from 'react'

const welcome = {
  role: 'assistant',
  text: 'Hi - I am your GuideLoom career coach. Tell me what you are learning, where you are stuck, or what you want to build next.',
  ts: Date.now()
}

const quickPrompts = [
  'What should I learn next?',
  'Create a 7-day JavaScript study plan',
  'Explain my roadmap progress',
  'Give me a practice project',
  'How can I revise a difficult topic?'
]

function formatTimestamp(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIAssistant() {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('guideloom_chat') || 'null')
      return Array.isArray(saved) && saved.length ? saved : [welcome]
    } catch {
      return [welcome]
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('guideloom_chat', JSON.stringify(messages.slice(-40)))
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const token = localStorage.getItem('gl_token')
    if (!token) return
    Promise.all([
      fetch('/api/assessments/latest', { headers: { authorization: `Bearer ${token}` } }),
      fetch('/api/roadmaps/adaptive', { headers: { authorization: `Bearer ${token}` } })
    ]).then(async ([assessmentRes, roadmapsRes]) => {
      const assessment = assessmentRes.ok ? await assessmentRes.json() : null
      const roadmaps = roadmapsRes.ok ? await roadmapsRes.json() : []
      setProfile({ assessment, roadmap: roadmaps[0] || null })
    }).catch(() => setProfile(null))
  }, [])

  async function send(promptOverride) {
    const prompt = String(promptOverride ?? value).trim()
    if (!prompt || loading) return
    const userMsg = { role: 'user', text: prompt, ts: Date.now() }
    setMessages(previous => [...previous, userMsg])
    setValue('')
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('gl_token')
      const history = [...messages, userMsg].slice(-10).map(message => ({
        role: message.role,
        content: message.text
      }))
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt, history })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'The assistant could not respond')
      setMessages(previous => [...previous, {
        role: 'assistant',
        text: data.reply || 'No response was generated.',
        ts: Date.now()
      }])
    } catch (err) {
      setError(err.message)
      setMessages(previous => [...previous, {
        role: 'assistant',
        text: 'I could not complete that request. Please try again.',
        ts: Date.now(),
        failed: true
      }])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([welcome])
    setError('')
  }

  async function copyMessage(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      setError('Clipboard access was unavailable.')
    }
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find(message => message.role === 'user')
    if (lastUser) send(lastUser.text)
  }

  return (
    <div className="assistant-page">
      <aside className="assistant-sidebar">
        <p className="eyebrow">AI career coach</p>
        <h2>GuideLoom</h2>
        <p className="muted">Plan, understand, and practice with an adaptive learning assistant.</p>
        {profile?.assessment && (
          <div className="coach-context">
            <span>Current career</span>
            <strong>{profile.assessment.career}</strong>
            {profile.roadmap && <p>{profile.roadmap.completionPercent}% roadmap complete</p>}
          </div>
        )}
        <button className="secondary-button" type="button" onClick={clearChat}>New conversation</button>
        <div className="quick-prompts">
          <span>Quick prompts</span>
          {quickPrompts.map(prompt => (
            <button type="button" key={prompt} onClick={() => send(prompt)} disabled={loading}>{prompt}</button>
          ))}
        </div>
      </aside>

      <section className="assistant-chat">
        <div className="chat-header">
          <div><span className="online-dot" /> GuideLoom Assistant</div>
          <span>{loading ? 'Thinking...' : 'Ready'}</span>
        </div>
        {error && <div className="chat-error">{error}</div>}
        <div className="chat-messages" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`chat-row ${message.role}`} key={`${message.ts}-${index}`}>
              <div className="chat-avatar">{message.role === 'user' ? 'You' : 'AI'}</div>
              <div className="chat-bubble">
                <div className="chat-text">{message.text}</div>
                <div className="chat-actions">
                  <time>{formatTimestamp(message.ts)}</time>
                  {message.role === 'assistant' && (
                    <>
                      <button type="button" onClick={() => copyMessage(message.text)}>Copy</button>
                      {message.failed && <button type="button" onClick={retryLast}>Retry</button>}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-row assistant">
              <div className="chat-avatar">AI</div>
              <div className="typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-composer" onSubmit={event => { event.preventDefault(); send() }}>
          <textarea
            value={value}
            onChange={event => setValue(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
            rows={2}
            placeholder="Ask about your next step, a concept, or a practice project..."
          />
          <button className="cta" type="submit" disabled={loading || !value.trim()}>
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </section>
    </div>
  )
}
