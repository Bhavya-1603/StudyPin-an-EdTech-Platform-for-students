import express from 'express'
import { escapeRegex, normalizeTags, sanitizeString } from '../utils/validation.js'
import { uploadRateLimiter } from '../middleware/rateLimiter.js'

function normalizeNote(note) {
  return {
    ...note,
    id: note._id?.toString?.() || note.id,
    uploaded_at: note.uploaded_at || note.createdAt,
    _id: undefined,
  }
}

function buildNoteFilter(query, subject) {
  const filter = {}
  if (query) {
    const escaped = escapeRegex(query)
    const regex = { $regex: escaped, $options: 'i' }
    filter.$or = [
      { title: regex },
      { description: regex },
      { subject: regex },
      { tags: regex },
    ]
  }
  if (subject) {
    filter.subject = sanitizeString(subject)
  }
  return filter
}

export default function createNotesRoutes({ notesCollection, requireAuth, upload, openAIEnabled, createEmbedding, sampleNotes }) {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const query = sanitizeString(req.query.q ?? '')
    const subject = sanitizeString(req.query.subject ?? '')
    const filter = buildNoteFilter(query, subject)

    if (!notesCollection) {
      const fallback = sampleNotes.filter((note) => {
        if (subject && note.subject !== subject) return false
        if (!query) return true
        const search = query.toLowerCase()
        return [note.title, note.description, note.subject, ...(note.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      return res.json(fallback.map(normalizeNote))
    }

    const notes = await notesCollection.find(filter).sort({ createdAt: -1 }).toArray()
    return res.json(notes.map(normalizeNote))
  })

  router.get('/subjects', async (req, res) => {
    if (!notesCollection) {
      const subjects = Array.from(new Set(sampleNotes.map((note) => note.subject))).sort()
      return res.json(subjects)
    }

    const subjects = await notesCollection.distinct('subject')
    subjects.sort()
    return res.json(subjects)
  })

  router.post('/upload', requireAuth, uploadRateLimiter, upload.single('file'), async (req, res) => {
    const title = sanitizeString(req.body.title)
    const description = sanitizeString(req.body.description)
    const subject = sanitizeString(req.body.subject) || 'Mathematics'
    const tags = normalizeTags(req.body.tags)
    const file = req.file

    if (!file || !title || !description) {
      return res.status(400).json({ error: 'Title, description, and file upload are required' })
    }

    const note = {
      title,
      description,
      subject,
      tags,
      file_url: `/uploads/raw/${file.filename}`,
      thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80',
      likes: 0,
      saves: 0,
      views: 0,
      uploaded_at: new Date().toISOString(),
      uploader: req.user.name || 'Anonymous',
      uploaderId: req.user.id,
      difficulty: 'Medium',
      recommended: false,
      continueLearning: true,
      basedOnYourNotes: true,
      analysis: {
        summary: `Uploaded material summary for ${sanitizeString(file.originalname)}.`,
        keyTopics: ['Concept outline', 'Study path', 'Exam-ready review'],
        difficultyScore: 42,
      },
      createdAt: new Date(),
    }

    const content = `${title} ${description} ${subject} ${note.tags.join(' ')}`
    if (openAIEnabled && createEmbedding) {
      note.embedding = await createEmbedding(content)
    }

    if (!notesCollection) {
      return res.json({ note: normalizeNote(note), analysis: note.analysis })
    }

    const result = await notesCollection.insertOne(note)
    const insertedNote = { ...note, id: result.insertedId.toString() }
    return res.json({ note: insertedNote, analysis: note.analysis })
  })

  router.get('/search', async (req, res) => {
    const query = sanitizeString(req.query.q ?? '')
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const filter = buildNoteFilter(query, null)
    if (!notesCollection) {
      const search = query.toLowerCase()
      const fallback = sampleNotes.filter((note) =>
        [note.title, note.description, note.subject, ...(note.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(search)
      )
      return res.json(fallback.map(normalizeNote))
    }

    const notes = await notesCollection.find(filter).sort({ createdAt: -1 }).toArray()
    return res.json(notes.map(normalizeNote))
  })

  return router
}
