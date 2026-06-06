import { Client } from '@elastic/elasticsearch'
import dotenv from 'dotenv'

dotenv.config()

const node = process.env.ELASTICSEARCH_NODE
const username = process.env.ELASTICSEARCH_USERNAME
const password = process.env.ELASTICSEARCH_PASSWORD

const client = node
  ? new Client({
      node,
      auth: username && password ? { username, password } : undefined,
    })
  : null

const indexName = 'studypin_notes'
const vectorDimensions = 1536

export function isElasticsearchConfigured() {
  return Boolean(client)
}

export async function ensureNoteIndex() {
  if (!client) return false

  const { body: exists } = await client.indices.exists({ index: indexName })
  if (!exists) {
    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            description: { type: 'text' },
            content: { type: 'text' },
            subject: { type: 'keyword' },
            tags: { type: 'keyword' },
            embedding: { type: 'dense_vector', dims: vectorDimensions },
          },
        },
      },
    })
  }

  return true
}

export async function indexNote(note) {
  if (!client) return null

  const doc = {
    title: note.title,
    description: note.description,
    content: `${note.title} ${note.description} ${note.subject} ${(note.tags || []).join(' ')}`,
    subject: note.subject,
    tags: note.tags || [],
    createdAt: note.createdAt || note.uploaded_at || new Date().toISOString(),
    ...(note.embedding ? { embedding: note.embedding } : {}),
  }

  const response = await client.index({
    index: indexName,
    id: note.id,
    document: doc,
    refresh: 'wait',
  })

  return response
}

export async function searchNotes(query, embedding = null) {
  if (!client) return null

  const baseQuery = {
    bool: {
      should: [
        {
          multi_match: {
            query,
            fields: ['title^3', 'description^2', 'content', 'subject^2', 'tags'],
            fuzziness: 'AUTO',
          },
        },
      ],
    },
  }

  if (embedding) {
    return client.search({
      index: indexName,
      size: 12,
      body: {
        query: {
          script_score: {
            query: baseQuery,
            script: {
              source: "cosineSimilarity(params.queryVector, 'embedding') + 1.0",
              params: {
                queryVector: embedding,
              },
            },
          },
        },
      },
    })
  }

  return client.search({
    index: indexName,
    size: 12,
    body: {
      query: baseQuery,
    },
  })
}
