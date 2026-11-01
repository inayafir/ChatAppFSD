import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Pulls a friendly message out of any axios/server error.
 * Handles: our JSON error body, a JSON string that failed to parse,
 * plain text bodies, and network failures.
 */
export function extractErrorMessage(error) {
  const data = error?.response?.data

  if (data && typeof data === 'object' && data.message) {
    return data.message
  }
  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed.message) return parsed.message
      } catch {
        // fall through to plain-text handling
      }
    }
    if (trimmed) return trimmed.split('\n')[0].slice(0, 200)
  }
  if (error?.request && !error?.response) {
    return 'Cannot reach the server. Is the backend running?'
  }
  return error?.message || 'Something went wrong'
}

export default client
