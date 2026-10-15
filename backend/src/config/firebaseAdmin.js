import admin from 'firebase-admin'

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      })
    }
  }
} catch (err) {
  console.warn('Firebase Admin not initialized with credentials:', err.message)
}

export default admin