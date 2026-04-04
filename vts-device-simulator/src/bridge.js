require('dotenv').config()

const cors = require('cors')
const express = require('express')
const { loadAssignedDevices } = require('./db')
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

const BRIDGE_PORT = Number(process.env.SIM_BRIDGE_PORT || 3011)

function createBridgeServer() {
  const app = express()
  const { client } = createMqttClient()
  const mqttTransportSender = createTransportSender({
    protocol: 'mqtt',
    mqttClient: client,
  })

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_request, response) => {
    response.json({
      ok: true,
      defaultProtocol: DEFAULT_PROTOCOL,
      transports: {
        mqtt: {
          brokerUrl: MQTT_BROKER_URL,
          connected: client.connected,
        },
        tcp: {
          host: TCP_HOST,
          port: TCP_PORT,
        },
        udp: {
          host: UDP_HOST,
          port: UDP_PORT,
        },
      },
    })
  })

  app.get('/devices', async (_request, response) => {
    try {
      const devices = await loadAssignedDevices()
      response.json(devices)
    } catch (error) {
      response.status(500).json({ message: error.message || 'Failed to load devices' })
    }
  })

  app.post('/publish', async (request, response) => {
    const { protocol = DEFAULT_PROTOCOL, topic, host, port, payload } = request.body || {}

    if (!payload) {
      response.status(400).json({ message: 'payload is required' })
      return
    }

    try {
      const sender =
        protocol === 'mqtt'
          ? mqttTransportSender
          : createTransportSender({ protocol })

      const result = await sender.send({ payload, topic, host, port })
      response.json({ success: true, ...result })
    } catch (error) {
      const message = error.message || 'Publish failed'
      if (protocol === 'mqtt' && !client.connected) {
        response.status(503).json({ message })
        return
      }
      response.status(500).json({ message })
    }
  })

  client.on('connect', () => {
    console.log(`[SIM-BRIDGE] MQTT connected: ${MQTT_BROKER_URL}`)
  })

  client.on('reconnect', () => {
    console.log('[SIM-BRIDGE] MQTT reconnecting...')
  })

  client.on('error', (error) => {
    console.error(`[SIM-BRIDGE] MQTT error: ${error.message}`)
  })

  app.listen(BRIDGE_PORT, () => {
    console.log(`[SIM-BRIDGE] listening on http://localhost:${BRIDGE_PORT}`)
  })
}

createBridgeServer()
