import type { AppPage } from '@utils/permissions'

type SidebarItem = {
  label: string
  icon: string
  route: AppPage
}

type SidebarSection = {
  title: string
  items: SidebarItem[]
}

export const sidebarSections: SidebarSection[] = [
  {
    title: 'Dashboard',
    items: [
      {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
      },
    ],
  },
  {
    title: 'Fleet',
    items: [
      {
        label: 'Vehicles Status',
        icon: 'car',
        route: '/vehicles',
      },
      {
        label: 'Devices',
        icon: 'cpu',
        route: '/devices',
      },
      {
        label: 'Routes',
        icon: 'route',
        route: '/routes',
      },
      {
        label: 'Geofences',
        icon: 'map-pin',
        route: '/geofence',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Trip Monitoring',
        icon: 'arrow-right',
        route: '/trips',
      },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      {
        label: 'Live Map',
        icon: 'map',
        route: '/live-map',
      },
      {
        label: 'Telemetry',
        icon: 'activity',
        route: '/telemetry',
      },
      {
        label: 'Alerts',
        icon: 'bell',
        route: '/notifications',
      },
    ],
  },
  {
    title: 'Events',
    items: [
      {
        label: 'Overspeed',
        icon: 'zap',
        route: '/overspeed',
      },
      {
        label: 'Idling',
        icon: 'pause',
        route: '/idling',
      },
      {
        label: 'Stop',
        icon: 'square',
        route: '/stop',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        icon: 'users',
        route: '/users',
      },
    ],
  },
  {
    title: 'College Management',
    items: [
      {
        label: 'Colleges',
        icon: 'dashboard',
        route: '/admin/colleges',
      },
    ],
  },
]
