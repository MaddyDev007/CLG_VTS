import { create } from 'zustand'
import type { VehicleSocketPayload } from '@services/socketService'

type RealtimeStore = {
  lastVehicleUpdate: VehicleSocketPayload | null
  latestVehicleUpdates: Record<string, VehicleSocketPayload>
  vehicleUpdateVersion: number
  receiveVehicleUpdate: (payload: VehicleSocketPayload) => void
  clearVehicleUpdates: () => void
}

export const useRealtimeStore = create<RealtimeStore>()((set) => ({
  lastVehicleUpdate: null,
  latestVehicleUpdates: {},
  vehicleUpdateVersion: 0,
  receiveVehicleUpdate: (payload) =>
    set((state) => ({
      lastVehicleUpdate: payload,
      latestVehicleUpdates: {
        ...state.latestVehicleUpdates,
        [payload.vehicleId]: payload,
      },
      vehicleUpdateVersion: state.vehicleUpdateVersion + 1,
    })),
  clearVehicleUpdates: () =>
    set({
      lastVehicleUpdate: null,
      latestVehicleUpdates: {},
      vehicleUpdateVersion: 0,
    }),
}))
