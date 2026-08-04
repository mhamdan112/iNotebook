import React,{useContext} from 'react'
import Context from '../context/notes/notescontext'


const Noteitem = (props) => {
  const NoteContext = useContext(Context)
  const {deletenote} = NoteContext
  const { note,updatenote } = props;
  const tagLabel = note.tag?.trim() || 'General'
  return (
    <div className='col-md-6 col-xl-4'>
      <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="bg-primary" style={{ height: '4px' }} />
        <div className="card-body p-4 d-flex flex-column">
          <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
            <div>
              <span className="badge text-bg-primary-subtle text-primary rounded-pill px-3 py-2 mb-3">{tagLabel}</span>
              <h5 className="card-title fw-bold mb-0 text-dark">{note.title}</h5>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-primary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }} aria-label="edit" onClick={() => updatenote(note)}>
                <i className="fa-regular fa-pen-to-square" />
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }} aria-label="delete" onClick={() => deletenote(note._id)}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
          <p className="card-text text-secondary mb-4 flex-grow-1">{note.description}</p>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <small className="text-muted">Saved note</small>
            <i className="fa-solid fa-note-sticky text-warning" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Noteitem
