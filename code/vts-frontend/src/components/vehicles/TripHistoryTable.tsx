import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vehicleService } from '@services/vehicleService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { formatDistance } from '@utils/tripFormat'
import type { Trip } from '../../types/vehicle'

type TripHistoryTableProps = {
  vehicleId: string
  pageSize?: number
}

export function TripHistoryTable({ vehicleId, pageSize = 5 }: TripHistoryTableProps) {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const syncVersion = useScopedDataSyncVersion(['trips'])

  useEffect(() => {
    const loadTrips = async () => {
      setIsLoading(true)
      const nextTrips = await vehicleService.getVehicleTrips(vehicleId)
      setTrips(nextTrips)
      setCurrentPage(1)
      setIsLoading(false)
    }

    void loadTrips()
  }, [vehicleId, syncVersion])

  const totalPages = useMemo(() => {
    if (!trips.length) {
      return 1
    }

    return Math.ceil(trips.length / pageSize)
  }, [pageSize, trips.length])

  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return trips.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, trips])

  const previousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  const nextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <header className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Trip History</h3>
        <p className='text-xs text-slate-600 dark:text-slate-300'>Vehicle: {vehicleId}</p>
      </header>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[720px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>Trip ID</th>
              <th className='px-3 py-2 font-semibold'>Start Time</th>
              <th className='px-3 py-2 font-semibold'>End Time</th>
              <th className='px-3 py-2 font-semibold'>Distance</th>
              <th className='px-3 py-2 font-semibold'>Max Speed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-3 py-4 text-slate-600 dark:text-slate-300'>
                  Loading trips...
                </td>
              </tr>
            ) : paginatedTrips.length ? (
              paginatedTrips.map((trip) => (
                <tr
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`, { state: { trip } })}
                  className='cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{trip.id}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(trip.startTime).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(trip.endTime).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {formatDistance(trip.distance)}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{trip.maxSpeed} km/h</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className='px-3 py-4 text-slate-600 dark:text-slate-300'>
                  No trips available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className='mt-4 flex items-center justify-between'>
        <p className='text-xs text-slate-600 dark:text-slate-300'>
          Page {currentPage} of {totalPages}
        </p>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={previousPage}
            disabled={currentPage === 1}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Previous
          </button>
          <button
            type='button'
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  )
}
