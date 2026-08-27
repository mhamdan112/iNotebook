
import { useCallback, useState } from 'react'
import NoteContext from './notescontext'

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'

const NoteState = (props) => {
  const { showAlert } = props
  const initialnotes = []
const [notes, setNotes] = useState(initialnotes)

//get all notes
const getnotes = useCallback(async () => {
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/fetchnotes`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "auth-token": localStorage.getItem('token')
  },
});
  const json=await response.json();
  if (response.ok && Array.isArray(json)) {
   setNotes(json)
  }
}, [])

//Add a note
 const addnote = useCallback(async (title, description, tag) => {
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/addnote`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "auth-token": localStorage.getItem('token')
  },
  body: JSON.stringify({ title, description, tag }),
});
  const note = await response.json();
  if (response.ok) {
   setNotes(prevNotes => prevNotes.concat(note))
   showAlert('Note added successfully', 'success')
  } else {
   showAlert(note?.error || 'Failed to add note', 'danger')
  }
}, [showAlert])

//Delete a note
const deletenote = useCallback(async(id) => {
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/deletenote/${id}`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    "auth-token": localStorage.getItem('token')
  },
  
});
  const json = await response.json();
  if (response.ok) {
  setNotes(prevNotes => prevNotes.filter((note) => note._id !== id))
  showAlert('Note deleted successfully', 'success')
  } else {
  showAlert(json?.error || 'Failed to delete note', 'danger')
  }
}, [showAlert])
//Edit a note
const editnote = useCallback(async (id,title,description,tag)=>{
  //API call
  const response = await fetch(`${apiBaseUrl}/api/notes/updatenote/${id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "auth-token": localStorage.getItem('token')
  },
  body: JSON.stringify({ title, description, tag }),
  // …
});
  const json = await response.json();
  if (response.ok) {
    setNotes(prevNotes => prevNotes.map((note) => (
      note._id === id ? { ...note, title, description, tag } : note
    )));
    showAlert('Note updated successfully', 'success')
  } else {
    showAlert(json?.error || 'Failed to update note', 'danger')
  }
}, [showAlert])
//Search a note
const searchnotes = useCallback(async (query) => {
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/searchnote?q=${encodeURIComponent(query)}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "auth-token": localStorage.getItem('token')
  },
});
  const json=await response.json();
  if (response.ok && Array.isArray(json)) {
   setNotes(json)
  } else {
   showAlert(json?.error || 'Failed to search notes', 'danger')
  }
}, [showAlert])

    return(
        <NoteContext.Provider value={{ notes, setNotes, addnote, deletenote, editnote, getnotes, searchnotes }}>
           {props.children}
        </NoteContext.Provider>
    )
}
export default NoteState
