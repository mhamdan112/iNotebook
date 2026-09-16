import Context from "../context/notes/notescontext";
import React, { useContext, useEffect, useRef, useState } from "react";
import Noteitem from "./Noteitem";
import Addnote from "./Addnote";
import { useNavigate } from "react-router-dom";

const Notes = (props) => {
  const NoteContext = useContext(Context);
  let history = useNavigate();
  const { notes: rawNotes, getnotes, editnote, searchnotes, authReady, authToken } = NoteContext;
  const notes = Array.isArray(rawNotes) ? rawNotes : [];
  useEffect(() => {
    if (!authReady) return;
    if (authToken) {
     getnotes();
    } else {
      history("/login");
    }
  }, [authReady, authToken, getnotes, history]);
  const ref = useRef(null);
  const refClose = useRef(null);
  const [note, setNote] = useState({eid: "", etitle: "", edescription: "", etag: "" });
  const [searchQuery, setSearchQuery] = useState('');

  const handleclick = (e) => {
    refClose.current.click();
    editnote(note.eid, note.etitle, note.edescription, note.etag);
    console.log("Updating the note...", note);
  };

  const onChange = (e) => {
    setNote({ ...note, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      searchnotes(trimmedQuery);
    } else {
      getnotes();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    getnotes();
  };

  const updatenote = (currentNote) => {
    ref.current.click();
    setNote({
      eid: currentNote._id,
      etitle: currentNote.title,
      edescription: currentNote.description,
      etag: currentNote.tag,
    });
  };
  return (
    <>
      <Addnote />
      <button
        ref={ref}
        type="button"
        className="btn btn-primary d-none"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
      >
        Launch demo modal
      </button>
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Update Note
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="etitle" className="form-label">
                  Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="etitle"
                  name="etitle"
                  value={note.etitle}
                  onChange={onChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="edescription" className="form-label">
                  Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="edescription"
                  name="edescription"
                  value={note.edescription}
                  onChange={onChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="etag" className="form-label">
                  Tag
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="etag"
                  name="etag"
                  value={note.etag}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button ref={refClose}
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleclick}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="row my-3 g-3">
        <div className="col-12 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Your Notes</h2>
            <p className="text-secondary mb-0">Review, edit, and delete notes from your workspace.</p>
          </div>
        </div>
        <div className="col-12">
          <form className="d-flex flex-wrap gap-2" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search by title or tag"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-outline-primary rounded-pill">
              <i className="fa-solid fa-magnifying-glass me-2" />Search
            </button>
            <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={clearSearch}>
              Clear
            </button>
          </form>
        </div>
        <div className="container">
        {notes.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 text-center py-5">
            <div className="card-body">
              <div className="bg-primary-subtle text-primary rounded-4 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '4rem', height: '4rem' }}>
                <i className="fa-solid fa-note-sticky fs-3" />
              </div>
              <h3 className="h5 fw-semibold">No notes yet</h3>
              <p className="text-secondary mb-0">Add your first note above to start building your notebook.</p>
            </div>
          </div>
        )}
        </div>
        {notes.map((note) => {
          return (
            <Noteitem key={note._id} updatenote={updatenote} note={note} />
          );
        })}
      </div>
    </>
  );
};

export default Notes;
