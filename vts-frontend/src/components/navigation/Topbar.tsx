import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiChevronDown, FiMenu, FiUser } from 'react-icons/fi'
import { ThemeToggle } from '@components/ui/ThemeToggle'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'

type TopbarProps = {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const logout = useAuthStore((state) => state.logout)
  const unreadCount = useNotificationStore((state) => state.unreadCount)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className='flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-[#1e293b]'>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={onMenuClick}
          className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 md:hidden dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          aria-label='Open sidebar'
        >
          <FiMenu size={18} />
        </button>
        <div>
          <p className='text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600 dark:text-[#38bdf8]'>
            VTS
          </p>
          <h1 className='text-sm hidden md:block font-semibold text-slate-900 dark:text-slate-100'>
            Vehicle Tracking System
          </h1>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => navigate('/notifications')}
          className='relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:bg-[#1e293b] dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          aria-label='Notifications'
        >
          <FiBell size={18} />
          {unreadCount > 0 ? (
            <span className='absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500' />
          ) : null}
        </button>

        <ThemeToggle />

        <div className='relative' ref={menuRef}>
          <button
            type='button'
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className='inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-left transition hover:border-blue-600 dark:border-slate-600 dark:bg-[#1e293b] dark:hover:border-[#38bdf8]'
            aria-expanded={isMenuOpen}
            aria-haspopup='menu'
          >
            <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-[#38bdf8]'>
              <FiUser size={16} />
            </span>
            <span className='hidden sm:block'>
              <span className='block text-sm font-semibold text-slate-900 dark:text-slate-100'>
                {user?.name ?? 'Guest'}
              </span>
              <span className='block text-xs text-slate-500 dark:text-slate-300'>{role ?? 'NO_ROLE'}</span>
            </span>
            <FiChevronDown className='text-slate-500 dark:text-slate-300' size={16} />
          </button>

          {isMenuOpen ? (
            <div
              role='menu'
              className='absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-[#1e293b]'
            >
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  setIsMenuOpen(false)
                  navigate('/profile')
                }}
                className='w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
              >
                Profile
              </button>
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  setIsMenuOpen(false)
                  handleLogout()
                }}
                className='w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
