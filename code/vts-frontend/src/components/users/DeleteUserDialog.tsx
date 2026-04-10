type DeleteUserDialogProps = {
  isOpen: boolean
  userId: string | null
  onClose: () => void
  onDeleted?: () => Promise<void> | void
  onDelete: (userId: string) => Promise<void> | void
}

export function DeleteUserDialog({ isOpen, userId, onClose, onDeleted, onDelete }: DeleteUserDialogProps) {
  if (!isOpen || !userId) {
    return null
  }

  const handleDelete = async () => {
    await onDelete(userId)
    await onDeleted?.()
    onClose()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-md rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Delete User</h3>
        <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
          Are you sure you want to delete this user?
        </p>

        <div className='mt-5 flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleDelete}
            className='rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
