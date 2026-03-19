require('dotenv').config()

const { loadAssignedDevices, POSTGRES_URL } = require('./db')
const { createMqttClient, MQTT_BROKER_URL } = require('./mqttClient')
const { DeviceManager } = require('./deviceManager')

const SIM_INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS || 5000)
const MODE = (process.env.MODE || 'random').toLowerCase()

async function start() {
  console.log(`[SIM] Loading devices from ${POSTGRES_URL}`)
  const devices = await loadAssignedDevices()

  if (!devices.length) {
    console.error('[SIM] No assigned devices found. Check the devices table.')
    process.exit(1)
  }

  console.log(`[SIM] Loaded ${devices.length} device(s).`)
  console.log(`[SIM] Connecting to MQTT: ${MQTT_BROKER_URL}`)

  const { client } = createMqttClient()

  client.on('connect', () => {
    console.log('[SIM] MQTT connected. Publishing telemetry...')
    const manager = new DeviceManager({
      mqttClient: client,
      intervalMs: SIM_INTERVAL_MS,
      mode: MODE,
    })

    manager.createSimulators(devices)
    manager.startAll()
  })

  client.on('reconnect', () => {
    console.log('[SIM] MQTT reconnecting...')
  })

  client.on('error', (err) => {
    console.error(`[SIM] MQTT error: ${err.message}`)
  })
}

start().catch((err) => {
  console.error(`[SIM] Startup failed: ${err.message}`)
  process.exit(1)
})
