export const API_BASE = import.meta.env.VITE_API_BASE || ''

export function apiUrl(path) {
  return `${API_BASE}${path}`
}

/**
 * Perform authenticated API requests injecting the Bearer JWT token and handling session expiration
 */
export async function fetchWithAuth(path, options = {}) {
  const url = apiUrl(path)
  const token = localStorage.getItem('token')

  const headers = {
    ...(options.headers || {}),
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  }

  const response = await fetch(url, config)

  // If unauthorized, token is either expired or revoked
  if (response.status === 401) {
    // Only clear if on a protected route request
    if (path !== '/api/auth/login' && path !== '/api/auth/register') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  return response
}
