import type { Device } from '../types/device'
import { apiClient } from '../api/apiClient'

export type CreateDeviceInput = {
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

function normalizeStatus(device: Omit<Device, 'status'> & { status?: Device['status'] }): Device {
  const isAssigned = Boolean(device.assignedVehicleName)

  return {
    ...device,
    status: isAssigned ? 'assigned' : 'unassigned',
  }
}

class DeviceService {
  async getDevices(): Promise<Device[]> {
    const devices = await apiClient.get<Device[]>('/devices')
    return devices.map((device) => normalizeStatus(device))
  }

  async createDevice(deviceData: CreateDeviceInput): Promise<{ success: true; message: string; device: Device }> {
    return apiClient.post<{ success: true; message: string; device: Device }>('/devices', {
      deviceId: deviceData.deviceId,
      imei: deviceData.imei,
    })
  }

  async updateDevice(
    deviceRecordId: string,
    updatedData: UpdateDeviceInput,
  ): Promise<{ success: true; message: string; device: Device }> {
    return apiClient.put<{ success: true; message: string; device: Device }>(
      `/devices/${deviceRecordId}`,
      updatedData,
    )
  }

  async deleteDevice(deviceRecordId: string): Promise<DeviceServiceResponse> {
    return apiClient.delete<DeviceServiceResponse>(`/devices/${deviceRecordId}`)
  }

  async getUnassignedDevices(): Promise<Device[]> {
    const devices = await apiClient.get<Device[]>('/devices/unassigned')
    return devices.map((device) => normalizeStatus(device))
  }

  async getDeviceByUid(deviceUid: string): Promise<Device | null> {
    const device = await apiClient.get<Device>(`/devices/by-uid/${deviceUid}`)
    return normalizeStatus(device)
  }

  async assignDeviceToVehicle(deviceUid: string, vehicleId: string, vehicleName: string): Promise<void> {
    await apiClient.post(`/devices/${deviceUid}/assign`, { vehicleId, vehicleName })
  }

  async unassignDeviceFromVehicle(deviceUid: string): Promise<void> {
    await apiClient.post(`/devices/${deviceUid}/unassign`)
  }
}

export const deviceService = new DeviceService()
