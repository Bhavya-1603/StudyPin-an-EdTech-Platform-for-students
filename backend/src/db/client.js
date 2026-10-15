import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGO_URI

let client = null
let dbInstance = null

if (uri) {
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
  } catch (err) {
    console.warn('Failed to initialize MongoDB client:', err.message)
  }
}

export async function connectDatabase() {
  if (!uri || !client) {
    console.warn('MongoDB URI not configured; running with in-memory collection fallback.')
    return null
  }

  if (!dbInstance) {
    try {
      await client.connect()
      dbInstance = client.db(process.env.MONGO_DB_NAME || 'studypin')
    } catch (err) {
      console.warn('MongoDB connection failed; running with in-memory fallback:', err.message)
      return null
    }
  }

  return dbInstance
}

export function getMongoClient() {
  return client
}