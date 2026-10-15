import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { apiUrl } from '../utils/api'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCVT7o-9-C2zQZJP0mJJguANw8Yv2Q4FyM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'studypin-498608.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'studypin-498608',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:235883357796:web:b82f1b15124a44fdf36171',
}

let app = null
let authInstance = null

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  authInstance = getAuth(app)
} catch (err) {
  console.warn('Firebase client auth initialization skipped:', err.message)
}

export const auth = authInstance
const provider = new GoogleAuthProvider()

export const loginWithGoogle = async () => {
  if (authInstance) {
    try {
      const result = await signInWithPopup(authInstance, provider)
      const token = await result.user.getIdToken()
      return { user: result.user, token }
    } catch {
      // Fallback to backend API
    }
  }

  // Fallback to local auth endpoint
  const res = await fetch(apiUrl('/api/auth/google'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: 'demo-google-credential' }),
  })
  const data = await res.json()
  return {
    user: {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      getIdToken: async () => data.token,
    },
    token: data.token,
  }
}

export const loginUser = async (email, password) => {
  if (authInstance) {
    try {
      return await signInWithEmailAndPassword(authInstance, email, password)
    } catch (err) {
      if (err.code !== 'auth/invalid-credential' && err.code !== 'auth/wrong-password') {
        // Fall back to server auth route
      } else {
        throw err
      }
    }
  }

  // Fallback to server route
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Login failed')
  }

  return {
    user: {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      getIdToken: async () => data.token,
    },
  }
}

export const registerUser = async (email, password) => {
  if (authInstance) {
    try {
      return await createUserWithEmailAndPassword(authInstance, email, password)
    } catch (err) {
      if (err.code !== 'auth/email-already-in-use') {
        // Fall back to server auth route
      } else {
        throw err
      }
    }
  }

  // Fallback to server route
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed')
  }

  return {
    user: {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      getIdToken: async () => data.token,
    },
  }
}