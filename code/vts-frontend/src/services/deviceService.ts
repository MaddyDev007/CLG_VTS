import type { Device } from '../types/device'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege, getActiveCollegeFilterId } from '@utils/collegeScope'
import { invalidateDataSync } from '@store/dataSyncStore'

export type CreateDeviceInput = {
  collegeId?: string
  deviceId: string
  imei: string
  assignedVehicleId?: string
  assignedVehicleName?: string
}

export type UpdateDeviceInput = Partial<CreateDeviceInput>

export type DeviceServiceResponse = {
  success: true
  message: string
}

export type UpdateDeviceIntervalResponse =
  | {
      status: 'success'
      interval: number
      timestamp: string
    }
  | {
      status: 'timeout'
    }

function normalizeStatus(device: Omit<Device, 'status'> & { status?: Device['status'] }): Device {
  const isAssigned = Boolean(device.assignedVehicleName)

  return {
    ...device,
    status: isAssigned ? 'assigned' : 'unassigned',
  }
}

class DeviceService {
  async getDevices(): Promise<Device[]> {
    const devices = await apiClient.get<Device[]>(buildCollegeScopedPath('/devices'))
    return filterByActiveCollege(devices).map((device) => normalizeStatus(device))
  }

  async createDevice(deviceData: CreateDeviceInput): Promise<{ success: true; message: string; device: Device }> {
    const response = await apiClient.post<{ success: true; message: string; device: Device }>(
      buildCollegeScopedPath('/devices', { collegeId: deviceData.collegeId ?? getActiveCollegeFilterId() }),
      {
        deviceId: deviceData.deviceId,
        imei: deviceData.imei,
      },
    )

    invalidateDataSync(['devices', 'vehicles'])

    return response
  }

  async updateDevice(
    deviceRecordId: string,
    updatedData: UpdateDeviceInput,
  ): Promise<{ success: true; message: string; device: Device }> {
    const response = await apiClient.put<{ success: true; message: string; device: Device }>(
      `/devices/${deviceRecordId}`,
      updatedData,
    )

    invalidateDataSync(['devices', 'vehicles'])

    return response
  }

  async deleteDevice(deviceRecordId: string): Promise<DeviceServiceResponse> {
    const response = await apiClient.delete<DeviceServiceResponse>(`/devices/${deviceRecordId}`)
    invalidateDataSync(['devices', 'vehicles'])
    return response
  }

  async updateTelemetryInterval(deviceId: string, interval: number): Promise<UpdateDeviceIntervalResponse> {
    const response = await apiClient.post<UpdateDeviceIntervalResponse>(`/devices/${deviceId}/interval`, { interval })
    invalidateDataSync(['devices'])
    return response
  }

  async getUnassignedDevices(): Promise<Device[]> {
    const devices = await apiClient.get<Device[]>(buildCollegeScopedPath('/devices/unassigned'))
    return filterByActiveCollege(devices).map((device) => normalizeStatus(device))
  }

  async getDeviceByUid(deviceUid: string): Promise<Device | null> {
    const device = await apiClient.get<Device>(`/devices/by-uid/${deviceUid}`)
    return normalizeStatus(device)
  }

  async assignDeviceToVehicle(deviceUid: string, vehicleId: string, vehicleName: string): Promise<void> {
    await apiClient.post(`/devices/${deviceUid}/assign`, { vehicleId, vehicleName })
    invalidateDataSync(['devices', 'vehicles'])
  }

  async unassignDeviceFromVehicle(deviceUid: string): Promise<void> {
    await apiClient.post(`/devices/${deviceUid}/unassign`)
    invalidateDataSync(['devices', 'vehicles'])
  }
}

export const deviceService = new DeviceService()
