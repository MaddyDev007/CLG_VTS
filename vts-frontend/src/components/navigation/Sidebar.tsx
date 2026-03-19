import { sidebarSections } from '@config/sidebarConfig'
import { SidebarSection } from './SidebarSection'
import { useAuthStore } from '@store/authStore'
import { iconMap } from '@utils/iconMap'
import { useLocation } from 'react-router-dom'
import { FiMenu } from 'react-icons/fi'

type SidebarProps = {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const role = useAuthStore((state) => state.role)
  const location = useLocation()

  return (
    <aside
      className={`h-full border-r border-slate-200 bg-white text-slate-700 transition-all duration-300 dark:border-slate-800 dark:bg-[#0f172a] dark:text-[#cbd5f5] ${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
    >
      <div className='flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700 dark:bg-[#1e293b] dark:border-slate-800'>
        <div className={isCollapsed ? 'hidden' : 'block'}>
          <p className='text-xs font-extrabold uppercase tracking-[0.24em] text-blue-600 dark:text-[#60a5fa]'>
            FleetOps
          </p>
          {/* <p className='text-sm font-semibold text-slate-900 dark:text-white'>Navigation</p> */}
          <p className='mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400'>
            {role ? role.replace(/_/g, ' ') : 'ROLE'}
          </p>
        </div>
        <button
          type='button'
          onClick={onToggle}
          className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-white'
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiMenu size={16} />
        </button>
      </div>

      <nav className={`h-[calc(100%-4rem)] overflow-y-auto py-4 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <div className='space-y-6 '>
          {sidebarSections.map((section) => (
            <SidebarSection
              key={section.title}
              title={section.title}
              isCollapsed={isCollapsed}
              items={section.items.map((item) => ({
                label: item.label,
                route: item.route,
                icon: iconMap[item.icon] ?? iconMap.dashboard,
                isActive: location.pathname === item.route,
              }))}
            />
          ))}
        </div>
      </nav>
    </aside>
  )
}
