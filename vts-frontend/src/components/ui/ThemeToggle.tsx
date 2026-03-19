import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '@hooks/useTheme'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type='button'
      onClick={toggleTheme}
      className='inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:bg-[#1e293b] dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
      aria-label='Toggle theme'
    >
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      <span className='hidden md:block'>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
