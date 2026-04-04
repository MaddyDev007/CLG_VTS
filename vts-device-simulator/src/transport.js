const dgram = require('dgram')
const mqtt = require('mqtt')
const net = require('net')

const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL ||
  process.env.SIM_MQTT_URL ||
  'mqtt://localhost:1883'

const TCP_HOST = process.env.SIM_TCP_HOST || '127.0.0.1'
const TCP_PORT = Number(process.env.SIM_TCP_PORT || 4001)
const UDP_HOST = process.env.SIM_UDP_HOST || '127.0.0.1'
const UDP_PORT = Number(process.env.SIM_UDP_PORT || 4002)
const DEFAULT_PROTOCOL = (process.env.SIM_PROTOCOL || 'mqtt').toLowerCase()

function createMqttClient() {
  const client = mqtt.connect(MQTT_BROKER_URL, { reconnectPeriod: 2000 })

  return {
    client,
    brokerUrl: MQTT_BROKER_URL,
  }
}

function sendMqtt(client, topic, payload) {
  return new Promise((resolve, reject) => {
    if (!client?.connected) {
      reject(new Error(`MQTT broker not connected at ${MQTT_BROKER_URL}`))
      return
    }

    client.publish(topic, JSON.stringify(payload), { qos: 0 }, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function sendTcp(host, port, payload) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end(`${JSON.stringify(payload)}\n`)
    })

    socket.on('error', reject)
    socket.on('close', (hadError) => {
      if (!hadError) {
        resolve()
      }
    })
  })
}

function sendUdp(host, port, payload) {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4')
    const message = Buffer.from(JSON.stringify(payload))

    socket.send(message, port, host, (error) => {
      socket.close()

      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function createTransportSender({ protocol = DEFAULT_PROTOCOL, mqttClient } = {}) {
  const normalizedProtocol = String(protocol).toLowerCase()

  return {
    protocol: normalizedProtocol,
    mqttClient,
    defaults: {
      mqttBrokerUrl: MQTT_BROKER_URL,
      tcpHost: TCP_HOST,
      tcpPort: TCP_PORT,
      udpHost: UDP_HOST,
      udpPort: UDP_PORT,
    },
    async send({ payload, topic, host, port }) {
      if (normalizedProtocol === 'mqtt') {
        if (!topic) {
          throw new Error('topic is required for MQTT')
        }

        await sendMqtt(mqttClient, topic, payload)
        return { protocol: normalizedProtocol, topic }
      }

      const resolvedHost = host || (normalizedProtocol === 'tcp' ? TCP_HOST : UDP_HOST)
      const resolvedPort = Number(port || (normalizedProtocol === 'tcp' ? TCP_PORT : UDP_PORT))

      if (!resolvedHost || !resolvedPort || Number.isNaN(resolvedPort)) {
        throw new Error(`host and valid port are required for ${normalizedProtocol.toUpperCase()}`)
      }

      if (normalizedProtocol === 'tcp') {
        await sendTcp(resolvedHost, resolvedPort, payload)
        return { protocol: normalizedProtocol, host: resolvedHost, port: resolvedPort }
      }

      if (normalizedProtocol === 'udp') {
        await sendUdp(resolvedHost, resolvedPort, payload)
        return { protocol: normalizedProtocol, host: resolvedHost, port: resolvedPort }
      }

      throw new Error(`Unsupported protocol: ${normalizedProtocol}`)
    },
  }
}

module.exports = {
  MQTT_BROKER_URL,
  TCP_HOST,
  TCP_PORT,
  UDP_HOST,
  UDP_PORT,
  DEFAULT_PROTOCOL,
  createMqttClient,
  createTransportSender,
}
