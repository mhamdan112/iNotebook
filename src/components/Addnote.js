import React, { useState, useContext } from 'react'
import Context from '../context/notes/notescontext'

const configuredApiUrl = process.env.REACT_APP_API_BASE_URL || ''
const apiBaseUrl = window.location.hostname === 'localhost'
  ? (configuredApiUrl && !configuredApiUrl.includes('localhost') ? configuredApiUrl : 'http://localhost:8000')
  : window.location.origin

const Addnote = () => {
  const noteContext = useContext(Context)
  const { addnote } = noteContext
  const [note, setNote] = useState({ title: '', description: '', tag: '' })
  const [summary, setSummary] = useState(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [isGeneratingNote, setIsGeneratingNote] = useState(false)
  const [generatedNoteError, setGeneratedNoteError] = useState('')
  const [isAutoTagging, setIsAutoTagging] = useState(false)
  const [autoTagError, setAutoTagError] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])

  const handleclick = (e) => {
    e.preventDefault()
    addnote(note.title, note.description, note.tag)
    setNote({ title: '', description: '', tag: '' })
    setSummary(null)
    setSummaryError('')
    setGeneratedNoteError('')
    setAutoTagError('')
    setTagSuggestions([])
  }

  const handleAutoTag = async () => {
    try {
      setIsAutoTagging(true)
      setAutoTagError('')

      const response = await fetch(`${apiBaseUrl}/api/ai/autotag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ title: note.title, description: note.description }),
      })

      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json?.error || 'Could not suggest a tag')
      }

      setNote((currentNote) => ({ ...currentNote, tag: json.tag }))
      setTagSuggestions(json.suggestions || [])
    } catch (error) {
      setAutoTagError(error.message || 'Could not suggest a tag')
    } finally {
      setIsAutoTagging(false)
    }
  }

  const applySuggestion = (suggestedTag) => {
    setNote((currentNote) => ({ ...currentNote, tag: suggestedTag }))
    setTagSuggestions([])
  }

  const canAutoTag = (note.title + ' ' + note.description).trim().length >= 10

  const onChange = (e) => {
    setNote({ ...note, [e.target.name]: e.target.value })
  }

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true)
      setSummaryError('')

      const response = await fetch(`${apiBaseUrl}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify(note),
      })

      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json?.error || 'Could not summarize this note')
      }

      setSummary({
        summary: json.summary,
        bullets: json.bullets || [],
        provider: json.provider,
      })
    } catch (error) {
      setSummary(null)
      setSummaryError(error.message || 'Could not summarize this note')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleGenerateNoteFromText = async () => {
    try {
      setIsGeneratingNote(true)
      setGeneratedNoteError('')

      const response = await fetch(`${apiBaseUrl}/api/ai/createNoteFromRawText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ rawText: note.description }),
      })

      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json?.error || 'Could not generate a note from this text')
      }

      setNote({
        title: json.title || '',
        description: json.description || '',
        tag: json.tag || '',
      })
      setSummary(null)
      setSummaryError('')
    } catch (error) {
      setGeneratedNoteError(error.message || 'Could not generate a note from this text')
    } finally {
      setIsGeneratingNote(false)
    }
  }

  const useSummaryAsDescription = () => {
    if (!summary?.summary) {
      return
    }

    setNote((currentNote) => ({
      ...currentNote,
      description: summary.summary,
    }))
  }

  return (
    <div className='card border-0 shadow-lg rounded-4 overflow-hidden mb-4'>
      <div className="card-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #2563eb 100%)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-warning text-dark rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: '3rem', height: '3rem' }}>
            <i className="fa-solid fa-pen-nib fs-4" />
          </div>
          <div>
            <h2 className="h4 fw-bold mb-1">Add a new note</h2>
            <p className="mb-0 text-light">Capture a thought, task, or idea before it slips away.</p>
          </div>
        </div>
      </div>
      <div className="card-body p-4 p-md-5 bg-white">
        <form onSubmit={handleclick}>
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <label htmlFor="title" className="form-label fw-semibold">Title</label>
              <input
                value={note.title}
                type="text"
                className="form-control form-control-lg rounded-3"
                id="title"
                name="title"
                placeholder="What is this note about?"
                onChange={onChange}
              />
            </div>
            <div className="col-12 col-lg-6">
              <label htmlFor="tag" className="form-label fw-semibold">Tag</label>
              <div className="input-group">
                <input
                  value={note.tag}
                  type="text"
                  className="form-control form-control-lg rounded-start-3"
                  id="tag"
                  name="tag"
                  placeholder="Work, study, personal..."
                  onChange={onChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-warning rounded-end-3 fw-semibold"
                  onClick={handleAutoTag}
                  disabled={isAutoTagging || !canAutoTag}
                  title="Let AI suggest a tag for this note"
                >
                  <i className="fa-solid fa-wand-magic-sparkles me-2" />
                  {isAutoTagging ? 'Tagging...' : 'Auto-tag'}
                </button>
              </div>
              {autoTagError ? (
                <small className="text-danger d-block mt-1">{autoTagError}</small>
              ) : null}
              {tagSuggestions.length ? (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <small className="text-secondary align-self-center me-1">Try:</small>
                  {tagSuggestions.map((suggestedTag) => (
                    <button
                      key={suggestedTag}
                      type="button"
                      className="btn btn-sm rounded-pill text-bg-warning border-0 px-3"
                      onClick={() => applySuggestion(suggestedTag)}
                    >
                      {suggestedTag}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="col-12">
              <label htmlFor="description" className="form-label fw-semibold">Description</label>
              <textarea
                value={note.description}
                className="form-control form-control-lg rounded-3"
                id="description"
                name="description"
                rows="4"
                placeholder="Write the details here..."
                onChange={onChange}
              />
            </div>
            <div className="col-12 d-flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-4 fw-semibold"
                onClick={handleGenerateNoteFromText}
                disabled={isGeneratingNote || note.description.trim().length < 10}
              >
                <i className="fa-solid fa-sparkles me-2" />
                {isGeneratingNote ? 'Generating note...' : 'Generate Note from Raw Text'}
              </button>
              <button
                type="button"
                className="btn btn-outline-dark rounded-pill px-4 fw-semibold"
                onClick={handleSummarize}
                disabled={isSummarizing || note.description.trim().length < 10}
              >
                <i className="fa-solid fa-wand-magic-sparkles me-2" />
                {isSummarizing ? 'Generating summary...' : 'Generate AI Summary'}
              </button>
              <button disabled={note.title.length < 3 || note.description.length < 5} type="submit" className="btn btn-primary btn-lg rounded-pill px-4 fw-semibold">
                <i className="fa-solid fa-plus me-2" />Add Note
              </button>
            </div>
            <div className="col-12">
              <small className="text-secondary">Keep titles at least 3 characters and descriptions at least 5.</small>
            </div>
            {generatedNoteError ? (
              <div className="col-12">
                <div className="alert alert-warning rounded-4 mb-0">{generatedNoteError}</div>
              </div>
            ) : null}
            {summaryError ? (
              <div className="col-12">
                <div className="alert alert-warning rounded-4 mb-0">{summaryError}</div>
              </div>
            ) : null}
            {summary ? (
              <div className="col-12">
                <div className="border rounded-4 p-4 bg-light">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <h3 className="h5 fw-bold mb-0">AI Summary</h3>
                    <span className="badge text-bg-secondary text-uppercase">{summary.provider}</span>
                  </div>
                  <p className="mb-3 text-dark">{summary.summary}</p>
                  {summary.bullets.length ? (
                    <ul className="mb-3">
                      {summary.bullets.map((bullet, index) => (
                          <li key={`${bullet}-${index}`}>{bullet}</li>
                        ))}
                    </ul>
                  ) : null}
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-dark rounded-pill px-4" onClick={useSummaryAsDescription}>
                      Use summary in note
                    </button>
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setSummary(null)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Addnote
