import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CollegeScopeRequiredNotice } from '@components/colleges/CollegeScopeRequiredNotice'
import { Sidebar } from '@components/navigation/Sidebar'
import { Topbar } from '@components/navigation/Topbar'
import { useNotificationListener } from '@hooks/useNotificationListener'
import { useAuthStore } from '@store/authStore'
import { useCollegeFilterStore } from '@store/collegeFilterStore'

export function DashboardLayout({ children }: PropsWithChildren) {
  useNotificationListener()
  const location = useLocation()
  const role = useAuthStore((state) => state.role)
  const selectedCollegeId = useCollegeFilterStore((state) => state.selectedCollegeId)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const isGlobalAdminRoute = location.pathname.startsWith('/admin/colleges') || location.pathname === '/profile'
  const shouldRequireCollegeSelection = role === 'SUPER_ADMIN' && !selectedCollegeId && !isGlobalAdminRoute

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden bg-gray-50 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 md:grid md:grid-rows-[auto_1fr] ${
        isSidebarCollapsed ? 'md:grid-cols-[80px_1fr]' : 'md:grid-cols-[260px_1fr]'
      }`}
    >
      <div className='hidden md:block md:row-span-2'>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />

      <main className='overflow-y-auto p-5'>
        {shouldRequireCollegeSelection ? <CollegeScopeRequiredNotice /> : <div key={selectedCollegeId ?? 'global-scope'}>{children}</div>}
      </main>

      {isMobileSidebarOpen ? (
        <>
          <div
            className='fixed inset-0 z-30 bg-black/40 md:hidden'
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden='true'
          />
          <div className='fixed inset-y-0 left-0 z-40 w-[260px] md:hidden'>
            <Sidebar
              isCollapsed={false}
              onToggle={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
