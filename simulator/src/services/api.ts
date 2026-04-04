import axios from 'axios';

const DEVICE_SIMULATOR_URL_STORAGE_KEY = 'deviceSimulatorUrl';

export type TransportProtocol = 'mqtt' | 'tcp' | 'udp';

export type BridgeHealth = {
  ok: boolean;
  defaultProtocol: TransportProtocol;
  transports: {
    mqtt: {
      brokerUrl: string;
      connected: boolean;
    };
    tcp: {
      host: string;
      port: number;
    };
    udp: {
      host: string;
      port: number;
    };
  };
};

export type PublishTelemetryRequest = {
  protocol: TransportProtocol;
  payload: unknown;
  topic?: string;
  host?: string;
  port?: number;
};

function defaultDeviceSimulatorUrl() {
  const saved = localStorage.getItem(DEVICE_SIMULATOR_URL_STORAGE_KEY);
  if (saved && saved.trim().length > 0) {
    return saved;
  }

  return import.meta.env.VITE_DEVICE_SIMULATOR_URL ?? `${window.location.protocol}//${window.location.hostname}:3011`;
}

const deviceSimulatorApi = axios.create({
  baseURL: defaultDeviceSimulatorUrl(),
});

export function getDeviceSimulatorUrl() {
  return deviceSimulatorApi.defaults.baseURL ?? defaultDeviceSimulatorUrl();
}

export function setDeviceSimulatorUrl(nextUrl: string) {
  const normalized = nextUrl.trim().replace(/\/$/, '');
  deviceSimulatorApi.defaults.baseURL = normalized;
  localStorage.setItem(DEVICE_SIMULATOR_URL_STORAGE_KEY, normalized);
}

export async function getAssignedDevices() {
  return deviceSimulatorApi.get('/devices');
}

export async function getBridgeHealth() {
  return deviceSimulatorApi.get<BridgeHealth>('/health');
}

export async function publishTelemetry(request: PublishTelemetryRequest) {
  return deviceSimulatorApi.post('/publish', request);
}
