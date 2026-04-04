require('dotenv').config()

const { loadAssignedDevices, POSTGRES_URL } = require('./db')
const {
  createMqttClient,
  createTransportSender,
  DEFAULT_PROTOCOL,
  MQTT_BROKER_URL,
  TCP_HOST,
  TCP_PORT,
  UDP_HOST,
  UDP_PORT,
} = require('./transport')
const { DeviceManager } = require('./deviceManager')

const SIM_INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS || 5000)
const MODE = (process.env.MODE || 'random').toLowerCase()
const TRANSPORT_PROTOCOL = DEFAULT_PROTOCOL

function logTransportTarget() {
  if (TRANSPORT_PROTOCOL === 'mqtt') {
    console.log(`[SIM] Transport: MQTT -> ${MQTT_BROKER_URL}`)
    return
  }

  if (TRANSPORT_PROTOCOL === 'tcp') {
    console.log(`[SIM] Transport: TCP -> ${TCP_HOST}:${TCP_PORT}`)
    return
  }

  if (TRANSPORT_PROTOCOL === 'udp') {
    console.log(`[SIM] Transport: UDP -> ${UDP_HOST}:${UDP_PORT}`)
    return
  }
}

async function start() {
  console.log(`[SIM] Loading devices from ${POSTGRES_URL}`)
  const devices = await loadAssignedDevices()

  if (!devices.length) {
    console.error('[SIM] No assigned devices found. Check the devices table.')
    process.exit(1)
  }

  console.log(`[SIM] Loaded ${devices.length} device(s).`)
  logTransportTarget()

  const managerConfig = {
    intervalMs: SIM_INTERVAL_MS,
    mode: MODE,
  }

  if (TRANSPORT_PROTOCOL === 'mqtt') {
    const { client } = createMqttClient()

    client.on('connect', () => {
      console.log('[SIM] MQTT connected. Publishing telemetry...')
      const manager = new DeviceManager({
        transportSender: createTransportSender({
          protocol: TRANSPORT_PROTOCOL,
          mqttClient: client,
        }),
        ...managerConfig,
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

    return
  }

  const manager = new DeviceManager({
    transportSender: createTransportSender({
      protocol: TRANSPORT_PROTOCOL,
    }),
    ...managerConfig,
  })

  manager.createSimulators(devices)
  manager.startAll()
}

start().catch((err) => {
  console.error(`[SIM] Startup failed: ${err.message}`)
  process.exit(1)
})
