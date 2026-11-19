import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export default function RoadmapDetail() {
  const { slug } = useParams()
  const [roadmap, setRoadmap] = useState(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRoadmap(null)
    setError('')
    setIndex(0)
    setFlipped(false)
    fetch(`/api/roadmaps/${slug}`)
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Roadmap not found')
        return data
      })
      .then(setRoadmap)
      .catch(err => setError(err.message || 'Could not load this roadmap'))
  }, [slug])

  useEffect(() => {
    function handleKey(event) {
      if (!roadmap?.topics?.length) return
      if (event.key === 'ArrowRight') showNext()
      if (event.key === 'ArrowLeft') showPrevious()
      if (event.key === ' ') {
        event.preventDefault()
        setFlipped(value => !value)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  function showNext() {
    setIndex(value => Math.min(value + 1, roadmap.topics.length - 1))
    setFlipped(false)
  }

  function showPrevious() {
    setIndex(value => Math.max(value - 1, 0))
    setFlipped(false)
  }

  if (error) return (
    <div className="flashcard-empty">
      <h2>Roadmap unavailable</h2>
      <p className="muted">{error}</p>
      <Link className="secondary-button" to="/roadmaps">Back to roadmaps</Link>
    </div>
  )

  if (!roadmap) return <div className="flashcard-loading"><div className="loading-ring" /><p className="muted">Loading flashcards...</p></div>
  if (!roadmap.topics?.length) return <div className="flashcard-empty"><h2>No topics yet</h2><Link className="secondary-button" to="/roadmaps">Back to roadmaps</Link></div>

  const topic = roadmap.topics[index]

  return (
    <div className="flashcard-page">
      <header className="flashcard-header">
        <div>
          <Link className="back-link" to="/roadmaps">← All roadmaps</Link>
          <p className="eyebrow">Learning flashcards</p>
          <h2>{roadmap.title}</h2>
        </div>
        <div className="flashcard-count">{index + 1} / {roadmap.topics.length}</div>
      </header>

      <div className="flashcard-progress">
        <div style={{ width: `${((index + 1) / roadmap.topics.length) * 100}%` }} />
      </div>

      <button
        type="button"
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(value => !value)}
        aria-label={flipped ? 'Show topic summary' : 'Show learning resources'}
      >
        <div className="flashcard-face flashcard-front">
          <span className="topic-number">Topic {index + 1}</span>
          <h3>{topic.title}</h3>
          <p>{topic.description || 'Review this topic and complete the practice resource.'}</p>
          <span className="flip-hint">Click or press Space to flip</span>
        </div>
        <div className="flashcard-face flashcard-back">
          <span className="topic-number">Learn & practice</span>
          <h3>{topic.title}</h3>
          {topic.resources?.length ? (
            <div className="flashcard-resources">
              {topic.resources.map((resource, resourceIndex) => (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`${resource.url}-${resourceIndex}`}
                  onClick={event => event.stopPropagation()}
                >
                  <span>{resource.type}</span>{resource.label} →
                </a>
              ))}
            </div>
          ) : <p className="muted">No written resources are listed for this topic.</p>}
          {topic.videoLinks?.length ? (
            <div className="flashcard-videos">
              {topic.videoLinks.map((video, videoIndex) => (
                <a href={video} target="_blank" rel="noreferrer" key={video} onClick={event => event.stopPropagation()}>
                  Watch video {videoIndex + 1}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </button>

      <div className="flashcard-controls">
        <button type="button" className="secondary-button" onClick={showPrevious} disabled={index === 0}>
          ← Previous
        </button>
        <button type="button" className="flip-button" onClick={() => setFlipped(value => !value)}>
          {flipped ? 'Show topic' : 'Reveal resources'}
        </button>
        <button type="button" className="cta" onClick={showNext} disabled={index === roadmap.topics.length - 1}>
          Next →
        </button>
      </div>
    </div>
  )
}
