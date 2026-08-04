import React from 'react'
import Notes from './Notes'
export default function Home(props) {


  return (
    <div className="container py-5">
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-lg-11">
          <div
            className="position-relative overflow-hidden rounded-4 shadow-lg text-white p-4 p-md-5"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #2563eb 100%)',
            }}
          >
            <div className="row align-items-center g-4 position-relative">
              <div className="col-lg-8">
                <span className="badge text-bg-warning text-dark rounded-pill px-3 py-2 mb-3">Your personal notebook</span>
                <h1 className="display-5 fw-bold mb-3">Capture ideas, keep them organized, and get back to work faster.</h1>
                <p className="lead text-light-emphasis mb-0">
                  Use iNotebook to store notes in a clean workspace that feels polished, focused, and easy to revisit.
                </p>
              </div>
              <div className="col-lg-4">
                <div className="bg-white text-dark rounded-4 shadow-sm p-4 border border-light-subtle">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-success-subtle text-success rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: '3rem', height: '3rem' }}>
                      <i className="fa-solid fa-bolt fs-4" />
                    </div>
                    <div>
                      <h2 className="h5 mb-1 fw-semibold">Fast note flow</h2>
                      <p className="text-secondary mb-0">Create, edit, and manage notes in seconds.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-11">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-4 p-md-5 bg-white">
              <Notes showAlert={props.showAlert}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
