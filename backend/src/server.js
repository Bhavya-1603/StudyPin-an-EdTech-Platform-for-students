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
import { notes as sampleNotes } from './data/sampleNotes.js'
import createAuthRoutes from './routes/authRoutes.js'
import createNotesRoutes from './routes/notesRoutes.js'
import createUserRoutes from './routes/userRoutes.js'
import { createRequireAuth } from './middleware/requireAuth.js'
import { authRateLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, '../uploads')
const rawDir = join(uploadsDir, 'raw')

fs.mkdirSync(rawDir, { recursive: true })

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
    const extension = allowedFileTypes[file.mimetype] || extname(file.originalname).toLowerCase() || '.bin'
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
    return cb(null, true)
  },
})

let notesCollection = null
let usersCollection = null
const openAIEnabled = isOpenAIConfigured()

async function initializeDatabase() {
  try {
    const db = await connectDatabase()
    notesCollection = db.collection('notes')
    usersCollection = db.collection('users')

    await usersCollection.createIndex({ email: 1 }, { unique: true, background: true })
    await notesCollection.createIndex({ subject: 1 }, { background: true })
    await notesCollection.createIndex({ tags: 1 }, { background: true })
    await notesCollection.createIndex({ createdAt: -1 }, { background: true })

    const count = await notesCollection.countDocuments()
    if (count === 0) {
      for (const note of sampleNotes) {
        const content = `${note.title} ${note.description} ${note.subject} ${(note.tags || []).join(' ')}`
        const embedding = openAIEnabled ? await createEmbedding(content) : null
        const seededNote = {
          ...note,
          embedding,
          createdAt: new Date(note.uploaded_at),
          source: 'seed',
        }
        await notesCollection.insertOne(seededNote)
      }
    }

    console.log('MongoDB connected and notes seeded')
  } catch (error) {
    console.warn('MongoDB not available; running in demo mode. Error:', error.message)
  }
}

await initializeDatabase()

const requireAuth = createRequireAuth(usersCollection)
const authRouter = createAuthRoutes({ usersCollection })
const notesRouter = createNotesRoutes({
  notesCollection,
  requireAuth,
  upload,
  openAIEnabled,
  createEmbedding,
  sampleNotes,
})
const userRouter = createUserRoutes({ usersCollection, notesCollection, requireAuth, recommendNotesForUser })

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      connectSrc: ["'self'", allowedOrigin, 'https://oauth2.googleapis.com', 'https://accounts.google.com'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    },
  })
)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://study-pin-frontend.vercel.app"
  ],
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/uploads', express.static(uploadsDir, { index: false }))
app.use('/api/auth', authRateLimiter, authRouter)
app.use('/api/notes', notesRouter)
app.use('/api/users', userRouter)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`StudyPin backend running on http://localhost:${port}`)
})
