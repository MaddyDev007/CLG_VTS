import { ThemeToggle } from '@components/ui/ThemeToggle'

export function DashboardNav() {
  return (
    <nav className='sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-700 dark:bg-[#1e293b]/90'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6'>
        <div className='flex items-center gap-3'>
          <span className='h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-[#38bdf8]' />
          <span className='text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100'>
            VTS CONTROL
          </span>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  )
}
