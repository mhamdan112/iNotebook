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

export { auth, googleProvider, firebaseConfigPresent }
