import { AxiosError } from 'axios';
import {
  getStoredDeviceSimulatorUrl,
  setStoredDeviceSimulatorUrl,
  simulatorApiClient,
} from './simulatorClient';

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

export function getDeviceSimulatorUrl() {
  return getStoredDeviceSimulatorUrl();
}

export function setDeviceSimulatorUrl(nextUrl: string) {
  setStoredDeviceSimulatorUrl(nextUrl);
}

export async function getAssignedDevices() {
  return simulatorApiClient.get('/devices');
}

export async function getPublisherHealth() {
  return simulatorApiClient.get<PublisherHealth>('/health');
}

export async function publishTelemetry(request: PublishTelemetryRequest) {
  return simulatorApiClient.post('/publish', request);
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      fallbackMessage;
    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
