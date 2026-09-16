import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from './GoogleAuthButton';
import { supabase } from '../supabaseClient';
const Login = (props) => {

 const [credentials, setCredentials] = useState({email:"",password:""})
 const navigate = useNavigate();
 const handlesubmit = async(e) => {
    e.preventDefault();
  if (!supabase) {
    props.showAlert('Supabase is not configured', 'danger');
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (!error) {
    navigate("/");
    props.showAlert("Logged in Successfully","success");
  }
  else{
    props.showAlert(error.message || "Invalid Credentials","danger");
  }
  
  }

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  }
  return (
  <div className='container my-2'>
  <div className="mt-3">
  <form onSubmit={handlesubmit}>
   <h2 className='my-2'>Login to continue to iNotebook</h2>
  <div className="mb-3">
    <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
    <input type="email" name="email" value={credentials.email} onChange={onChange} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"/>
    <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
  </div>
  <div className="mb-3">
    <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
    <input type="password" name="password" value={credentials.password} onChange={onChange} className="form-control" id="exampleInputPassword1"/>
  </div>
  <div className="d-flex flex-wrap gap-2">
    <button type="submit" className="btn btn-primary">Submit</button>
    <GoogleAuthButton showAlert={props.showAlert} navigate={navigate} />
  </div>
</form>
</div>
</div>
  )
}

export default Login
