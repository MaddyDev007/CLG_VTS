import { AxiosError } from 'axios';
import {
  clearSimulatorSession,
  getStoredSimulatorSession,
  saveSimulatorSession,
  simulatorApiClient,
  type SimulatorAuthSession,
  type SimulatorUserRole,
} from './simulatorClient';

const PRIVILEGED_SIMULATOR_ROLES: SimulatorUserRole[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER'];

type AuthSessionResponse = Partial<SimulatorAuthSession>;

function normalizeSession(session: AuthSessionResponse, fallbackEmail: string, fallbackToken?: string): SimulatorAuthSession {
  if (!session.role || !PRIVILEGED_SIMULATOR_ROLES.includes(session.role)) {
    throw new Error('You do not have permission to access the simulator.');
  }

  const token = session.token ?? fallbackToken ?? '';
  if (!token) {
    throw new Error('Authentication token missing from login response.');
  }

  return {
    id: session.id,
    token,
    role: session.role,
    name: session.name ?? fallbackEmail,
    email: session.email ?? fallbackEmail,
    collegeId: session.collegeId ?? null,
  };
}

function toAuthError(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      fallbackMessage;
    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

class SimulatorAuthService {
  async login(email: string, password: string): Promise<SimulatorAuthSession> {
    try {
      const response = await simulatorApiClient.post<AuthSessionResponse>('/auth/login', { email, password });
      const session = normalizeSession(response.data, email);
      saveSimulatorSession(session);
      return session;
    } catch (error) {
      throw toAuthError(error, 'Unable to login to the simulator.');
    }
  }

  async validateSession(): Promise<SimulatorAuthSession> {
    const existing = getStoredSimulatorSession();
    if (!existing) {
      throw new Error('No simulator session found.');
    }

    try {
      const response = await simulatorApiClient.get<AuthSessionResponse>('/auth/session');
      const session = normalizeSession(response.data, existing.email, existing.token);
      saveSimulatorSession(session);
      return session;
    } catch (error) {
      clearSimulatorSession();
      throw toAuthError(error, 'Unable to validate the simulator session.');
    }
  }

  logout(): void {
    void simulatorApiClient.post('/auth/logout').catch(() => null);
    clearSimulatorSession();
  }

  getCurrentUser(): SimulatorAuthSession | null {
    return getStoredSimulatorSession();
  }
}

export const simulatorAuthService = new SimulatorAuthService();
