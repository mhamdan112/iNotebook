import './App.css';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import About from './components/About';
import Home from './components/Home';
import Login from './components/login';
import Signup from './components/signup';
import NoteState from './context/notes/Notestate';
import Alert from './components/Alert';
import { useState } from 'react';
import { useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const[alert, setAlert] = useState(null);
  useEffect(() => {
    if (!supabase) return undefined;
    const syncToken = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) localStorage.setItem('token', data.session.access_token);
      else localStorage.removeItem('token');
    };
    syncToken();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) localStorage.setItem('token', session.access_token);
      else localStorage.removeItem('token');
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  const showAlert = (message, type) => {
    setAlert({
      msg: message,
      type: type
    })
    setTimeout(() => {
      setAlert(null);
    }, 1500);
  }
  return (
    <>
    <NoteState showAlert={showAlert}>
        <Navbar showAlert={showAlert} />
        <Alert alert={alert}/>
       <div className="container">
      <Routes>
        <Route path="/" element={<Home showAlert={showAlert}/>} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login showAlert={showAlert}/>} />
        <Route path="/signup" element={<Signup showAlert={showAlert}/>} />
      </Routes>
      </div>
    </NoteState>
    </>
  );
}

export default App;