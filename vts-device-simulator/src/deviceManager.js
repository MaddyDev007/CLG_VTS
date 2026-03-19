const { VehicleSimulator } = require('./vehicleSimulator')

class DeviceManager {
  constructor({ mqttClient, intervalMs, mode }) {
    this.mqttClient = mqttClient
    this.intervalMs = intervalMs
    this.mode = mode
    this.simulators = []
  }

  createSimulators(devices) {
    this.simulators = devices.map((device) => {
      return new VehicleSimulator({
        deviceId: device.device_id,
        imei: device.imei,
        mqttClient: this.mqttClient,
        intervalMs: this.intervalMs,
        mode: this.mode,
      })
    })

    return this.simulators
  }

  startAll() {
    this.simulators.forEach((simulator) => simulator.start())
  }

  stopAll() {
    this.simulators.forEach((simulator) => simulator.stop())
  }
}

module.exports = {
  DeviceManager,
}
