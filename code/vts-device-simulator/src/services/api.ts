import axios from 'axios';

const DEVICE_SIMULATOR_URL_STORAGE_KEY = 'vtsDeviceSimulatorUrl';
const LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY = 'deviceSimulatorUrl';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export type TransportProtocol = 'mqtt' | 'tcp' | 'udp';

export type PublisherHealth = {
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

function isLoopbackHost(hostname: string) {
  return LOOPBACK_HOSTS.has(hostname.trim().toLowerCase());
}

function isCurrentBrowserLocal() {
  return isLoopbackHost(window.location.hostname);
}

function isCompatibleWithCurrentBrowser(candidateUrl: string) {
  try {
    const hostname = new URL(candidateUrl, window.location.origin).hostname;
    if (!isCurrentBrowserLocal()) {
      return true;
    }

    return isLoopbackHost(hostname);
  } catch {
    return false;
  }
}

function defaultDeviceSimulatorUrl() {
  const envUrl = import.meta.env.VITE_DEVICE_SIMULATOR_URL;
  const saved =
    localStorage.getItem(DEVICE_SIMULATOR_URL_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY);
  const fallback = `${window.location.protocol}//${window.location.hostname}:3011`;

  if (saved && saved.trim().length > 0 && isCompatibleWithCurrentBrowser(saved)) {
    console.log('Using saved vts-device-simulator URL:', saved);
    return saved.trim().replace(/\/$/, '');
  }

  if (saved && !isCompatibleWithCurrentBrowser(saved)) {
    console.log('Ignoring stale simulator URL for current browser host:', saved);
    localStorage.removeItem(DEVICE_SIMULATOR_URL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY);
  }

  if (envUrl && isCompatibleWithCurrentBrowser(envUrl)) {
    console.log('Using ENV vts-device-simulator URL:', envUrl);
    return envUrl.trim().replace(/\/$/, '');
  }

  console.log('Using fallback vts-device-simulator URL:', fallback);

  return fallback;
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
  localStorage.removeItem(LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY);
}

export async function getAssignedDevices() {
  return deviceSimulatorApi.get('/devices');
}

export async function getPublisherHealth() {
  return deviceSimulatorApi.get<PublisherHealth>('/health');
}

export async function publishTelemetry(request: PublishTelemetryRequest) {
  return deviceSimulatorApi.post('/publish', request);
}
