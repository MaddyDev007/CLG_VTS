import type { IconType } from 'react-icons'
import { SidebarNavItem } from './SidebarNavItem'

type SidebarSectionItem = {
  label: string
  route: string
  icon: IconType
  isActive?: boolean
}

type SidebarSectionProps = {
  title: string
  items: SidebarSectionItem[]
  isCollapsed?: boolean
}

export function SidebarSection({ title, items, isCollapsed }: SidebarSectionProps) {
  return (
    <section className='mt-6 space-y-2'>
      {!isCollapsed ? (
        <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500'>
          {title}
        </p>
      ) : null}
      <div className='space-y-1'>
        {items.map((item) => (
          <SidebarNavItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            route={item.route}
            isActive={item.isActive}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </section>
  )
}
