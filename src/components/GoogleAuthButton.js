import React, { useRef, useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, firebaseConfigPresent } from '../firebase'

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'

export default function GoogleAuthButton({ showAlert, navigate, label = 'Continue with Google' }) {
  const [isLoading, setIsLoading] = useState(false)
  // Synchronous ref guard: React state updates are async, so a fast double-click
  // could start a second signInWithPopup before the state re-renders. Overlapping
  // popup operations trigger Firebase's internal "INTERNAL ASSERTION FAILED:
  // Pending promise was never set" error, so block them before they can happen.
  const signingInRef = useRef(false)

  const handleGoogleLogin = async () => {
    if (signingInRef.current) return
    signingInRef.current = true
    setIsLoading(true)
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

      const responseBody = await response.text()
      let json = null
      try {
        json = responseBody ? JSON.parse(responseBody) : null
      } catch (parseError) {
        json = null
      }

      if (response.ok && json?.success) {
        localStorage.setItem('token', json.authToken)
        navigate('/')
        showAlert('Signed in with Google successfully', 'success')
      } else {
        showAlert(json?.error || responseBody || 'Google sign-in failed', 'danger')
      }
    } catch (error) {
      const code = error?.code || ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed the popup — that's not an error, don't bother them
      } else if (code === 'auth/popup-blocked') {
        showAlert('Google popup was blocked. Please allow popups for this site and try again.', 'warning')
      } else if (code === 'auth/unauthorized-domain') {
        showAlert('This domain is not authorized for Google sign-in. Add it in the Firebase console.', 'danger')
      } else {
        showAlert('Google sign-in failed', 'danger')
      }
    } finally {
      signingInRef.current = false
      setIsLoading(false)
    }
  }

  if (!firebaseConfigPresent || !auth || !googleProvider) {
    return null
  }

  return (
    <button
      type="button"
      className="btn btn-outline-danger"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      <i className={isLoading ? 'fa-solid fa-spinner fa-spin me-2' : 'fa-brands fa-google me-2'} />
      {isLoading ? 'Signing in...' : label}
    </button>
  )
}