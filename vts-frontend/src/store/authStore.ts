import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, type UserRole } from '@services/authService'

type AuthStoreState = {
  user: { id?: string; name: string; email: string } | null
  token: string | null
  role: UserRole | null
  isAuthenticated: boolean
}

type AuthStoreActions = {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  restoreSession: () => void
}

type AuthStore = AuthStoreState & AuthStoreActions

const initialState: AuthStoreState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      login: async (email, password) => {
        const session = await authService.login(email, password)

        set({
          user: { id: session.id, name: session.name, email: session.email },
          token: session.token,
          role: session.role,
          isAuthenticated: true,
        })
      },
      logout: () => {
        authService.logout()
        set({ ...initialState })
      },
      restoreSession: () => {
        const session = authService.getCurrentUser()

        if (!session) {
          set({ ...initialState })
          return
        }

        set({
          user: { id: session.id, name: session.name, email: session.email },
          token: session.token,
          role: session.role,
          isAuthenticated: true,
        })
      },
    }),
    {
      name: 'vts-auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
