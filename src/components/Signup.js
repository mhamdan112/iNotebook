import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from './GoogleAuthButton';

const Signup = (props) => {
    const [credentials, setCredentials] = useState({name:"",email:"",password:"",cpassword:""})
    const navigate = useNavigate();
 const handlesubmit = async(e) => {
    e.preventDefault();
    if (credentials.password !== credentials.cpassword) {
      alert("Passwords do not match");
      return;
    }
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/createUser`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({name:credentials.name,email:credentials.email,password:credentials.password}),
  });

  const json=await response.json();
  if(json.success){

    localStorage.setItem('token',json.authToken);
    navigate("/");
    props.showAlert("Account Created Successfully","success");
  }
  else{
    props.showAlert("Invalid Credentials","danger");
  }
  }
const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  }
  return (
    <div className='container'>
    <div className="mt-3">
    <h2 className='my-2'>Create an account to use iNotebook</h2>
       <form onSubmit={handlesubmit}>
  <div className="mb-3">
    <label htmlFor="exampleInputName1" className="form-label">Name</label>
    <input type="text" name="name" value={credentials.name} onChange={onChange} className="form-control" id="exampleInputName1"/>
  </div>
  <div className="mb-3">
    <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
    <input type="email" name="email" value={credentials.email} onChange={onChange} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"/>
  </div>
  <div className="mb-3">
    <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
    <input type="password" name="password" value={credentials.password} onChange={onChange} className="form-control" id="exampleInputPassword1"/>
  </div>
  <div className="mb-3">
    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
    <input type="password" name="cpassword" value={credentials.cpassword} onChange={onChange} className="form-control" id="confirmPassword"/>
  </div>
  <div className="d-flex flex-wrap gap-2">
    <button type="submit" className="btn btn-primary">Submit</button>
    <GoogleAuthButton showAlert={props.showAlert} navigate={navigate} label="Sign up with Google" />
  </div>
</form>
 </div>
    </div>
  )
}

export default Signup
