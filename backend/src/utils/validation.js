export function isValidEmail(email) {
  if (typeof email !== 'string') return false
  const normalized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(normalized)
}

export function isStrongPassword(password) {
  if (typeof password !== 'string') return false
  return /(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(password)
}

export function sanitizeString(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => sanitizeString(tag)).filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => sanitizeString(tag))
      .filter(Boolean)
  }

  return []
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
