import express from 'express'
import { sanitizeString, normalizeTags } from '../utils/validation.js'

function normalizeNote(note) {
  return {
    ...note,
    id: note._id?.toString?.() || note.id,
    uploaded_at: note.uploaded_at || note.createdAt,
    _id: undefined,
  }
}

export default function createUserRoutes({ usersCollection, notesCollection, requireAuth, recommendNotesForUser }) {
  const router = express.Router()

  router.get('/me', requireAuth, async (req, res) => {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const user = await usersCollection.findOne({ email: req.user.email })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      streak: user.streak || 0,
      followedSubjects: user.followedSubjects || [],
      savedTags: user.savedTags || [],
    })
  })

  router.put('/profile', requireAuth, async (req, res) => {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const { name, followedSubjects, savedTags } = req.body
    const updates = {}
    if (typeof name === 'string' && name.trim()) updates.name = sanitizeString(name)
    if (Array.isArray(followedSubjects)) updates.followedSubjects = followedSubjects.map(sanitizeString).filter(Boolean)
    if (Array.isArray(savedTags)) updates.savedTags = normalizeTags(savedTags)

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No profile updates provided' })
    }

    const result = await usersCollection.findOneAndUpdate(
      { email: req.user.email },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result.value) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      id: result.value._id.toString(),
      name: result.value.name,
      email: result.value.email,
      streak: result.value.streak || 0,
      followedSubjects: result.value.followedSubjects || [],
      savedTags: result.value.savedTags || [],
    })
  })

  router.get('/continue-learning', requireAuth, async (req, res) => {
    if (!notesCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const notes = await notesCollection
      .find({ continueLearning: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray()

    return res.json(notes.map(normalizeNote))
  })

  router.get('/based-on-your-notes', requireAuth, async (req, res) => {
    if (!notesCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const filters = []
    if (req.user.followedSubjects?.length) {
      filters.push({ subject: { $in: req.user.followedSubjects } })
    }
    if (req.user.savedTags?.length) {
      filters.push({ tags: { $in: req.user.savedTags } })
    }

    const query = filters.length ? { $or: filters } : {}
    const notes = await notesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray()

    return res.json(notes.map(normalizeNote))
  })

  router.get('/recommendations', requireAuth, async (req, res) => {
    if (!notesCollection) {
      return res.status(500).json({ error: 'Database is not connected' })
    }

    const notes = await notesCollection.find({}).toArray()
    const recommended = recommendNotesForUser(req.user, notes)
    return res.json(recommended.map((note) => normalizeNote(note)))
  })

  return router
}
