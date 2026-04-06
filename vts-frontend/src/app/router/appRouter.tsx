import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@components/layout/DashboardLayout'
import { DashboardPage } from '@pages/dashboard/DashboardPage'
import { DevicesPage } from '@pages/dashboard/DevicesPage'
import { CollegeDetailsPage } from '@pages/dashboard/CollegeDetailsPage'
import { CollegesPage } from '@pages/dashboard/CollegesPage'
import { GeofencePage } from '@pages/dashboard/GeofencePage'
import { HistoryPage } from '@pages/dashboard/HistoryPage'
import { IdlingDetailPage } from '@pages/dashboard/IdlingDetailPage'
import { IdlingPage } from '@pages/dashboard/IdlingPage'
import { LiveMapPage } from '@pages/dashboard/LiveMapPage'
import { NotificationsPage } from '@pages/dashboard/NotificationsPage'
import { OverspeedDetailPage } from '@pages/dashboard/OverspeedDetailPage'
import { OverspeedPage } from '@pages/dashboard/OverspeedPage'
import { ProfilePage } from '@pages/dashboard/ProfilePage'
import { StopDetailPage } from '@pages/dashboard/StopDetailPage'
import { StopPage } from '@pages/dashboard/StopPage'
import { TelemetryDataPage } from '@pages/dashboard/TelemetryDataPage'
import { TripDetailPage } from '@pages/dashboard/TripDetailPage'
import { TripsPage } from '@pages/dashboard/TripsPage'
import { RoutesPage } from '@pages/dashboard/RoutesPage'
import { RouteDetailPage } from '@pages/dashboard/RouteDetailPage'
import { VehicleHistoryDetailPage } from '@pages/dashboard/VehicleHistoryDetailPage'
import { VehicleDetailPage } from '@pages/dashboard/VehicleDetailPage'
import { VehiclesPage } from '@pages/dashboard/VehiclesPage'
import { UsersPage } from '@pages/dashboard/UsersPage'
import { LoginPage } from '@pages/auth/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'

function ProtectedDashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to='/login' replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <ProtectedDashboardLayout />,
    children: [
      {
        path: 'live-map',
        element: <LiveMapPage />,
      },
      {
        path: 'vehicles',
        element: <VehiclesPage />,
      },
      {
        path: 'vehicles/:vehicleId',
        element: <VehicleDetailPage />,
      },
      {
        path: 'devices',
        element: <DevicesPage />,
      },
      {
        path: 'geofence',
        element: <GeofencePage />,
      },
      {
        path: 'trips',
        element: <TripsPage />,
      },
      {
        path: 'trips/:tripId',
        element: <TripDetailPage />,
      },
      {
        path: 'routes',
        element: <RoutesPage />,
      },
      {
        path: 'routes/:routeId',
        element: <RouteDetailPage />,
      },
      {
        path: 'telemetry-data',
        element: <TelemetryDataPage />,
      },
      {
        path: 'telemetry',
        element: <TelemetryDataPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'history/:vehicleId',
        element: <VehicleHistoryDetailPage />,
      },
      {
        path: 'overspeed',
        element: <OverspeedPage />,
      },
      {
        path: 'overspeed/:eventId',
        element: <OverspeedDetailPage />,
      },
      {
        path: 'idling',
        element: <IdlingPage />,
      },
      {
        path: 'idling/:eventId',
        element: <IdlingDetailPage />,
      },
      {
        path: 'stop',
        element: <StopPage />,
      },
      {
        path: 'stop/:eventId',
        element: <StopDetailPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'admin/colleges',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <CollegesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/colleges/:id',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <CollegeDetailsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to='/login' replace />,
  },
])
