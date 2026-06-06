import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const accessSecret = process.env.JWT_SECRET
const refreshSecret = process.env.JWT_REFRESH_SECRET

if (!accessSecret || !refreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be configured')
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function createJwtToken(user) {
  const payload = {
    id: user._id?.toString?.() || user.id,
    email: user.email,
    name: user.name,
  }

  return jwt.sign(payload, accessSecret, { expiresIn: '15m' })
}

export function createRefreshToken(user) {
  const payload = {
    id: user._id?.toString?.() || user.id,
    email: user.email,
  }

  return jwt.sign(payload, refreshSecret, { expiresIn: '30d' })
}

export function verifyJwtToken(token) {
  return jwt.verify(token, accessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret)
}
