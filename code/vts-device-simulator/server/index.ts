import 'dotenv/config';
import axios, { AxiosError } from 'axios';
import cors from 'cors';
import dgram from 'dgram';
import express from 'express';
import { existsSync } from 'node:fs';
import mqtt from 'mqtt';
import net from 'net';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { fileURLToPath } from 'node:url';

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

type AssignedDevice = {
  device_id: string;
  imei: string | null;
  assignedVehicleName: string | null;
};

type SimulatorRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT';

type BackendProfile = {
  id: string;
  email: string;
  name: string;
  role: SimulatorRole;
  collegeId?: string | null;
};

type BackendLoginResponse = BackendProfile & {
  token: string;
};

type AuthenticatedRequest = express.Request & {
  authToken?: string;
  authUser?: BackendProfile;
};

const port = Number(process.env.SIMULATOR_SERVER_PORT ?? 3011);
const postgresUrl = process.env.POSTGRES_URL ?? 'postgres://postgres:vts123@postgres:5432/vts';
const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://mosquitto:1883';
const backendApiUrl = (process.env.BACKEND_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const tcpHost = process.env.SIM_TCP_HOST ?? 'backend';
const tcpPort = Number(process.env.SIM_TCP_PORT ?? 4002);
const udpHost = process.env.SIM_UDP_HOST ?? 'backend';
const udpPort = Number(process.env.SIM_UDP_PORT ?? 4001);
const defaultProtocol = ((process.env.SIM_PROTOCOL ?? 'mqtt').toLowerCase() as TransportProtocol);
const allowedSimulatorRoles = new Set<SimulatorRole>(['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER']);
const clientDist = fileURLToPath(new URL('../dist', import.meta.url));
const clientIndex = resolve(clientDist, 'index.html');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: postgresUrl,
});

const mqttClient = mqtt.connect(mqttBrokerUrl, { reconnectPeriod: 2000 });

function extractBearerToken(request: express.Request) {
  const authHeader = request.header('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function toHttpError(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    return {
      status: error.response?.status ?? 502,
      message:
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message ??
        fallbackMessage,
    };
  }

  if (error instanceof Error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    return {
      status,
      message: error.message || fallbackMessage,
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
  };
}

async function fetchValidatedProfile(token: string): Promise<BackendProfile> {
  const response = await axios.get<BackendProfile>(`${backendApiUrl}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 5000,
  });

  if (!allowedSimulatorRoles.has(response.data.role)) {
    const error = new Error('You do not have permission to use the simulator.');
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  return response.data;
}

async function requireSimulatorAuth(
  request: AuthenticatedRequest,
  response: express.Response,
  next: express.NextFunction,
) {
  const token = extractBearerToken(request);

  if (!token) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    request.authToken = token;
    request.authUser = await fetchValidatedProfile(token);
    next();
  } catch (error) {
    const httpError = toHttpError(error, 'Unable to validate simulator access.');
    response.status(httpError.status).json({ message: httpError.message });
  }
}

async function loadAssignedDevices(): Promise<AssignedDevice[]> {
  const result = await pool.query<AssignedDevice>(`
    SELECT
      "deviceId" AS device_id,
      imei,
      "assignedVehicleName" AS "assignedVehicleName"
    FROM devices
    WHERE status = 'assigned'
    ORDER BY "updatedAt" DESC, "createdAt" DESC
  `);

  return result.rows.filter((device: AssignedDevice) => device.device_id);
}

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

app.post('/auth/login', async (request, response) => {
  const { email, password } = request.body as { email?: string; password?: string };

  if (!email?.trim() || !password?.trim()) {
    response.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const backendResponse = await axios.post<BackendLoginResponse>(
      `${backendApiUrl}/auth/login`,
      {
        email: email.trim(),
        password,
      },
      {
        timeout: 5000,
      },
    );

    if (!allowedSimulatorRoles.has(backendResponse.data.role)) {
      response.status(403).json({ message: 'You do not have permission to use the simulator.' });
      return;
    }

    response.json(backendResponse.data);
  } catch (error) {
    const httpError = toHttpError(error, 'Login failed.');
    console.warn(`[vts-device-simulator] login failed: ${httpError.message}`);
    response.status(httpError.status).json({ message: httpError.message });
  }
});

app.get('/auth/session', requireSimulatorAuth, (request: AuthenticatedRequest, response) => {
  response.json(request.authUser);
});

app.post('/auth/logout', async (request, response) => {
  const token = extractBearerToken(request);

  if (!token) {
    response.json({ success: true });
    return;
  }

  try {
    await axios.post(
      `${backendApiUrl}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      },
    );
  } catch {
    // Backend logout is stateless. Local session clearing is still enough.
  }

  response.json({ success: true });
});

app.get('/health', requireSimulatorAuth, (_request, response) => {
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

app.get('/devices', requireSimulatorAuth, async (_request, response) => {
  try {
    const devices = await loadAssignedDevices();
    response.json(devices);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load devices';
    response.status(500).json({ message });
  }
});

app.post('/publish', requireSimulatorAuth, async (request, response) => {
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

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!auth(?:\/|$)|health$|devices$|publish$).*/, (_request, response) => {
    response.sendFile(clientIndex);
  });
}

mqttClient.on('connect', () => {
  console.log(`[vts-device-simulator] MQTT connected: ${mqttBrokerUrl}`);
});

mqttClient.on('reconnect', () => {
  console.log('[vts-device-simulator] MQTT reconnecting...');
});

mqttClient.on('error', (error) => {
  console.error(`[vts-device-simulator] MQTT error: ${error.message}`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[vts-device-simulator] listening on 0.0.0.0:${port}`);
});
