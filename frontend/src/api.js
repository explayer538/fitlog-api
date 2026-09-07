const TOKEN_KEY = 'fitlog_tokens'
const USER_KEY = 'fitlog_username'

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY))
  } catch {
    return null
  }
}

function saveTokens(tokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const firstField = Object.keys(data)[0]
  if (firstField) {
    const value = data[firstField]
    const message = Array.isArray(value) ? value[0] : value
    return `${firstField.replaceAll('_', ' ')}: ${message}`
  }

  return fallback
}

async function refreshAccessToken() {
  const tokens = readTokens()
  if (!tokens?.refresh) return null

  const response = await fetch('/api/auth/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })

  if (!response.ok) {
    clearSession()
    return null
  }

  const data = await response.json()
  const nextTokens = { ...tokens, access: data.access, refresh: data.refresh || tokens.refresh }
  saveTokens(nextTokens)
  return nextTokens.access
}

export async function apiFetch(path, options = {}, retry = true) {
  const tokens = readTokens()
  const headers = { ...(options.headers || {}) }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.auth !== false && tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`
  }

  const response = await fetch(`/api${path}`, { ...options, headers })

  if (response.status === 401 && retry && options.auth !== false) {
    const access = await refreshAccessToken()
    if (access) return apiFetch(path, options, false)
  }

  if (!response.ok) {
    let data = null
    try { data = await response.json() } catch { /* Response has no JSON body. */ }
    throw new ApiError(getErrorMessage(data, 'Something went wrong. Please try again.'), response.status, data)
  }

  if (response.status === 204) return null
  return response.json()
}

export async function signIn(username, password) {
  const tokens = await apiFetch('/auth/login/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, password }),
  })
  saveTokens(tokens)
  localStorage.setItem(USER_KEY, username)
  return username
}

export async function register({ username, email, password }) {
  await apiFetch('/auth/register/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, email, password }),
  })
  return signIn(username, password)
}

export function hasSession() {
  return Boolean(readTokens()?.access)
}

export function getUsername() {
  return localStorage.getItem(USER_KEY) || 'Athlete'
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
