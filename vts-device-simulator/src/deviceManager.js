const { VehicleSimulator } = require('./vehicleSimulator')

class DeviceManager {
  constructor({ transportSender, intervalMs, mode }) {
    this.transportSender = transportSender
    this.intervalMs = intervalMs
    this.mode = mode
    this.simulators = []
  }

  createSimulators(devices) {
    this.simulators = devices.map((device) => {
      return new VehicleSimulator({
        deviceId: device.device_id,
        imei: device.imei,
        transportSender: this.transportSender,
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
