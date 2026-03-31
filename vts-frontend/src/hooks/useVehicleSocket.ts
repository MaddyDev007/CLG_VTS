import { useEffect, useRef } from 'react'
import { socketService, type VehicleSocketPayload } from '@services/socketService'

export function useVehicleSocket(onVehicleUpdate: (payload: VehicleSocketPayload) => void) {
  const handlerRef = useRef(onVehicleUpdate)

  useEffect(() => {
    handlerRef.current = onVehicleUpdate
  }, [onVehicleUpdate])

  useEffect(() => {
    const unsubscribe = socketService.subscribeToVehicleUpdates((payload) => {
      handlerRef.current(payload)
    })

    return unsubscribe
  }, [])
}
