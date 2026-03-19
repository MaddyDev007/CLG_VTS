const DEFAULT_ROUTE = [
  { lat: 8.7139, lon: 77.7567 },
  { lat: 8.7146, lon: 77.7574 },
  { lat: 8.7154, lon: 77.7581 },
  { lat: 8.7162, lon: 77.7586 },
  { lat: 8.7171, lon: 77.7592 },
  { lat: 8.718, lon: 77.7599 },
]

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function computeHeading(from, to) {
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const dLon = ((to.lon - from.lon) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const heading = (Math.atan2(y, x) * 180) / Math.PI
  return (heading + 360) % 360
}

class VehicleSimulator {
  constructor({ deviceId, imei, mqttClient, intervalMs, mode, route }) {
    this.deviceId = deviceId
    this.imei = imei
    this.mqttClient = mqttClient
    this.intervalMs = intervalMs
    this.mode = mode
    this.route = route && route.length ? route : DEFAULT_ROUTE
    this.routeIndex = Math.floor(randomBetween(0, this.route.length))
    this.timer = null

    const base = this.route[this.routeIndex] || DEFAULT_ROUTE[0]
    const jitter = 0.002
    this.state = {
      lat: base.lat + randomBetween(-jitter, jitter),
      lon: base.lon + randomBetween(-jitter, jitter),
      speed: randomBetween(10, 40),
      heading: Math.round(randomBetween(0, 360)),
    }
  }

  start() {
    this.publishOnce()
    this.timer = setInterval(() => this.publishOnce(), this.intervalMs)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  publishOnce() {
    this.updateMovement()
    const payload = this.buildPayload()
    const topic = `vts/devices/${this.deviceId}/telemetry`

    this.mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
      if (err) {
        console.error(`[SIM] ${this.deviceId} publish failed: ${err.message}`)
        return
      }

      console.log(
        `[SIM] ${this.deviceId} -> lat:${payload.lat} lon:${payload.lon} speed:${payload.speed_kmph}`
      )
    })
  }

  updateMovement() {
    const speedDelta = randomBetween(-3, 5)
    this.state.speed = clamp(this.state.speed + speedDelta, 0, 80)

    if (this.mode === 'route' && this.route.length) {
      const previous = { lat: this.state.lat, lon: this.state.lon }
      const next = this.route[this.routeIndex]
      const jitter = 0.00005

      this.state.lat = next.lat + randomBetween(-jitter, jitter)
      this.state.lon = next.lon + randomBetween(-jitter, jitter)
      this.state.heading = computeHeading(previous, this.state)
      this.routeIndex = (this.routeIndex + 1) % this.route.length
      return
    }

    this.state.lat += randomBetween(-0.0004, 0.0004)
    this.state.lon += randomBetween(-0.0004, 0.0004)
    this.state.heading = Math.round(randomBetween(0, 360))
  }

  buildPayload() {
    return {
      device_id: this.deviceId,
      timestamp: new Date().toISOString(),
      lat: Number(this.state.lat.toFixed(6)),
      lon: Number(this.state.lon.toFixed(6)),
      speed_kmph: Math.round(this.state.speed),
      heading: Math.round(this.state.heading),
      battery_mv: Math.round(randomBetween(3600, 4200)),
      signal_dbm: Math.round(randomBetween(-95, -60)),
    }
  }
}

module.exports = {
  VehicleSimulator,
  DEFAULT_ROUTE,
}
