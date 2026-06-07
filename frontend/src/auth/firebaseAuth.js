import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
const provider = new GoogleAuthProvider()

// Google login
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider)
  const token = await result.user.getIdToken()
  return { user: result.user, token }
}

// Email login
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

// Register
export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)