import axios from 'axios';

const DEVICE_SIMULATOR_URL_STORAGE_KEY = 'vtsDeviceSimulatorUrl';
const LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY = 'deviceSimulatorUrl';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export const SIMULATOR_AUTH_STORAGE_KEY = 'vts-simulator-auth-session';
export const SIMULATOR_AUTH_EXPIRED_EVENT = 'vts-simulator-auth-expired';

export type SimulatorUserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT';

export type SimulatorAuthSession = {
  id?: string;
  token: string;
  role: SimulatorUserRole;
  name: string;
  email: string;
  collegeId?: string | null;
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
    return saved.trim().replace(/\/$/, '');
  }

  if (saved && !isCompatibleWithCurrentBrowser(saved)) {
    localStorage.removeItem(DEVICE_SIMULATOR_URL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY);
  }

  if (envUrl && isCompatibleWithCurrentBrowser(envUrl)) {
    return envUrl.trim().replace(/\/$/, '');
  }

  return fallback;
}

export function getStoredSimulatorSession(): SimulatorAuthSession | null {
  const raw = localStorage.getItem(SIMULATOR_AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SimulatorAuthSession>;

    if (
      typeof parsed.token === 'string' &&
      typeof parsed.role === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return {
        id: parsed.id,
        token: parsed.token,
        role: parsed.role as SimulatorUserRole,
        name: parsed.name,
        email: parsed.email,
        collegeId: parsed.collegeId ?? null,
      };
    }
  } catch {
    // Ignore malformed session data and fall through to cleanup.
  }

  localStorage.removeItem(SIMULATOR_AUTH_STORAGE_KEY);
  return null;
}

export function saveSimulatorSession(session: SimulatorAuthSession) {
  localStorage.setItem(SIMULATOR_AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSimulatorSession() {
  localStorage.removeItem(SIMULATOR_AUTH_STORAGE_KEY);
}

export const simulatorApiClient = axios.create({
  baseURL: defaultDeviceSimulatorUrl(),
});

simulatorApiClient.interceptors.request.use((config) => {
  const session = getStoredSimulatorSession();

  if (session?.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

simulatorApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url ?? '');

    if ((error.response?.status === 401 || error.response?.status === 403) && !requestUrl.startsWith('/auth/login')) {
      clearSimulatorSession();
      window.dispatchEvent(new CustomEvent(SIMULATOR_AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export function getStoredDeviceSimulatorUrl() {
  return simulatorApiClient.defaults.baseURL ?? defaultDeviceSimulatorUrl();
}

export function setStoredDeviceSimulatorUrl(nextUrl: string) {
  const normalized = nextUrl.trim().replace(/\/$/, '');
  simulatorApiClient.defaults.baseURL = normalized;
  localStorage.setItem(DEVICE_SIMULATOR_URL_STORAGE_KEY, normalized);
  localStorage.removeItem(LEGACY_DEVICE_SIMULATOR_URL_STORAGE_KEY);
}
