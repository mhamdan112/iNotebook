import React from 'react'
import { Link ,useLocation} from 'react-router-dom';


export default function Navbar(props) {
  let location =useLocation();
  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
    //show alert message after logout
    props.showAlert?.('Logged out successfully', 'success')
  }
  
  return (
    <div>
      <nav
        className="navbar navbar-expand-lg navbar-dark shadow-lg mx-3 mt-3 rounded-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #2563eb 100%)' }}
      >
  <div className="container-fluid px-3 px-md-4 py-1">
    <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
      <span className="bg-warning text-dark rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: '2.25rem', height: '2.25rem' }}>
        <i className="fa-solid fa-book-open" />
      </span>
      iNotebook
    </Link>
    <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse" id="navbarSupportedContent">
      <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-2">
        <li className="nav-item">
          <Link className={location.pathname === "/" ? "nav-link active px-3 rounded-pill bg-light text-dark" : "nav-link px-3 rounded-pill"} aria-current="page" to="/">Home</Link>
        </li>
        <li className="nav-item">
          <Link className={location.pathname === "/about" ? "nav-link active px-3 rounded-pill bg-light text-dark" : "nav-link px-3 rounded-pill"} to="/about">About</Link>
        </li>
      </ul>
      {!localStorage.getItem("token") ? (
        <form className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-light rounded-pill px-3" to="/login">Login</Link>
          <Link className="btn btn-warning rounded-pill px-3 fw-semibold" to="/signup">Sign Up</Link>
        </form>
      ) : (
        <button type="button" className="btn btn-warning rounded-pill px-3 fw-semibold" onClick={handleLogout}>Logout</button>
      )}
    </div>
  </div>
  </nav>
    </div>
  )
}
