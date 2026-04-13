import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Simulator from './Simulator';
import { simulatorAuthService } from './services/auth';
import {
  SIMULATOR_AUTH_EXPIRED_EVENT,
  type SimulatorAuthSession,
} from './services/simulatorClient';

function SimulatorLogin({
  error,
  isLoading,
  onSubmit,
}: {
  error: string;
  isLoading: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = useMemo(
    () => Boolean(email.trim()) && Boolean(password.trim()) && !isLoading,
    [email, password, isLoading],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/85 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Fleet Lab</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Simulator Sign In</h1>
        <p className="mt-3 text-sm text-slate-300">
          Sign in with the same VTS account used for the dashboard. Simulator controls stay locked until the backend
          accepts your JWT session.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@vts.local"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Login to Simulator'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<SimulatorAuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const restoreSession = async () => {
      const existing = simulatorAuthService.getCurrentUser();

      if (!existing) {
        setIsRestoring(false);
        return;
      }

      try {
        const validatedSession = await simulatorAuthService.validateSession();
        setSession(validatedSession);
        setAuthError('');
      } catch (error) {
        setSession(null);
        setAuthError(error instanceof Error ? error.message : 'Please login to continue.');
      } finally {
        setIsRestoring(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      setSession(null);
      setAuthError('Your simulator session expired. Please sign in again.');
    };

    window.addEventListener(SIMULATOR_AUTH_EXPIRED_EVENT, handleExpiredSession);

    return () => {
      window.removeEventListener(SIMULATOR_AUTH_EXPIRED_EVENT, handleExpiredSession);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const nextSession = await simulatorAuthService.login(email, password);
      setSession(nextSession);
    } catch (error) {
      setSession(null);
      setAuthError(error instanceof Error ? error.message : 'Unable to login to the simulator.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    simulatorAuthService.logout();
    setSession(null);
    setAuthError('');
  };

  if (isRestoring) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-200">
          Restoring simulator session...
        </div>
      </main>
    );
  }

  if (!session) {
    return <SimulatorLogin error={authError} isLoading={isLoggingIn} onSubmit={handleLogin} />;
  }

  return (
    <div className="sim-shell min-h-screen px-4 py-6 sm:px-8 lg:px-10">
      <header className="sim-hero">
        <div className="sim-hero__glow" />
        <div className="sim-hero__content">
          <p className="sim-hero__eyebrow">Fleet Lab</p>
          <h1 className="sim-hero__title">VTS Device Simulator</h1>
          <p className="sim-hero__sub">
            Drive mode la WASD/Arrow keys use panni bus ah drive pannunga. Data direct ah MQTT, TCP, illa UDP ku send
            aagum.
          </p>
        </div>
        <div className="sim-hero__badge">
          <span className="sim-hero__dot" />
          Signed in as {session.name}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-white/15 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:text-cyan-100"
        >
          Logout
        </button>
      </header>

      <main className="sim-main">
        <Simulator />
      </main>
    </div>
  );
}
