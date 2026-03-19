import type { UserProfile } from '../../types/profile'

type ProfileInfoCardProps = {
  profile: UserProfile
}

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Profile Details</h3>
        <p className='text-sm text-slate-600 dark:text-slate-300'>Your account information</p>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Name</span>
          <input
            value={profile.name}
            readOnly
            className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Email</span>
          <input
            value={profile.email}
            readOnly
            className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Role</span>
          <input
            value={profile.role}
            readOnly
            className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College</span>
          <input
            value={profile.collegeName ?? 'Not assigned'}
            readOnly
            className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
          />
        </label>
      </div>
    </section>
  )
}
