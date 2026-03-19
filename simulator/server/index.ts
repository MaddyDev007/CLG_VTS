import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mqtt from 'mqtt';

type TelemetryPayload = {
  device_id: string;
  timestamp: string;
  lat: number;
  lon: number;
  speed_kmph: number;
  heading: number;
  battery_mv: number;
  signal_dbm: number;
  ignition: boolean;
};

const port = Number(process.env.SIMULATOR_SERVER_PORT ?? 3011);
const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';

const app = express();
app.use(cors());
app.use(express.json());

const mqttClient = mqtt.connect(mqttBrokerUrl, { reconnectPeriod: 2000 });

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    mqttBrokerUrl,
    mqttConnected: mqttClient.connected,
  });
});

app.post('/publish', async (request, response) => {
  const { topic, payload } = request.body as {
    topic?: string;
    payload?: TelemetryPayload;
  };

  if (!topic || !payload) {
    response.status(400).json({ message: 'topic and payload are required' });
    return;
  }

  if (!mqttClient.connected) {
    response.status(503).json({ message: `MQTT broker not connected at ${mqttBrokerUrl}` });
    return;
  }

  mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 }, (error?: Error) => {
    if (error) {
      response.status(500).json({ message: error.message });
      return;
    }

    response.json({ success: true });
  });
});

mqttClient.on('connect', () => {
  console.log(`[simulator-server] MQTT connected: ${mqttBrokerUrl}`);
});

mqttClient.on('reconnect', () => {
  console.log('[simulator-server] MQTT reconnecting...');
});

mqttClient.on('error', (error) => {
  console.error(`[simulator-server] MQTT error: ${error.message}`);
});

app.listen(port, () => {
  console.log(`[simulator-server] listening on http://localhost:${port}`);
});
