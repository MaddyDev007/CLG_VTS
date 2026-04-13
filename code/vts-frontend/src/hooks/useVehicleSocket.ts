import { useEffect, useRef } from 'react'
import type { VehicleSocketPayload } from '@services/socketService'
import { useRealtimeStore } from '@store/realtimeStore'

export function useVehicleSocket(onVehicleUpdate: (payload: VehicleSocketPayload) => void) {
  const vehicleUpdateVersion = useRealtimeStore((state) => state.vehicleUpdateVersion)
  const latestPayload = useRealtimeStore((state) => state.lastVehicleUpdate)
  const handlerRef = useRef(onVehicleUpdate)

  useEffect(() => {
    handlerRef.current = onVehicleUpdate
  }, [onVehicleUpdate])

  useEffect(() => {
    if (!latestPayload) {
      return
    }

    handlerRef.current(latestPayload)
  }, [latestPayload, vehicleUpdateVersion])
}
