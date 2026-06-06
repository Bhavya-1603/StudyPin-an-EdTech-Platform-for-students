import express from 'express'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { hashPassword, comparePassword, createJwtToken, createRefreshToken, verifyRefreshToken } from '../utils/auth.js'
import { sendPasswordResetOtp } from '../utils/email.js'
import { isValidEmail, isStrongPassword, sanitizeString } from '../utils/validation.js'

export default function createAuthRoutes({ usersCollection }) {
  const router = express.Router()

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('GOOGLE_CLIENT_ID is not configured; Google sign-in will be disabled.')
  }

  const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

  function generateOtp() {
    return crypto.randomInt(100000, 999999).toString()
  }

  function expiredResetOtp(user) {
    return !user?.resetPasswordOtpExpires || new Date(user.resetPasswordOtpExpires) < new Date()
  }

  async function verifyResetOtp(user, otp) {
    if (!user || !user.resetPasswordOtpHash || expiredResetOtp(user)) {
      return false
    }

    return comparePassword(otp, user.resetPasswordOtpHash)
  }

  function sendGenericResetResponse(res) {
    return res.json({ message: 'If that email exists, a password reset code has been sent.' })
  }

  function attachRefreshCookie(res, token) {
    const secure = process.env.NODE_ENV === 'production'
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    })
  }

  router.post('/google', async (req, res) => {
    try {
      const { credential } = req.body
      if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' })
      }

      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google OAuth is not configured' })
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      if (!payload?.email_verified) {
        return res.status(401).json({ error: 'Google account is not verified' })
      }

      const email = payload.email.toLowerCase()
      const name = sanitizeString(payload.name || 'StudyPin User')
      const picture = payload.picture

      let user = await usersCollection.findOne({ email })
      if (!user) {
        const result = await usersCollection.insertOne({
          name,
          email,
          avatar: picture,
          provider: 'google',
          createdAt: new Date(),
          streak: 0,
          followedSubjects: ['Mathematics', 'Physics'],
          savedTags: [],
        })

        user = {
          _id: result.insertedId,
          name,
          email,
          avatar: picture,
          streak: 0,
          followedSubjects: ['Mathematics', 'Physics'],
          savedTags: [],
        }
      }

      const accessToken = createJwtToken(user)
      const refreshToken = createRefreshToken(user)
      attachRefreshCookie(res, refreshToken)

      return res.json({
        token: accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          streak: user.streak || 0,
          followedSubjects: user.followedSubjects || [],
          savedTags: user.savedTags || [],
        },
      })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  })

  router.post('/register', async (req, res) => {
    const name = sanitizeString(req.body.name)
    const email = sanitizeString(req.body.email).toLowerCase()
    const password = req.body.password

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be least 8 characters and include uppercase, lowercase, number, and symbol',
      })
    }

    if (!usersCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const existing = await usersCollection.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' })
    }

    const passwordHash = await hashPassword(password)
    const result = await usersCollection.insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
      savedNotes: [],
      likes: [],
      followedSubjects: ['Mathematics', 'Physics'],
      savedTags: [],
      streak: 0,
    })

    const user = {
      id: result.insertedId.toString(),
      name,
      email,
      streak: 0,
      followedSubjects: ['Mathematics', 'Physics'],
      savedTags: [],
    }
    const accessToken = createJwtToken(user)
    const refreshToken = createRefreshToken(user)
    attachRefreshCookie(res, refreshToken)

    return res.json({ token: accessToken, user })
  })

  router.post('/login', async (req, res) => {
    const email = sanitizeString(req.body.email).toLowerCase()
    const password = req.body.password

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!usersCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const user = await usersCollection.findOne({ email })
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const accessToken = createJwtToken(user)
    const refreshToken = createRefreshToken(user)
    attachRefreshCookie(res, refreshToken)

    return res.json({
      token: accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        streak: user.streak || 0,
        followedSubjects: user.followedSubjects || [],
        savedTags: user.savedTags || [],
      },
    })
  })

  router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' })
    }

    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await usersCollection.findOne({ email: payload.email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const accessToken = createJwtToken(user)
    const newRefreshToken = createRefreshToken(user)
    attachRefreshCookie(res, newRefreshToken)

    return res.json({
      token: accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        streak: user.streak || 0,
        followedSubjects: user.followedSubjects || [],
        savedTags: user.savedTags || [],
      },
    })
  })

  router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    })
    return res.json({ message: 'Logged out successfully' })
  })

  router.post('/forgot-password', async (req, res) => {
    const email = sanitizeString(req.body.email).toLowerCase()
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!usersCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const user = await usersCollection.findOne({ email })
    if (!user) {
      return sendGenericResetResponse(res)
    }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const requestCount = user.resetPasswordOtpRequestedAt && new Date(user.resetPasswordOtpRequestedAt) > oneHourAgo
      ? (user.resetPasswordOtpRequestCount || 0) + 1
      : 1

    if (requestCount > 5) {
      return res.status(429).json({ error: 'Too many password reset requests. Please try again later.' })
    }

    const otp = generateOtp()
    const otpHash = await hashPassword(otp)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await usersCollection.updateOne(
      { email },
      {
        $set: {
          resetPasswordOtpHash: otpHash,
          resetPasswordOtpExpires: expiresAt,
          resetPasswordOtpRequestedAt: now,
          resetPasswordOtpRequestCount: requestCount,
        },
      }
    )

    try {
      await sendPasswordResetOtp(email, otp)
    } catch (error) {
      console.error('Error sending password reset OTP:', error.message)
    }

    return sendGenericResetResponse(res)
  })

  router.post('/reset-password', async (req, res) => {
    const email = sanitizeString(req.body.email).toLowerCase()
    const otp = sanitizeString(req.body.otp)
    const newPassword = req.body.newPassword

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be least 8 characters and include uppercase, lowercase, number, and symbol',
      })
    }

    if (!usersCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const user = await usersCollection.findOne({ email })
    if (!(await verifyResetOtp(user, otp))) {
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    const passwordHash = await hashPassword(newPassword)
    const result = await usersCollection.findOneAndUpdate(
      { email },
      {
        $set: { passwordHash },
        $unset: {
          resetPasswordOtpHash: '',
          resetPasswordOtpExpires: '',
          resetPasswordOtpRequestedAt: '',
          resetPasswordOtpRequestCount: '',
        },
      },
      { returnDocument: 'after' }
    )

    if (!result.value) {
      return res.status(404).json({ error: 'User not found' })
    }

    const accessToken = createJwtToken(result.value)
    const refreshToken = createRefreshToken(result.value)
    attachRefreshCookie(res, refreshToken)

    return res.json({
      token: accessToken,
      user: {
        id: result.value._id.toString(),
        name: result.value.name,
        email: result.value.email,
        streak: result.value.streak || 0,
        followedSubjects: result.value.followedSubjects || [],
        savedTags: result.value.savedTags || [],
      },
    })
  })

  return router
}
