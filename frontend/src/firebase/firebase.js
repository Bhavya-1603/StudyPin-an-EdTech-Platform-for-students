import { initializeApp, getApps } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCVT7o-9-C2zQZJP0mJJguANw8Yv2Q4FyM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'studypin-498608.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'studypin-498608',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'studypin-498608.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '235883357796',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:235883357796:web:b82f1b15124a44fdf36171',
}

let app = null
try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
} catch (e) {
  console.warn('Firebase init:', e.message)
}

export default app