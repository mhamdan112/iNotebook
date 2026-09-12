import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function GoogleAuthButton({ showAlert, navigate, label = 'Continue with Google' }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      if (!supabase) {
        showAlert('Supabase is not configured', 'danger')
        return
      }
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    } catch (error) {
      showAlert(error.message || 'Google sign-in failed', 'danger')
    } finally {
      setIsLoading(false)
    }
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