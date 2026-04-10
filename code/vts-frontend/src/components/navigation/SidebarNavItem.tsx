import { NavLink } from 'react-router-dom'
import type { IconType } from 'react-icons'

type SidebarNavItemProps = {
  icon: IconType
  label: string
  route: string
  isActive?: boolean
  isCollapsed?: boolean
}

export function SidebarNavItem({ icon: Icon, label, route, isActive, isCollapsed }: SidebarNavItemProps) {
  return (
    <NavLink
      to={route}
      className={`group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-900 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#cbd5f5] dark:hover:bg-slate-800 dark:hover:text-white'
      } truncate ${isCollapsed ? 'justify-center' : 'justify-start'}`}
      title={label}
    >
      <Icon size={18} className='shrink-0 transition-transform duration-200 group-hover:scale-110' />
      <span className={`truncate ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
    </NavLink>
  )
}
