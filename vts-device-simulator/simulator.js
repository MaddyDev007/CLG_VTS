const mqtt = require('mqtt')

const MQTT_URL = process.env.SIM_MQTT_URL || 'mqtt://localhost:1883'
const INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS || 5000)
const BASE_LAT = Number(process.env.SIM_BASE_LAT || 11.2588)
const BASE_LON = Number(process.env.SIM_BASE_LON || 75.7804)
const DEVICE_IDS = (process.env.SIM_DEVICE_IDS || 'VTU_001,VTU_002,VTU_003')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function buildPayload(deviceId, index) {
  const jitter = 0.0025
  const lat = BASE_LAT + index * 0.0008 + randomBetween(-jitter, jitter)
  const lon = BASE_LON + index * 0.0008 + randomBetween(-jitter, jitter)
  const speed = Math.max(0, Math.round(randomBetween(0, 75)))
  const ignition = speed > 0

  return {
    device_id: deviceId,
    timestamp: new Date().toISOString(),
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    speed_kmph: speed,
    heading: Math.round(randomBetween(0, 359)),
    battery_mv: Math.round(randomBetween(3600, 4300)),
    signal_dbm: Math.round(randomBetween(-95, -60)),
    ignition,
  }
}

function startPublishing(client) {
  DEVICE_IDS.forEach((deviceId, index) => {
    const topic = `vts/${deviceId}/telemetry`

    const publishOnce = () => {
      const payload = buildPayload(deviceId, index)
      client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
        if (err) {
          console.error(`[SIM] ${deviceId} publish failed: ${err.message}`)
          return
        }
        console.log(`[SIM] ${deviceId} -> ${payload.lat}, ${payload.lon}, speed=${payload.speed_kmph}`)
      })
    }

    publishOnce()
    setInterval(publishOnce, INTERVAL_MS)
  })
}

function start() {
  if (DEVICE_IDS.length === 0) {
    console.error('No devices configured. Set SIM_DEVICE_IDS env var.')
    process.exit(1)
  }

  console.log(`Connecting to MQTT: ${MQTT_URL}`)
  const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 2000 })

  client.on('connect', () => {
    console.log('MQTT connected. Publishing telemetry...')
    startPublishing(client)
  })

  client.on('reconnect', () => {
    console.log('MQTT reconnecting...')
  })

  client.on('error', (err) => {
    console.error(`MQTT error: ${err.message}`)
  })
}

start()
