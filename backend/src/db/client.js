import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGO_URI || ''
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

export async function connectDatabase() {
  if (!uri) {
    throw new Error('MONGO_URI is not configured')
  }

  await client.connect()
  return client.db(process.env.MONGO_DB_NAME || 'studypin')
}

export function getMongoClient() {
  return client
}
