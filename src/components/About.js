import React, { useContext } from 'react'
import NoteContext from '../context/notes/notescontext'

export default function About() {
  const context = useContext(NoteContext)
  const appName = context?.name || 'iNotebook'

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-11">
          <div
            className="position-relative overflow-hidden rounded-4 shadow-lg text-white p-4 p-md-5"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #2563eb 100%)',
            }}
          >
            <div className="position-absolute top-0 end-0 w-50 h-100 opacity-25 bg-light" style={{ clipPath: 'circle(50% at 80% 20%)' }} />
            <div className="row align-items-center g-4 position-relative">
              <div className="col-lg-7">
                <span className="badge text-bg-warning text-dark rounded-pill px-3 py-2 mb-3">About {appName}</span>
                <h1 className="display-5 fw-bold mb-3">A smarter way to capture ideas, tasks, and everything in between.</h1>
                <p className="lead text-light-emphasis mb-4">
                  {appName} helps you organize your thoughts in one clean workspace so your notes stay easy to create,
                  update, and revisit whenever you need them.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge rounded-pill text-bg-light text-dark px-3 py-2">Fast note taking</span>
                  <span className="badge rounded-pill text-bg-light text-dark px-3 py-2">Secure access</span>
                  <span className="badge rounded-pill text-bg-light text-dark px-3 py-2">Simple organization</span>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="bg-white text-dark rounded-4 shadow-sm p-4 border border-light-subtle">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary-subtle text-primary rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: '3rem', height: '3rem' }}>
                      <i className="fa-solid fa-notes-medical fs-4" />
                    </div>
                    <div>
                      <h2 className="h5 mb-1 fw-semibold">Built for daily use</h2>
                      <p className="text-secondary mb-0">Designed to keep your writing clear and accessible.</p>
                    </div>
                  </div>

                  <ul className="list-unstyled mb-0">
                    <li className="d-flex gap-3 py-2 border-top">
                      <i className="fa-solid fa-check text-success mt-1" />
                      <span>Create notes quickly with a clean editor.</span>
                    </li>
                    <li className="d-flex gap-3 py-2 border-top">
                      <i className="fa-solid fa-check text-success mt-1" />
                      <span>Edit and refine your notes whenever ideas change.</span>
                    </li>
                    <li className="d-flex gap-3 py-2 border-top">
                      <i className="fa-solid fa-check text-success mt-1" />
                      <span>Keep your workspace focused and distraction-free.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <div className="bg-primary-subtle text-primary rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '3rem', height: '3rem' }}>
                    <i className="fa-solid fa-pen-to-square fs-4" />
                  </div>
                  <h3 className="h5 fw-semibold">Create with ease</h3>
                  <p className="text-secondary mb-0">
                    Capture thoughts fast with a straightforward interface that keeps the focus on your content.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <div className="bg-success-subtle text-success rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '3rem', height: '3rem' }}>
                    <i className="fa-solid fa-shield-halved fs-4" />
                  </div>
                  <h3 className="h5 fw-semibold">Keep it secure</h3>
                  <p className="text-secondary mb-0">
                    Your notes stay tied to your account so your workspace feels personal and protected.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <div className="bg-warning-subtle text-warning rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '3rem', height: '3rem' }}>
                    <i className="fa-solid fa-layer-group fs-4" />
                  </div>
                  <h3 className="h5 fw-semibold">Stay organized</h3>
                  <p className="text-secondary mb-0">
                    Group your ideas, revisit them later, and keep everything in one tidy notebook.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
