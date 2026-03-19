const mqtt = require('mqtt')

const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL ||
  process.env.SIM_MQTT_URL ||
  'mqtt://localhost:1883'

function createMqttClient() {
  const client = mqtt.connect(MQTT_BROKER_URL, { reconnectPeriod: 2000 })

  return {
    client,
    brokerUrl: MQTT_BROKER_URL,
  }
}

module.exports = {
  MQTT_BROKER_URL,
  createMqttClient,
}
