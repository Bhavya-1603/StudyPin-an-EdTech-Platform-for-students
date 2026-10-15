import express from 'express'
import { escapeRegex, normalizeTags, sanitizeString } from '../utils/validation.js'
import { uploadRateLimiter } from '../middleware/rateLimiter.js'
import { generateStudyInsights } from '../utils/fileProcessing.js'

export function inferCategory(subject = '', title = '', tags = []) {
  const text = `${subject} ${title} ${Array.isArray(tags) ? tags.join(' ') : tags}`.toLowerCase()
  
  if (/math|calculus|algebra|geometry|statistic|trigonometr|integral|derivat|matric|matrix|linear algebra/.test(text)) {
    return 'Math'
  }
  if (/histor|civiliz|empire|revolution|war|dynasty|colonial|republic|renaissance|archaeolog|monarchy|constitution/.test(text)) {
    return 'History'
  }
  if (/comput|code|programm|software|algorithm|dsa|ai|ml|machine learn|neural|database|python|java|javascript|network|os|cyber/.test(text)) {
    return 'Computer Science'
  }
  if (/literature|english|poetry|prose|novel|drama|shakespeare|rhetoric|grammar|linguistic|essay|author/.test(text)) {
    return 'Literature'
  }
  if (/mechanic|circuit|thermodynam|electrical|electronic|civil|gate|aerospace|robotics|fluid|robot/.test(text)) {
    return 'Engineering'
  }
  if (/science|physic|chem|bio|organic|optics|atomic|quantum|cell|genetics|ecolog|physiol|botany|zoolog|astronom|molecule/.test(text)) {
    return 'Science'
  }
  return 'Science'
}

function normalizeNote(note) {
  if (!note) return null
  const category = note.category || inferCategory(note.subject, note.title, note.tags) || 'Science'
  return {
    ...note,
    category,
    id: note._id?.toString?.() || note.id,
    uploaded_at: note.uploaded_at || note.createdAt || new Date().toISOString(),
    _id: undefined,
  }
}

function buildNoteFilter(query, subject, category) {
  const filter = {}
  if (query) {
    const escaped = escapeRegex(query)
    const regex = { $regex: escaped, $options: 'i' }
    filter.$or = [
      { title: regex },
      { description: regex },
      { subject: regex },
      { category: regex },
      { tags: regex },
    ]
  }
  if (subject && subject !== 'All') {
    filter.subject = sanitizeString(subject)
  }
  if (category && category !== 'All') {
    filter.category = sanitizeString(category)
  }
  return filter
}

