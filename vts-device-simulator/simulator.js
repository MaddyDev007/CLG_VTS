const {
  createMqttClient,
  createTransportSender,
  DEFAULT_PROTOCOL,
  MQTT_BROKER_URL,
  TCP_HOST,
  TCP_PORT,
  UDP_HOST,
  UDP_PORT,
} = require('./src/transport')

const INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS || 5000)
const BASE_LAT = Number(process.env.SIM_BASE_LAT || 11.2588)
const BASE_LON = Number(process.env.SIM_BASE_LON || 75.7804)
const TRANSPORT_PROTOCOL = DEFAULT_PROTOCOL
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

function logTransportTarget() {
  if (TRANSPORT_PROTOCOL === 'mqtt') {
    console.log(`Transport: MQTT -> ${MQTT_BROKER_URL}`)
    return
  }

  if (TRANSPORT_PROTOCOL === 'tcp') {
    console.log(`Transport: TCP -> ${TCP_HOST}:${TCP_PORT}`)
    return
  }

  if (TRANSPORT_PROTOCOL === 'udp') {
    console.log(`Transport: UDP -> ${UDP_HOST}:${UDP_PORT}`)
  }
}

function startPublishing(sender) {
  DEVICE_IDS.forEach((deviceId, index) => {
    const topic = `vts/devices/${deviceId}/telemetry`

    const publishOnce = () => {
      const payload = buildPayload(deviceId, index)
      sender
        .send({ payload, topic })
        .then((result) => {
          const destination =
            result.protocol === 'mqtt'
              ? result.topic
              : `${result.host}:${result.port}`
          console.log(
            `[SIM] ${deviceId} ${result.protocol.toUpperCase()} -> ${destination} ${payload.lat}, ${payload.lon}, speed=${payload.speed_kmph}`
          )
        })
        .catch((err) => {
          console.error(`[SIM] ${deviceId} publish failed: ${err.message}`)
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

  logTransportTarget()

  if (TRANSPORT_PROTOCOL === 'mqtt') {
    const { client } = createMqttClient()

    client.on('connect', () => {
      console.log('MQTT connected. Publishing telemetry...')
      startPublishing(
        createTransportSender({
          protocol: TRANSPORT_PROTOCOL,
          mqttClient: client,
        })
      )
    })

    client.on('reconnect', () => {
      console.log('MQTT reconnecting...')
    })

    client.on('error', (err) => {
      console.error(`MQTT error: ${err.message}`)
    })

    return
  }

  startPublishing(
    createTransportSender({
      protocol: TRANSPORT_PROTOCOL,
    })
  )
}

start()
