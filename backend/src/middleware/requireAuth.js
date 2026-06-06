import { verifyJwtToken } from '../utils/auth.js'
import { ObjectId } from 'mongodb'

export function createRequireAuth(usersCollection) {
  return async function requireAuth(req, res, next) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' })
    }

    const token = header.split(' ')[1]
    try {
      const payload = verifyJwtToken(token)
      if (!usersCollection) {
        return res.status(500).json({ error: 'Database is not available' })
      }

      const user = await usersCollection.findOne({
        _id: new ObjectId(payload.id),
        email: payload.email,
      })
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        streak: user.streak || 0,
        followedSubjects: user.followedSubjects || [],
        savedTags: user.savedTags || [],
      }

      return next()
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}
