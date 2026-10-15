import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import multer from 'multer'
import dotenv from 'dotenv'
import fs from 'fs'
import crypto from 'crypto'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'

import { connectDatabase } from './db/client.js'
import { createEmbedding, isOpenAIConfigured } from './utils/openaiClient.js'
import { recommendNotesForUser } from './utils/recommendation.js'

import createNotesRoutes from './routes/notesRoutes.js'
import createUserRoutes from './routes/userRoutes.js'
import createAuthRoutes from './routes/authRoutes.js'

import { createRequireAuth } from './middleware/requireAuth.js'
import { authRateLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)
const port = 3000
const __dirname = dirname(fileURLToPath(import.meta.url))

/* ---------------- FILE UPLOAD SETUP ---------------- */

const uploadsDir = join(__dirname, '../../uploads')
const rawDir = join(uploadsDir, 'raw')

try {
  fs.mkdirSync(rawDir, { recursive: true })
} catch {
  // directory might already exist
}

const allowedFileTypes = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, rawDir),
  filename: (req, file, cb) => {
    const extension =
      allowedFileTypes[file.mimetype] ||
      extname(file.originalname).toLowerCase() ||
      '.bin'

    const fileName = `${crypto.randomBytes(16).toString('hex')}${extension}`
    cb(null, fileName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedFileTypes[file.mimetype]) {
      return cb(new Error('Unsupported file type'))
    }
    cb(null, true)
  },
})

/* ---------------- IN-MEMORY FALLBACK COLLECTION ---------------- */

class InMemoryCollection {
  constructor(initialData = []) {
    this.items = initialData.map((d) => ({
      ...d,
      _id: d._id || d.id || 'doc-' + Math.random().toString(36).slice(2, 8),
      id: d.id || d._id || 'doc-' + Math.random().toString(36).slice(2, 8),
    }))
  }

  async createIndex() {
    return 'ok'
  }

  async countDocuments() {
    return this.items.length
  }

  async distinct(field) {
    const values = new Set()
    for (const item of this.items) {
      if (item[field] !== undefined) values.add(item[field])
    }
    return Array.from(values)
  }

  find(filter = {}) {
    let result = [...this.items]

    if (filter && typeof filter === 'object') {
      if (filter.subject) {
        result = result.filter((item) => item.subject === filter.subject)
      }
      if (filter.continueLearning) {
        result = result.filter((item) => item.continueLearning)
      }
      if (filter.$or && Array.isArray(filter.$or)) {
        result = result.filter((item) => {
          return filter.$or.some((cond) => {
            if (cond.id?.$in && cond.id.$in.includes(item.id)) return true
            if (cond._id?.$in && cond._id.$in.includes(item._id)) return true
            if (cond.uploaderId && item.uploaderId === cond.uploaderId) return true
            if (cond.uploaderEmail && item.uploaderEmail === cond.uploaderEmail) return true
            if (cond.subject?.$in) {
              return cond.subject.$in.includes(item.subject)
            }
            if (cond.tags?.$in) {
              return (item.tags || []).some((t) => cond.tags.$in.includes(t))
            }
            for (const key of ['title', 'description', 'subject', 'tags']) {
              if (cond[key]?.$regex) {
                const val = key === 'tags' ? (item.tags || []).join(' ') : (item[key] || '')
                if (new RegExp(cond[key].$regex, cond[key].$options || 'i').test(val)) {
                  return true
                }
              }
            }
            return false
          })
        })
      }
    }

    const queryObj = {
      _data: result,
      sort() {
        return queryObj
      },
      limit(n) {
        queryObj._data = queryObj._data.slice(0, n)
        return queryObj
      },
      async toArray() {
        return queryObj._data
      },
    }
    return queryObj
  }

  async findOne(query) {
    if (!query) return this.items[0] || null
    if (query.email) {
      const email = query.email.toLowerCase()
      return this.items.find((u) => (u.email || '').toLowerCase() === email) || null
    }
    if (query._id || query.id) {
      const id = query._id || query.id
      return this.items.find((u) => u._id === id || u.id === id) || null
    }
    return this.items[0] || null
  }

