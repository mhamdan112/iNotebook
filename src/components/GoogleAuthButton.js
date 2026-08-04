import React from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, firebaseConfigPresent } from '../firebase'

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'

export default function GoogleAuthButton({ showAlert, navigate, label = 'Continue with Google' }) {
  const handleGoogleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const response = await fetch(`${apiBaseUrl}/api/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      })

      const json = await response.json()
      if (json.success) {
        localStorage.setItem('token', json.authToken)
        navigate('/')
        showAlert('Signed in with Google successfully', 'success')
      } else {
        showAlert(json?.error || 'Google sign-in failed', 'danger')
      }
    } catch (error) {
      showAlert('Google sign-in failed', 'danger')
    }
  }

  if (!firebaseConfigPresent || !auth || !googleProvider) {
    return null
  }

  return (
    <button type="button" className="btn btn-outline-danger" onClick={handleGoogleLogin}>
      <i className="fa-brands fa-google me-2" />{label}
    </button>
  )
}