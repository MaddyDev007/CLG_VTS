import { RouterProvider } from 'react-router-dom'
import { NotificationContainer } from '@components/notifications/NotificationContainer'
import { AppProviders } from './app/providers/AppProviders'
import { appRouter } from './app/router/appRouter'

function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} />
      <NotificationContainer />
    </AppProviders>
  )
}

export default App
