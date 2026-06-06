import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.OPENAI_API_KEY
const client = apiKey ? new OpenAI({ apiKey }) : null

export function isOpenAIConfigured() {
  return Boolean(client)
}

export async function createEmbedding(text) {
  if (!client) return null

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data?.[0]?.embedding ?? null
}
