import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import configFromFile from './firebase-applet-config.json'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configFromFile.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configFromFile.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configFromFile.projectId || '',
  firestoreDatabaseId: configFromFile.firestoreDatabaseId || '(default)',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configFromFile.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configFromFile.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || configFromFile.appId || '',
}

let app = null
let db = null
let auth = null

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    if (app) {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
      auth = getAuth(app)
    }
  }
} catch (e) {
  console.warn('Firebase init:', e.message)
}

export { db, auth }
export default app