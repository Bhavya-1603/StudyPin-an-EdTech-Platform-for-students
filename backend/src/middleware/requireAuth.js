import jwt from 'jsonwebtoken'
import admin from '../config/firebaseAdmin.js'

const JWT_SECRET = process.env.JWT_SECRET || 'studypin-default-secret-key-2026'

export function createRequireAuth(usersCollection) {
  return async function requireAuthMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization

      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized', error: 'Authentication token required' })
      }

      const token = header.split(' ')[1]
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized', error: 'Authentication token missing' })
      }

      let decodedUser = null

      // 1. Try Firebase Admin verification if initialized
      try {
        if (admin.apps.length) {
          const firebaseUser = await admin.auth().verifyIdToken(token)
          decodedUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.name || firebaseUser.email?.split('@')[0],
          }
        }
      } catch {
        // Fall through to JWT/demo verification
      }

      // 2. Try JWT verification
      if (!decodedUser) {
        try {
          const payload = jwt.verify(token, JWT_SECRET)
          decodedUser = {
            id: payload.id || payload.uid,
            uid: payload.uid || payload.id,
            email: payload.email,
            name: payload.name || payload.email?.split('@')[0],
          }
        } catch {
          // Fall through to base64/demo token
        }
      }

      // 3. Fallback for demo token
      if (!decodedUser && (token.startsWith('demo-') || token.startsWith('studypin-') || token === 'guest-token')) {
        decodedUser = {
          id: 'demo-user-1',
          uid: 'demo-user-1',
          email: 'student@studypin.edu',
          name: 'StudyPin Student',
        }
      }

      if (!decodedUser) {
        return res.status(401).json({ message: 'Invalid token', error: 'Could not verify token' })
      }

      // 4. Attach profile from usersCollection if available
      if (usersCollection) {
        try {
          const dbUser = await usersCollection.findOne({ email: decodedUser.email })
          if (dbUser) {
            req.user = {
              id: dbUser._id?.toString?.() || dbUser.id || decodedUser.id,
              uid: decodedUser.uid,
              email: dbUser.email,
              name: dbUser.name || decodedUser.name,
              followedSubjects: dbUser.followedSubjects || ['Physics', 'Mathematics', 'Computer Science'],
              savedTags: dbUser.savedTags || ['Revision', 'Exam Prep'],
              streak: dbUser.streak || 4,
            }
            return next()
          }
        } catch {
          // ignore lookup errors
        }
      }

      req.user = {
        id: decodedUser.id,
        uid: decodedUser.uid,
        email: decodedUser.email,
        name: decodedUser.name,
        followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
        savedTags: ['Revision', 'Exam Prep'],
        streak: 4,
      }

      next()
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token', error: err.message })
    }
  }
}

export const requireAuth = createRequireAuth(null)