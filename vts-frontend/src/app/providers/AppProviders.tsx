import { useEffect, type PropsWithChildren } from 'react'
import { useAuthStore } from '@store/authStore'
import { ThemeProvider } from './ThemeProvider'

export function AppProviders({ children }: PropsWithChildren) {
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  return <ThemeProvider>{children}</ThemeProvider>
}