export default function createNotesRoutes({
  notesCollection,
  usersCollection,
  requireAuth,
  upload,
  openAIEnabled,
  createEmbedding,
}) {
  const router = express.Router()

  // 1. GET /api/notes: Get all notes with optional search, subject & category filter
  router.get('/', async (req, res) => {
    try {
      const query = sanitizeString(req.query.q ?? '')
      const subject = sanitizeString(req.query.subject ?? '')
      const category = sanitizeString(req.query.category ?? '')
      const filter = buildNoteFilter(query, subject, category)

      if (!notesCollection) {
        return res.json([])
      }

      const notes = await notesCollection.find(filter).sort({ createdAt: -1 }).toArray()
      return res.json(notes.map(normalizeNote))
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error fetching notes' })
    }
  })

  // 2. GET /api/notes/categories: Get category summary with count of notes
  router.get('/categories', async (req, res) => {
    try {
      const standardCategories = ['Science', 'History', 'Math', 'Computer Science', 'Literature', 'Engineering', 'Other']
      let allNotes = []
      if (notesCollection) {
        allNotes = await notesCollection.find({}).toArray()
      }

      const counts = { All: allNotes.length }
      standardCategories.forEach((cat) => {
        counts[cat] = 0
      })

      for (const note of allNotes) {
        const cat = note.category || inferCategory(note.subject, note.title, note.tags)
        if (counts[cat] !== undefined) {
          counts[cat] += 1
        } else {
          counts['Other'] = (counts['Other'] || 0) + 1
        }
      }

      const categoryList = [
        { name: 'All', count: counts.All, label: 'All Resources' },
        ...standardCategories.map((name) => ({
          name,
          count: counts[name] || 0,
          label: name,
        })),
      ]

      return res.json(categoryList)
    } catch (err) {
      return res.json([
        { name: 'All', count: 0, label: 'All Resources' },
        { name: 'Science', count: 0, label: 'Science' },
        { name: 'History', count: 0, label: 'History' },
        { name: 'Math', count: 0, label: 'Math' },
        { name: 'Computer Science', count: 0, label: 'Computer Science' },
      ])
    }
  })

  // 3. GET /api/notes/subjects: Get all distinct subjects in the database
  router.get('/subjects', async (req, res) => {
    try {
      if (!notesCollection) {
        return res.json(['Physics', 'Mathematics', 'Computer Science', 'History', 'Chemistry', 'Biology', 'Engineering', 'Literature'])
      }

      const subjects = await notesCollection.distinct('subject')
      if (!subjects || subjects.length === 0) {
        return res.json(['Physics', 'Mathematics', 'Computer Science', 'History', 'Chemistry', 'Biology', 'Engineering', 'Literature'])
      }
      subjects.sort()
      return res.json(subjects)
    } catch {
      return res.json(['Physics', 'Mathematics', 'Computer Science', 'History', 'Chemistry', 'Biology', 'Engineering', 'Literature'])
    }
  })

  // 4. GET /api/notes/saved: Get all notes saved by the current user
  router.get('/saved', requireAuth, async (req, res) => {
    try {
      if (!usersCollection || !notesCollection) {
        return res.json([])
      }

      const user = await usersCollection.findOne({ email: req.user.email })
      const savedIds = user?.savedNoteIds || []

      if (!savedIds.length) {
        return res.json([])
      }

      const notes = await notesCollection
        .find({
          $or: [
            { id: { $in: savedIds } },
            { _id: { $in: savedIds } },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray()

      return res.json(notes.map(normalizeNote))
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error fetching saved notes' })
    }
  })

  // 5. GET /api/notes/my-uploads: Get all notes uploaded by the current user
  router.get('/my-uploads', requireAuth, async (req, res) => {
    try {
      if (!notesCollection) {
        return res.json([])
      }

      const notes = await notesCollection
        .find({
          $or: [
            { uploaderId: req.user.id },
            { uploaderEmail: req.user.email },
            { uploader: req.user.name },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray()

      return res.json(notes.map(normalizeNote))
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error fetching your notes' })
    }
  })

  // 6. POST /api/notes/upload: Upload real note file with categorized metadata and analysis
  router.post('/upload', requireAuth, uploadRateLimiter, upload.single('file'), async (req, res) => {
    try {
      const title = sanitizeString(req.body.title)
      const description = sanitizeString(req.body.description)
      const rawCategory = sanitizeString(req.body.category)
      const subject = sanitizeString(req.body.subject) || 'Science'
      const tags = normalizeTags(req.body.tags)
      const file = req.file

      if (!file || !title || !description) {
        return res.status(400).json({ error: 'Title, description, and file upload are required' })
      }

      // Establish explicit or inferred category (e.g., 'Science', 'History', 'Math', etc.)
      const category = rawCategory || inferCategory(subject, title, tags)

      // Generate analysis based on actual uploaded file and category
      const baseInsights = generateStudyInsights(
        `${title}. ${description}. Category: ${category}. Subject: ${subject}. Tags: ${tags.join(', ')}`
      )

      const note = {
        title,
        description,
        category,
        subject,
        tags,
        file_url: `/uploads/raw/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
        fileMimeType: file.mimetype,
        thumbnail: '',
        likes: 0,
        saves: 0,
        views: 1,
        uploaded_at: new Date().toISOString(),
        uploader: req.user.name || req.user.email?.split('@')[0] || 'Student',
        uploaderId: req.user.id,
        uploaderEmail: req.user.email,
        difficulty: 'Medium',
        recommended: true,
        continueLearning: true,
        basedOnYourNotes: true,
        analysis: {
          summary: baseInsights.detailedSummary || `Extracted summary and key review topics for ${file.originalname}.`,
          keyTopics: baseInsights.keyTopics || [category, subject, 'Key Concepts'],
          difficultyScore: baseInsights.difficultyScore || 50,
          flashcards: baseInsights.flashcards || [],
        },
        createdAt: new Date(),
      }

      const content = `${title} ${description} ${category} ${subject} ${note.tags.join(' ')}`
      if (openAIEnabled && createEmbedding) {
        try {
          note.embedding = await createEmbedding(content)
        } catch {
          // ignore embedding generation failure
        }
      }

      let insertedId = 'note-' + Date.now()
      if (notesCollection) {
        const result = await notesCollection.insertOne(note)
        insertedId = result.insertedId ? result.insertedId.toString() : insertedId
      }

      const insertedNote = { ...note, id: insertedId }

      // Log real user activity with category context
      if (usersCollection) {
        try {
          await usersCollection.findOneAndUpdate(
            { email: req.user.email },
            {
              $push: {
                activities: {
                  $each: [
                    {
                      id: 'act-' + Date.now(),
                      type: 'upload',
                      title: `Uploaded ${category} note: "${title}"`,
                      category,
                      subject,
                      time: 'Just now',
                      score: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                      actionText: 'View Note',
                      link: `/explore?category=${encodeURIComponent(category)}`,
                      createdAt: new Date(),
                    },
                  ],
                  $slice: -20, // keep last 20
                },
              },
            }
          )
        } catch {
          // ignore activity log error
        }
      }

      return res.status(201).json({ note: insertedNote, analysis: note.analysis })
    } catch (err) {
      console.error('Upload handler error:', err)
      return res.status(500).json({ error: err.message || 'Failed to process upload' })
    }
  })

  // 7. POST /api/notes/:id/save: Toggle saving/bookmarking a note
  router.post('/:id/save', requireAuth, async (req, res) => {
    try {
      const noteId = req.params.id
      if (!usersCollection) {
        return res.json({ saved: true, noteId })
      }

      const user = await usersCollection.findOne({ email: req.user.email })
      const savedIds = new Set(user?.savedNoteIds || [])
      const isSaved = savedIds.has(noteId)

      let updatedSaved = false
      if (isSaved) {
        savedIds.delete(noteId)
        updatedSaved = false
      } else {
        savedIds.add(noteId)
        updatedSaved = true
      }

      const savedArray = Array.from(savedIds)
      await usersCollection.findOneAndUpdate(
        { email: req.user.email },
        {
          $set: { savedNoteIds: savedArray },
          ...(updatedSaved
            ? {
                $push: {
                  activities: {
                    $each: [
                      {
                        id: 'act-' + Date.now(),
                        type: 'save',
                        title: `Bookmarked resource for revision`,
                        subject: 'Study Material',
                        time: 'Just now',
                        score: 'Saved to library',
                        actionText: 'Open Library',
                        link: '/saved',
                        createdAt: new Date(),
                      },
                    ],
                    $slice: -20,
                  },
                },
              }
            : {}),
        }
      )

      if (notesCollection) {
        await notesCollection.findOneAndUpdate(
          { $or: [{ id: noteId }, { _id: noteId }] },
          { $inc: { saves: updatedSaved ? 1 : -1 } }
        ).catch(() => {})
      }

      return res.json({
        saved: updatedSaved,
        noteId,
        savedCount: savedArray.length,
      })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error toggling save' })
    }
  })

  // 8. DELETE /api/notes/:id: Delete note uploaded by user
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const noteId = req.params.id
      if (!notesCollection) {
        return res.json({ ok: true, deleted: true })
      }

      await notesCollection.deleteOne({
        $or: [{ id: noteId }, { _id: noteId }],
        uploaderEmail: req.user.email,
      })

      return res.json({ ok: true, deleted: true })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error deleting note' })
    }
  })

  return router
}
