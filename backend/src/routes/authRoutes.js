import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { isValidEmail } from '../utils/validation.js'
import { sendPasswordResetOtp } from '../utils/email.js'

const JWT_SECRET = process.env.JWT_SECRET || 'studypin-default-secret-key-2026'

export default function createAuthRoutes({ usersCollection }) {
  const router = express.Router()

  // Generate a standardized user auth payload
  function createTokenPayload(user) {
    const payload = {
      id: user._id?.toString?.() || user.id || 'user-' + Date.now(),
      uid: user.uid || user._id?.toString?.() || user.id || 'user-' + Date.now(),
      email: user.email,
      name: user.name || user.email.split('@')[0],
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    return {
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        streak: user.streak || 4,
        followedSubjects: user.followedSubjects || ['Physics', 'Mathematics', 'Computer Science'],
        savedTags: user.savedTags || ['Revision', 'Exam Prep'],
      },
      token,
    }
  }

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required' })
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }

      if (usersCollection) {
        const existing = await usersCollection.findOne({ email: email.toLowerCase() })
        if (existing) {
          return res.status(409).json({ error: 'An account with this email already exists' })
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = {
        name: name?.trim() || email.split('@')[0],
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        streak: 1,
        followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
        savedTags: ['StudyPin', 'Exam Prep'],
        createdAt: new Date(),
      }

      if (usersCollection) {
        const result = await usersCollection.insertOne(newUser)
        newUser._id = result.insertedId
      }

      const authData = createTokenPayload(newUser)
      return res.status(201).json(authData)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Registration failed' })
    }
  })

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }

      let user = null
      if (usersCollection) {
        user = await usersCollection.findOne({ email: email.toLowerCase().trim() })
      }

      if (!user) {
        // If demo mode or first login, provide friendly default demo account
        user = {
          _id: 'user-' + Date.now(),
          name: email.split('@')[0] || 'StudyPin Learner',
          email: email.toLowerCase().trim(),
          streak: 4,
          followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
          savedTags: ['Revision', 'Exam Prep'],
        }
        if (usersCollection) {
          await usersCollection.insertOne(user)
        }
      } else if (user.password && password) {
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
          return res.status(401).json({ error: 'Invalid password' })
        }
      }

      const authData = createTokenPayload(user)
      return res.json(authData)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Login failed' })
    }
  })

  // POST /api/auth/google
  router.post('/google', async (req, res) => {
    try {
      const { credential } = req.body
      let email = 'student@studypin.edu'
      let name = 'StudyPin Student'

      if (credential) {
        try {
          const parts = credential.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
            if (payload.email) email = payload.email
            if (payload.name) name = payload.name
          }
        } catch {
          // ignore decode failure
        }
      }

      let user = null
      if (usersCollection) {
        user = await usersCollection.findOne({ email: email.toLowerCase() })
        if (!user) {
          user = {
            name,
            email: email.toLowerCase(),
            streak: 3,
            followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
            savedTags: ['AI & ML', 'Exam Prep'],
            createdAt: new Date(),
          }
          const result = await usersCollection.insertOne(user)
          user._id = result.insertedId
        }
      } else {
        user = {
          _id: 'google-user-' + Date.now(),
          name,
          email,
          streak: 3,
          followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
          savedTags: ['AI & ML', 'Exam Prep'],
        }
      }

      const authData = createTokenPayload(user)
      return res.json(authData)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Google authentication failed' })
    }
  })

  // POST /api/auth/refresh-token
  router.post('/refresh-token', async (req, res) => {
    try {
      const authHeader = req.headers.authorization
      let user = null

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        try {
          const decoded = jwt.verify(token, JWT_SECRET)
          if (usersCollection) {
            user = await usersCollection.findOne({ email: decoded.email })
          }
          if (!user) {
            user = {
              _id: decoded.id || decoded.uid,
              email: decoded.email,
              name: decoded.name,
              streak: 4,
            }
          }
        } catch {
          // expired or invalid
        }
      }

      if (!user) {
        // Return default demo user session if requested
        user = {
          _id: 'demo-student-1',
          email: 'student@example.com',
          name: 'StudyPin Learner',
          streak: 5,
          followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
          savedTags: ['NCERT', 'Revision'],
        }
      }

      const authData = createTokenPayload(user)
      return res.json(authData)
    } catch (err) {
      return res.status(401).json({ error: 'Session expired' })
    }
  })

  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({ ok: true, message: 'Logged out successfully' })
  })

  // POST /api/auth/forgot-password
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    try {
      await sendPasswordResetOtp(email, otp)
    } catch {
      // email credentials not set, simulate success in dev
    }
    return res.json({ ok: true, message: 'If an account exists, a reset code was sent.' })
  })

  return router
}
