import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGO_URI

if (!uri) {
  throw new Error('MONGO_URI is not configured')
}

const client = new MongoClient(uri)

let dbInstance = null

export async function connectDatabase() {
  if (!dbInstance) {
    await client.connect()
    dbInstance = client.db(process.env.MONGO_DB_NAME || 'studypin')
  }

  return dbInstance
}

export function getMongoClient() {
  return client
}