  async findOneAndUpdate(query, update) {
    let item = await this.findOne(query)
    if (!item) {
      if (query && query.email) {
        item = {
          _id: 'user-' + Date.now(),
          id: 'user-' + Date.now(),
          email: query.email,
          name: query.email.split('@')[0],
          savedNoteIds: [],
          deadlines: [],
          goals: [],
          activities: [],
        }
        this.items.push(item)
      } else {
        return { value: null }
      }
    }
    if (update.$set) {
      Object.assign(item, update.$set)
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        item[k] = (item[k] || 0) + v
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        item[k] = item[k] || []
        if (v && v.$each) {
          item[k].push(...v.$each)
          if (v.$slice && v.$slice < 0) {
            item[k] = item[k].slice(v.$slice)
          }
        } else {
          item[k].push(v)
        }
      }
    }
    return { value: item }
  }

  async deleteOne(query) {
    const idx = this.items.findIndex((it) => {
      if (query.$or) {
        return query.$or.some((c) => (c.id && it.id === c.id) || (c._id && it._id === c._id))
      }
      return (query.id && it.id === query.id) || (query._id && it._id === query._id)
    })
    if (idx !== -1) {
      this.items.splice(idx, 1)
      return { deletedCount: 1 }
    }
    return { deletedCount: 0 }
  }

  async insertOne(doc) {
    const id = doc.id || doc._id || 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    const item = { ...doc, _id: id, id }
    this.items.unshift(item)
    return { insertedId: id }
  }
}

/* ---------------- GLOBAL STATE ---------------- */

let currentNotes = new InMemoryCollection([])
let currentUsers = new InMemoryCollection([])

const notesCollection = new Proxy({}, {
  get(_, prop) {
    const val = currentNotes[prop]
    return typeof val === 'function' ? val.bind(currentNotes) : val
  }
})

const usersCollection = new Proxy({}, {
  get(_, prop) {
    const val = currentUsers[prop]
    return typeof val === 'function' ? val.bind(currentUsers) : val
  }
})

const openAIEnabled = isOpenAIConfigured()

/* ---------------- DB INIT (NON-BLOCKING) ---------------- */

async function initializeDatabase() {
  try {
    const db = await connectDatabase()
    if (db) {
      const realNotes = db.collection('notes')
      const realUsers = db.collection('users')

      await realUsers.createIndex({ email: 1 }, { unique: true }).catch(() => {})
      await realNotes.createIndex({ subject: 1 }).catch(() => {})
      await realNotes.createIndex({ tags: 1 }).catch(() => {})
      await realNotes.createIndex({ createdAt: -1 }).catch(() => {})

      currentNotes = realNotes
      currentUsers = realUsers
      console.log('MongoDB Atlas connected and active (clean production database)')
      return
    }
  } catch (error) {
    console.warn('MongoDB connection note: running with in-memory collection.', error.message)
  }
}

// Start database connection in background without blocking server listen
initializeDatabase().catch((err) => console.warn('Background DB init:', err.message))

/* ---------------- ROUTES INIT ---------------- */

const requireAuth = createRequireAuth(usersCollection)
const authRouter = createAuthRoutes({ usersCollection })
const notesRouter = createNotesRoutes({
  notesCollection,
  usersCollection,
  requireAuth,
  upload,
  openAIEnabled,
  createEmbedding,
})
const userRouter = createUserRoutes({
  usersCollection,
  notesCollection,
  requireAuth,
  recommendNotesForUser,
})

/* ---------------- MIDDLEWARE ---------------- */

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
)

app.use(
  cors({
    origin: true,
    credentials: true,
  })
)

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

/* ---------------- STATIC ---------------- */

app.use('/uploads', express.static(uploadsDir, { index: false }))

/* ---------------- HEALTH ROUTE ---------------- */

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() })
})

/* ---------------- API ROUTES ---------------- */

app.use('/api/auth', authRateLimiter, authRouter)
app.use('/api/notes', notesRouter)
app.use('/api/users', userRouter)

/* ---------------- ERROR HANDLER ---------------- */

app.use(errorHandler)

export { app, port, uploadsDir }