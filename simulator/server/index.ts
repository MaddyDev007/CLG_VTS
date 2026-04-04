import 'dotenv/config';
import cors from 'cors';
import dgram from 'dgram';
import express from 'express';
import mqtt from 'mqtt';
import net from 'net';

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

type TransportProtocol = 'mqtt' | 'tcp' | 'udp';

type PublishRequest = {
  protocol?: TransportProtocol;
  topic?: string;
  host?: string;
  port?: number;
  payload?: TelemetryPayload;
};

const port = Number(process.env.SIMULATOR_SERVER_PORT ?? 3011);
const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const tcpHost = process.env.SIM_TCP_HOST ?? '127.0.0.1';
const tcpPort = Number(process.env.SIM_TCP_PORT ?? 4001);
const udpHost = process.env.SIM_UDP_HOST ?? '127.0.0.1';
const udpPort = Number(process.env.SIM_UDP_PORT ?? 4002);
const defaultProtocol = ((process.env.SIM_PROTOCOL ?? 'mqtt').toLowerCase() as TransportProtocol);

const app = express();
app.use(cors());
app.use(express.json());

const mqttClient = mqtt.connect(mqttBrokerUrl, { reconnectPeriod: 2000 });

function sendViaTcp(host: string, targetPort: number, payload: TelemetryPayload) {
  return new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port: targetPort }, () => {
      socket.end(`${JSON.stringify(payload)}\n`);
    });

    socket.on('error', reject);
    socket.on('close', (hadError) => {
      if (!hadError) {
        resolve();
      }
    });
  });
}

function sendViaUdp(host: string, targetPort: number, payload: TelemetryPayload) {
  return new Promise<void>((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const message = Buffer.from(JSON.stringify(payload));

    socket.send(message, targetPort, host, (error) => {
      socket.close();

      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function sendViaMqtt(topic: string, payload: TelemetryPayload) {
  return new Promise<void>((resolve, reject) => {
    if (!mqttClient.connected) {
      reject(new Error(`MQTT broker not connected at ${mqttBrokerUrl}`));
      return;
    }

    mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 }, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    defaultProtocol,
    transports: {
      mqtt: {
        brokerUrl: mqttBrokerUrl,
        connected: mqttClient.connected,
      },
      tcp: {
        host: tcpHost,
        port: tcpPort,
      },
      udp: {
        host: udpHost,
        port: udpPort,
      },
    },
  });
});

app.post('/publish', async (request, response) => {
  const {
    protocol = defaultProtocol,
    topic,
    host,
    port: targetPort,
    payload,
  } = request.body as PublishRequest;

  if (!payload) {
    response.status(400).json({ message: 'payload is required' });
    return;
  }

  try {
    if (protocol === 'mqtt') {
      if (!topic) {
        response.status(400).json({ message: 'topic is required for MQTT' });
        return;
      }

      await sendViaMqtt(topic, payload);
      response.json({ success: true, protocol, topic });
      return;
    }

    const resolvedHost = host ?? (protocol === 'tcp' ? tcpHost : udpHost);
    const resolvedPort = Number(targetPort ?? (protocol === 'tcp' ? tcpPort : udpPort));

    if (!resolvedHost || !resolvedPort || Number.isNaN(resolvedPort)) {
      response.status(400).json({ message: `host and valid port are required for ${protocol.toUpperCase()}` });
      return;
    }

    if (protocol === 'tcp') {
      await sendViaTcp(resolvedHost, resolvedPort, payload);
      response.json({ success: true, protocol, host: resolvedHost, port: resolvedPort });
      return;
    }

    if (protocol === 'udp') {
      await sendViaUdp(resolvedHost, resolvedPort, payload);
      response.json({ success: true, protocol, host: resolvedHost, port: resolvedPort });
      return;
    }

    response.status(400).json({ message: `Unsupported protocol: ${protocol}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    response.status(protocol === 'mqtt' ? 503 : 500).json({ message });
  }
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
