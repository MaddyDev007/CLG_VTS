export type ApiError = {
  status: number
  message: string
  details?: unknown
}

const DEFAULT_BASE_URL = 'http://localhost:3000'
const SESSION_STORAGE_KEY = 'vts-auth-session'

function getBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL
}

function getAuthToken(): string | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { token?: string }
    return typeof parsed.token === 'string' ? parsed.token : null
  } catch {
    return null
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl()
  const token = getAuthToken()

  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await parseJson<{ message?: string; error?: string; statusCode?: number }>(response)
    const message = body?.message ?? body?.error ?? `Request failed with ${response.status}`
    const error: ApiError = { status: response.status, message, details: body }
    throw error
  }

  return parseJson<T>(response)
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
}
