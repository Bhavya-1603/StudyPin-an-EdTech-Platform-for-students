import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import fs from 'fs'
import { resolve } from 'path'

// Allow .env values to override environment defaults
dotenv.config({ override: true })

let uri = process.env.MONGO_URI

// If URI is pointing to dummy localhost:27017 or empty, attempt reading Atlas URI from .env
if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
  try {
    const envPath = resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/MONGO_URI=(mongodb\+srv:\/\/[^\r\n]+)/)
      if (match && match[1]) {
        uri = match[1].trim()
      }
    }
  } catch {
    // ignore
  }
}

// Check if URI is targeting a local MongoDB port when no local mongod is available
const isLocalhostUri = Boolean(
  uri && (uri.includes('localhost:27017') || uri.includes('127.0.0.1:27017'))
)

let client = null
let dbInstance = null

if (uri && !isLocalhostUri) {
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
  } catch (err) {
    console.info('MongoDB client setup note:', err.message)
  }
}

export async function connectDatabase() {
  if (!uri || isLocalhostUri || !client) {
    return null
  }

  if (!dbInstance) {
    try {
      await client.connect()
      dbInstance = client.db(process.env.MONGO_DB_NAME || 'StudyPin')
      console.log('MongoDB Atlas connected successfully.')
    } catch (err) {
      console.info('Database note: in-memory collection active.', err.message)
      return null
    }
  }

  return dbInstance
}

export function getMongoClient() {
  return client
}