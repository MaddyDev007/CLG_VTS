import axios from 'axios';

const DEVICE_SIMULATOR_URL_STORAGE_KEY = 'deviceSimulatorUrl';

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

export async function publishTelemetry(topic: string, payload: unknown) {
  return deviceSimulatorApi.post('/publish', { topic, payload });
}
