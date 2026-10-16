import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { apiUrl } from '../utils/api'

export { auth }
const provider = new GoogleAuthProvider()

// 1. Google sign-in with token generation
export const loginWithGoogle = async () => {
  if (authInstance) {
    try {
      const result = await signInWithPopup(authInstance, provider)
      const token = await result.user.getIdToken()
      return {
        user: {
          uid: result.user.uid,
          id: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          name: result.user.displayName,
          getIdToken: async () => token,
        },
        token,
      }
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
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      name: data.user.name,
      isNewUser: data.user.isNewUser,
      getIdToken: async () => data.token,
    },
    token: data.token,
  }
}

// 2. Email & Password Login with JWT Token Generation
export const loginUser = async (email, password) => {
  // First attempt backend authentication which signs a full JWT token
  try {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (res.ok && data.token) {
      return {
        user: {
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.name,
          name: data.user.name,
          isNewUser: data.user.isNewUser,
          isReturningUser: data.user.isReturningUser,
          accountStatus: data.user.accountStatus,
          getIdToken: async () => data.token,
        },
        token: data.token,
      }
    }

    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed')
    }
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch')) {
      throw err
    }
  }

  // Fallback to Firebase client if available
  if (authInstance) {
    const cred = await signInWithEmailAndPassword(authInstance, email, password)
    const token = await cred.user.getIdToken()
    return {
      user: {
        uid: cred.user.uid,
        id: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        name: cred.user.displayName,
        getIdToken: async () => token,
      },
      token,
    }
  }

  throw new Error('Unable to generate authentication token. Please check your credentials.')
}

// 3. User Registration (Explicit first step: no session token until authentication)
export const registerUser = async (name, email, password) => {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Registration failed')
  }

  // Also register with Firebase client if configured
  if (authInstance) {
    try {
      await createUserWithEmailAndPassword(authInstance, email, password)
    } catch {
      // Firebase registration is optional if backend registration succeeded
    }
  }

  return {
    success: true,
    message: data.message,
    email: data.email,
    name: data.name,
    requiresAuthentication: true,
  }
}

// 4. Dedicated Token Generator: Fetches fresh token for existing user
export const generateAuthToken = async (email, password) => {
  const res = await fetch(apiUrl('/api/auth/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Token generation failed')
  }
  return data
}