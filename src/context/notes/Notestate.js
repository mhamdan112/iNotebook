
import { useCallback, useEffect, useRef, useState } from 'react'
import NoteContext from './notescontext'
import { supabase } from '../../supabaseClient'

const configuredApiUrl = process.env.REACT_APP_API_BASE_URL || ''
const apiBaseUrl = window.location.hostname === 'localhost'
  ? (configuredApiUrl && !configuredApiUrl.includes('localhost') ? configuredApiUrl : 'http://localhost:8000')
  : window.location.origin

const NoteState = (props) => {
  const { showAlert } = props
  const [notes, setNotes] = useState([])
  const [authToken, setAuthToken] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return undefined
    }

    const syncSession = (session) => {
      const nextToken = session?.access_token || null
      setAuthToken((previousToken) => {
        if (previousToken !== nextToken) {
          requestId.current += 1
          setNotes([])
        }
        return nextToken
      })
      if (nextToken) localStorage.setItem('token', nextToken)
      else localStorage.removeItem('token')
      setAuthReady(true)
    }

    supabase.auth.getSession().then(({ data }) => syncSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => syncSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])

//get all notes
const getnotes = useCallback(async () => {
  const token = authToken
  if (!token) {
    setNotes([])
    return
  }
  const currentRequest = ++requestId.current
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/fetchnotes`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "auth-token": token
  },
});
  const json=await response.json();
  if (response.ok && Array.isArray(json) && currentRequest === requestId.current && token === authToken) {
   setNotes(json)
  }
}, [authToken])

//Add a note
 const addnote = useCallback(async (title, description, tag) => {
  const token = authToken
  if (!token) {
    showAlert('Please log in again before adding a note', 'warning')
    return
  }
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/addnote`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "auth-token": token
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
}, [authToken, showAlert])

//Delete a note
const deletenote = useCallback(async(id) => {
  const token = authToken
  if (!token) return
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/deletenote/${id}`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    "auth-token": token
  },
  
});
  const json = await response.json();
  if (response.ok) {
  setNotes(prevNotes => prevNotes.filter((note) => note._id !== id))
  showAlert('Note deleted successfully', 'success')
  } else {
  showAlert(json?.error || 'Failed to delete note', 'danger')
  }
}, [authToken, showAlert])
//Edit a note
const editnote = useCallback(async (id,title,description,tag)=>{
  const token = authToken
  if (!token) return
  //API call
  const response = await fetch(`${apiBaseUrl}/api/notes/updatenote/${id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "auth-token": token
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
}, [authToken, showAlert])
//Search a note
const searchnotes = useCallback(async (query) => {
  const token = authToken
  if (!token) return
  const currentRequest = ++requestId.current
  //Api call
   const response = await fetch(`${apiBaseUrl}/api/notes/searchnote?q=${encodeURIComponent(query)}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "auth-token": token
  },
});
  const json=await response.json();
  if (response.ok && Array.isArray(json) && currentRequest === requestId.current && token === authToken) {
   setNotes(json)
  } else {
   showAlert(json?.error || 'Failed to search notes', 'danger')
  }
}, [authToken, showAlert])

    return(
        <NoteContext.Provider value={{ notes, setNotes, addnote, deletenote, editnote, getnotes, searchnotes, authReady, authToken }}>
           {props.children}
        </NoteContext.Provider>
    )
}
export default NoteState
