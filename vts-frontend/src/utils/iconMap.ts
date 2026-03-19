import {
  FiActivity,
  FiArrowRight,
  FiBell,
  FiCpu,
  FiGrid,
  FiMap,
  FiMapPin,
  FiPause,
  FiSquare,
  FiTruck,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import type { IconType } from 'react-icons'

export const iconMap: Record<string, IconType> = {
  dashboard: FiGrid,
  car: FiTruck,
  route: FiMap,
  'map-pin': FiMapPin,
  'arrow-right': FiArrowRight,
  map: FiMap,
  activity: FiActivity,
  bell: FiBell,
  zap: FiZap,
  pause: FiPause,
  square: FiSquare,
  users: FiUsers,
  cpu: FiCpu,
}
