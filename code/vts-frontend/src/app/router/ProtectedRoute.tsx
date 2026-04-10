import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import type { UserRole } from '@services/authService'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.role)

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to='/dashboard' replace />
  }

  return children
}
