type PaginationProps = {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function Pagination({ page, limit, total, onPageChange, onLimitChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)

  const visiblePages = (() => {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + 4)
    const adjustedStart = Math.max(1, end - 4)
    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
  })()

  return (
    <footer className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-2'>
        <p className='text-xs text-slate-600 dark:text-slate-300'>
          Page {currentPage} of {totalPages}
        </p>
        <select
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className='rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-[#38bdf8]'
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Previous
        </button>

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type='button'
            onClick={() => onPageChange(pageNumber)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              pageNumber === currentPage
                ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
                : 'border border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type='button'
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Next
        </button>
      </div>
    </footer>
  )
}
