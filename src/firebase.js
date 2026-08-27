import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfigPresent = Boolean(process.env.REACT_APP_FIREBASE_API_KEY && process.env.REACT_APP_FIREBASE_AUTH_DOMAIN && process.env.REACT_APP_FIREBASE_PROJECT_ID && process.env.REACT_APP_FIREBASE_APP_ID)

let auth = null
let googleProvider = null

if (firebaseConfigPresent) {
  try {
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    }
    const app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
  } catch (e) {
    // If initialization fails, keep auth null and let the app continue
    // console.error('Firebase init error', e)
    auth = null
    googleProvider = null
  }
}

// Firefox's Google sign-in popup flow can throw an internal
// "INTERNAL ASSERTION FAILED: Pending promise was never set" error (a known
// firebase-js-sdk bug) that surfaces as an uncaught error. Swallow only that
// exact message so it never crashes the app.
const FIREBASE_ASSERTION_MESSAGE = 'Pending promise was never set'

function isFirebaseAssertion(message) {
  return typeof message === 'string' && message.includes(FIREBASE_ASSERTION_MESSAGE)
}

window.addEventListener('unhandledrejection', (event) => {
  if (isFirebaseAssertion(event?.reason?.message)) {
    event.preventDefault()
  }
})

window.addEventListener('error', (event) => {
  if (isFirebaseAssertion(event?.error?.message || event?.message)) {
    event.preventDefault()
  }
})

export { auth, googleProvider, firebaseConfigPresent }
