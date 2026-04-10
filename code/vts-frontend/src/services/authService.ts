import { apiClient } from '../api/apiClient'

export type UserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT'

export type UserStatus = 'active' | 'disabled'

export type AuthUser = {
  id?: string
  email: string
  name: string
  role: UserRole
  status?: UserStatus
}

export type AuthSession = {
  id?: string
  token: string
  role: UserRole
  name: string
  email: string
}

export type LoginInput = {
  email: string
  password: string
}

export interface IAuthService {
  login(email: string, password: string): Promise<AuthSession>
  logout(): void
  getCurrentUser(): AuthSession | null
}

const SESSION_STORAGE_KEY = 'vts-auth-session'

function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>

    if (
      typeof parsed.token === 'string' &&
      typeof parsed.role === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return {
        id: parsed.id,
        token: parsed.token,
        role: parsed.role as UserRole,
        name: parsed.name,
        email: parsed.email,
      }
    }

    return null
  } catch {
    return null
  }
}

class AuthService implements IAuthService {
  async login(email: string, password: string): Promise<AuthSession> {
    const session = await apiClient.post<Partial<AuthSession>>('/auth/login', { email, password })

    const normalizedSession: AuthSession = {
      id: session.id,
      token: session.token ?? '',
      role: (session.role ?? 'STUDENT') as UserRole,
      name: session.name ?? email,
      email: session.email ?? email,
    }

    saveSession(normalizedSession)
    return normalizedSession
  }

  logout(): void {
    void apiClient.post('/auth/logout').catch(() => null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  getCurrentUser(): AuthSession | null {
    return readSession()
  }
}

export const authService: IAuthService = new AuthService()
