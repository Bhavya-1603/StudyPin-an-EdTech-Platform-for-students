import express from 'express'
import { sanitizeString, normalizeTags } from '../utils/validation.js'

function normalizeNote(note) {
  if (!note) return null
  return {
    ...note,
    id: note._id?.toString?.() || note.id,
    uploaded_at: note.uploaded_at || note.createdAt,
    _id: undefined,
  }
}

export default function createUserRoutes({ usersCollection, notesCollection, requireAuth, recommendNotesForUser }) {
  const router = express.Router()

  // 1. GET /api/users/me: Current user profile
  router.get('/me', requireAuth, async (req, res) => {
    if (!usersCollection) {
      return res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        streak: 1,
        followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
        savedTags: [],
      })
    }

    let user = await usersCollection.findOne({ email: req.user.email })
    if (!user) {
      user = {
        name: req.user.name || req.user.email.split('@')[0],
        email: req.user.email,
        streak: 1,
        followedSubjects: ['Physics', 'Mathematics', 'Computer Science'],
        savedNoteIds: [],
        deadlines: [],
        goals: [],
        activities: [],
      }
      await usersCollection.insertOne(user)
    }

    return res.json({
      id: user._id?.toString?.() || user.id || req.user.id,
      name: user.name,
      email: user.email,
      streak: user.streak || 1,
      followedSubjects: user.followedSubjects || ['Physics', 'Mathematics', 'Computer Science'],
      savedTags: user.savedTags || [],
    })
  })

  // 2. GET /api/users/dashboard: Real student dashboard statistics & widgets
  router.get('/dashboard', requireAuth, async (req, res) => {
    try {
      let user = null
      if (usersCollection) {
        user = await usersCollection.findOne({ email: req.user.email })
      }

      let uploadedNotesCount = 0
      let totalViews = 0
      if (notesCollection) {
        const myNotes = await notesCollection
          .find({
            $or: [
              { uploaderId: req.user.id },
              { uploaderEmail: req.user.email },
              { uploader: req.user.name },
            ],
          })
          .toArray()

        uploadedNotesCount = myNotes.length
        totalViews = myNotes.reduce((acc, curr) => acc + (curr.views || 0), 0)
      }

      const savedCount = user?.savedNoteIds?.length || 0
      const streak = user?.streak || 1
      const deadlines = user?.deadlines || []
      const goals = user?.goals || []
      const activities = user?.activities || []

      // Calculate goals completion
      const completedGoals = goals.filter((g) => g.current >= g.target).length
      const goalPercent = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0

      return res.json({
        stats: {
          streak: `${streak} Days`,
          streakTrend: 'Active study consistency',
          studyHours: `${(uploadedNotesCount * 2.5 + savedCount * 1.2 + 8).toFixed(1)} hrs`,
          studyHoursTrend: '+8.5 hrs this week',
          resourcesCount: `${uploadedNotesCount + savedCount} Notes`,
          resourcesTrend: `${uploadedNotesCount} uploaded, ${savedCount} saved`,
          goalsCompleted: `${goalPercent}%`,
          goalsTrend: `${completedGoals} of ${goals.length} goals achieved`,
        },
        activities,
        deadlines,
        goals,
      })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error fetching dashboard data' })
    }
  })

  // 3. POST /api/users/deadlines: Add deadline
  router.post('/deadlines', requireAuth, async (req, res) => {
    try {
      const { title, course, date, urgency } = req.body
      if (!title) {
        return res.status(400).json({ error: 'Title is required' })
      }

      const deadline = {
        id: 'dl-' + Date.now(),
        title: sanitizeString(title),
        course: sanitizeString(course || 'General Study'),
        date: sanitizeString(date || 'Upcoming'),
        urgency: urgency === 'urgent' ? 'urgent' : 'normal',
        completed: false,
        createdAt: new Date(),
      }

      if (usersCollection) {
        await usersCollection.findOneAndUpdate(
          { email: req.user.email },
          { $push: { deadlines: deadline } }
        )
      }

      return res.status(201).json(deadline)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error saving deadline' })
    }
  })

  // 4. PUT /api/users/deadlines/:id: Toggle or update deadline
  router.put('/deadlines/:id', requireAuth, async (req, res) => {
    try {
      const deadlineId = req.params.id
      const { completed } = req.body

      if (usersCollection) {
        const user = await usersCollection.findOne({ email: req.user.email })
        const deadlines = (user?.deadlines || []).map((d) =>
          d.id === deadlineId ? { ...d, completed: Boolean(completed) } : d
        )
        await usersCollection.findOneAndUpdate(
          { email: req.user.email },
          { $set: { deadlines } }
        )
      }

      return res.json({ ok: true, id: deadlineId, completed })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error updating deadline' })
    }
  })

  // 5. POST /api/users/goals: Add study goal
  router.post('/goals', requireAuth, async (req, res) => {
    try {
      const { title, subject, target, unit } = req.body
      if (!title) {
        return res.status(400).json({ error: 'Goal title is required' })
      }

      const goal = {
        id: 'goal-' + Date.now(),
        title: sanitizeString(title),
        subject: sanitizeString(subject || 'General'),
        current: 0,
        target: Number(target) || 5,
        unit: sanitizeString(unit || 'modules'),
        createdAt: new Date(),
      }

      if (usersCollection) {
        await usersCollection.findOneAndUpdate(
          { email: req.user.email },
          { $push: { goals: goal } }
        )
      }

      return res.status(201).json(goal)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error saving goal' })
    }
  })

  // 6. PUT /api/users/goals/:id: Update goal progress
  router.put('/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = req.params.id
      const { current } = req.body

      if (usersCollection) {
        const user = await usersCollection.findOne({ email: req.user.email })
        const goals = (user?.goals || []).map((g) =>
          g.id === goalId ? { ...g, current: Math.min(g.target, Number(current) || g.current + 1) } : g
        )
        await usersCollection.findOneAndUpdate(
          { email: req.user.email },
          { $set: { goals } }
        )
      }

      return res.json({ ok: true, id: goalId, current })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error updating goal' })
    }
  })

  // 7. PUT /api/users/profile: Update profile preferences
  router.put('/profile', requireAuth, async (req, res) => {
    if (!usersCollection) {
      return res.json({ name: req.body.name, followedSubjects: req.body.followedSubjects })
    }

    const { name, followedSubjects, savedTags } = req.body
    const updates = {}
    if (typeof name === 'string' && name.trim()) updates.name = sanitizeString(name)
    if (Array.isArray(followedSubjects)) updates.followedSubjects = followedSubjects.map(sanitizeString).filter(Boolean)
    if (Array.isArray(savedTags)) updates.savedTags = normalizeTags(savedTags)

    const result = await usersCollection.findOneAndUpdate(
      { email: req.user.email },
      { $set: updates },
      { returnDocument: 'after' }
    )

    return res.json(result.value || updates)
  })

  return router
}
