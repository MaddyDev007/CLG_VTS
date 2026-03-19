require('dotenv').config()

const cors = require('cors')
const express = require('express')
const { loadAssignedDevices } = require('./db')
const { createMqttClient, MQTT_BROKER_URL } = require('./mqttClient')

const BRIDGE_PORT = Number(process.env.SIM_BRIDGE_PORT || 3011)

function createBridgeServer() {
  const app = express()
  const { client } = createMqttClient()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_request, response) => {
    response.json({
      ok: true,
      mqttBrokerUrl: MQTT_BROKER_URL,
      mqttConnected: client.connected,
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
    const { topic, payload } = request.body || {}

    if (!topic || !payload) {
      response.status(400).json({ message: 'topic and payload are required' })
      return
    }

    if (!client.connected) {
      response.status(503).json({ message: `MQTT broker not connected at ${MQTT_BROKER_URL}` })
      return
    }

    client.publish(topic, JSON.stringify(payload), { qos: 0 }, (error) => {
      if (error) {
        response.status(500).json({ message: error.message })
        return
      }

      response.json({ success: true })
    })
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
