import React, { useEffect, useState } from 'react'

const careers = ['MERN Stack Developer', 'Backend Developer', 'Frontend Developer']
const emptySkill = { name: '', proficiency: 'Beginner' }

function authHeaders(extra = {}) {
  const token = localStorage.getItem('gl_token')
  return { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...extra }
}

export default function AdaptiveRoadmap() {
  const [career, setCareer] = useState(careers[0])
  const [skills, setSkills] = useState([{ ...emptySkill }])
  const [assessment, setAssessment] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadLatest() {
    setError('')
    try {
      const assessmentRes = await fetch('/api/assessments/latest', { headers: authHeaders() })
      if (assessmentRes.ok) {
        const latest = await assessmentRes.json()
        setAssessment(latest)
        setCareer(latest.career)
        setSkills(latest.existingSkills.length ? latest.existingSkills : [{ ...emptySkill }])
      }
      const roadmapRes = await fetch('/api/roadmaps/adaptive', { headers: authHeaders() })
      if (roadmapRes.ok) {
        const roadmaps = await roadmapRes.json()
        if (roadmaps.length) setRoadmap(roadmaps[0])
      }
    } catch (err) {
      setError('Could not connect to the backend.')
    }
  }

  useEffect(() => { loadLatest() }, [])

  function updateSkill(index, field, value) {
    setSkills(previous => previous.map((skill, i) => i === index ? { ...skill, [field]: value } : skill))
  }

  async function submitAssessment(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payloadSkills = skills.filter(skill => skill.name.trim())
      const res = await fetch('/api/assessments', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ career, existingSkills: payloadSkills })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Assessment failed')
      setAssessment(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateRoadmap() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/roadmaps/adaptive/generate', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ career })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Roadmap generation failed')
      setRoadmap(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateTopic(topicId, updates) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/roadmaps/adaptive/${encodeURIComponent(roadmap.career)}/topics/${encodeURIComponent(topicId)}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Progress update failed')
      setRoadmap(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function refreshRecommendations() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/roadmaps/adaptive/${encodeURIComponent(roadmap.career)}/recommendations`, {
        method: 'POST', headers: authHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Recommendation failed')
      setRoadmap(previous => ({ ...previous, recommendations: data.recommendations, completionPercent: data.completionPercent }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adaptive-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Adaptive career learning</p>
          <h2>Skill Assessment</h2>
        </div>
        {roadmap && <div className="progress-ring" style={{ '--progress': `${roadmap.completionPercent * 3.6}deg` }}>
          <span>{roadmap.completionPercent}%</span>
        </div>}
      </div>

      {error && <div className="alert">{error}</div>}
      {!localStorage.getItem('gl_token') && <div className="alert">Please login to save assessments and private progress.</div>}

      <section className="assessment-layout">
        <form className="card assessment-form" onSubmit={submitAssessment}>
          <h3>Your career profile</h3>
          <label>Desired career
            <select value={career} onChange={event => setCareer(event.target.value)}>
              {careers.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="skill-input-list">
            {skills.map((skill, index) => (
              <div className="skill-input" key={index}>
                <input aria-label="Skill name" value={skill.name} placeholder="e.g. JavaScript"
                  onChange={event => updateSkill(index, 'name', event.target.value)} />
                <select aria-label="Proficiency" value={skill.proficiency}
                  onChange={event => updateSkill(index, 'proficiency', event.target.value)}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
                {skills.length > 1 && <button type="button" className="icon-button"
                  onClick={() => setSkills(previous => previous.filter((_, i) => i !== index))}>x</button>}
              </div>
            ))}
          </div>
          <button type="button" className="text-button" onClick={() => setSkills(previous => [...previous, { ...emptySkill }])}>
            + Add skill
          </button>
          <button className="cta" type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze skill gaps'}</button>
        </form>

        {assessment && <div className="report-panel">
          <div className="report-summary">
            <h3>{assessment.career} skill gap report</h3>
            <p className="muted">{assessment.summary}</p>
          </div>
          <div className="gap-chart">
            {['Known', 'Improvement', 'Missing'].map(category => {
              const count = assessment.gaps.filter(gap => gap.category === category).length
              return <div key={category}><span>{category}</span><strong>{count}</strong></div>
            })}
          </div>
          <div className="gap-grid">
            {assessment.gaps.map(gap => (
              <article className={`skill-card gap-${gap.category.toLowerCase()}`} key={gap.name}>
                <div className="skill-card-title"><h4>{gap.name}</h4><span className={`priority ${gap.priority.toLowerCase()}`}>{gap.priority}</span></div>
                <p>{gap.currentProficiency} <span>→</span> {gap.requiredProficiency}</p>
                <div className="progress-track"><div style={{ width: gap.category === 'Known' ? '100%' : gap.category === 'Improvement' ? '60%' : '20%' }} /></div>
                <div className="resource-links">{gap.resources.map(resource => <a key={resource} href={resource} target="_blank" rel="noreferrer">Learning resource</a>)}</div>
              </article>
            ))}
          </div>
          <button className="cta" type="button" onClick={generateRoadmap} disabled={loading}>
            Generate personalized roadmap
          </button>
        </div>}
      </section>

      {roadmap && <section className="roadmap-section">
        <div className="page-heading">
          <div><p className="eyebrow">Personalized learning path</p><h2>{roadmap.title}</h2></div>
          <button className="secondary-button" onClick={refreshRecommendations} disabled={loading}>Refresh recommendations</button>
        </div>
        <div className="recommendation-bar">
          {roadmap.recommendations?.length ? roadmap.recommendations.map((item, index) => (
            <div key={index}><span>Next</span><p>{item}</p></div>
          )) : <p className="muted">No recommendations yet.</p>}
        </div>
        {roadmap.phases.map(phase => (
          <div className="phase" key={phase.id}>
            <div className="phase-heading"><h3>{phase.title}</h3><p>{phase.description}</p></div>
            <div className="topic-grid">
              {roadmap.topics.filter(topic => phase.topicIds.includes(topic.id)).map(topic => (
                <article className={`topic-card ${topic.status.toLowerCase()}`} key={topic.id}>
                  <div className="topic-status"><span>{topic.status}</span>{topic.struggling && <span className="struggle-tag">Needs revision</span>}</div>
                  <h4>{topic.title}</h4>
                  <p className="muted">{topic.description}</p>
                  <div className="topic-meta"><span>{topic.estimatedHours}h</span><span>{topic.assignments.length} assignment</span></div>
                  {topic.prerequisites.length > 0 && <p className="prerequisites">Requires: {topic.prerequisites.join(', ')}</p>}
                  <div className="resource-links">{topic.resources.map(resource => (
                    <a href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>{resource.label}</a>
                  ))}</div>
                  {topic.assignments.map(item => <p className="assignment" key={item}>Assignment: {item}</p>)}
                  {topic.status !== 'Locked' && (
                    <div className="topic-actions">
                      {topic.status !== 'Completed' && <button className="cta small" onClick={() => updateTopic(topic.id, { completed: true })}>Mark complete</button>}
                      <select value={topic.assessment} onChange={event => updateTopic(topic.id, { assessment: event.target.value })}>
                        <option>Not set</option><option>Easy</option><option>Good</option><option>Challenging</option><option>Struggled</option>
                      </select>
                      <button className="secondary-button small" onClick={() => updateTopic(topic.id, { struggling: !topic.struggling })}>
                        {topic.struggling ? 'Clear difficulty' : 'Report difficulty'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
        <div className="milestones">
          {roadmap.milestones.map(milestone => <div className={`milestone ${milestone.status.toLowerCase()}`} key={milestone.id}>
            <span>{milestone.status}</span><strong>{milestone.title}</strong>
          </div>)}
        </div>
      </section>}
    </div>
  )
}
