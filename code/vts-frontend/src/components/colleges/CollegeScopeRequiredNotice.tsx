type CollegeScopeRequiredNoticeProps = {
  title?: string
  description?: string
}

export function CollegeScopeRequiredNotice({
  title = 'Please select a college to view data',
  description = 'Choose a college from the top bar to load tenant-scoped users, vehicles, devices, routes, and operational dashboards.',
}: CollegeScopeRequiredNoticeProps) {
  return (
    <div className='mx-auto w-full max-w-7xl'>
      <section className='rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300'>
        <h2 className='text-base font-semibold text-slate-900 dark:text-slate-100'>{title}</h2>
        <p className='mt-2 max-w-2xl'>{description}</p>
      </section>
    </div>
  )
}
