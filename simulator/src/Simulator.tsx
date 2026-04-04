import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  getBridgeHealth,
  getAssignedDevices,
  getDeviceSimulatorUrl,
  publishTelemetry,
  setDeviceSimulatorUrl,
  type TransportProtocol,
} from './services/api';

type SimulatorState = {
  deviceId: string;
  vehicleName: string;
  lat: number;
  lng: number;
  speedKph: number;
  headingDeg: number;
  ignitionOn: boolean;
  batteryMv: number;
  signalDbm: number;
  intervalMs: number;
};

type TransportState = {
  protocol: TransportProtocol;
  host: string;
  port: number;
};

type TransportDefaults = {
  tcp: {
    host: string;
    port: number;
  };
  udp: {
    host: string;
    port: number;
  };
};

const defaultState: SimulatorState = {
  deviceId: 'SIM-001',
  vehicleName: 'College Bus 1',
  lat: 8.7139,
  lng: 77.7567,
  speedKph: 35,
  headingDeg: 90,
  ignitionOn: true,
  batteryMv: 3900,
  signalDbm: -70,
  intervalMs: 2000,
};

const MQTT_TOPIC_PREFIX = (import.meta.env.VITE_MQTT_TOPIC_PREFIX ?? 'vts').replace(/\/$/, '');

export default function Simulator() {
  const [state, setState] = useState<SimulatorState>(defaultState);
  const [isSending, setIsSending] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const deviceSimulatorUrl = getDeviceSimulatorUrl();
  const [devicesLoading, setDevicesLoading] = useState(false);
  const gameMode = true;
  const [maxSpeedKph, setMaxSpeedKph] = useState(80);
  const [picked, setPicked] = useState(false);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [transport, setTransport] = useState<TransportState>({
    protocol: 'mqtt',
    host: '127.0.0.1',
    port: 4001,
  });
  const [transportDefaults, setTransportDefaults] = useState<TransportDefaults>({
    tcp: {
      host: '127.0.0.1',
      port: 4001,
    },
    udp: {
      host: '127.0.0.1',
      port: 4002,
    },
  });
  const timerRef = useRef<number | null>(null);
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const lastFrameRef = useRef<number | null>(null);
  const [publisherStatus, setPublisherStatus] = useState<'idle' | 'ready' | 'disconnected'>('idle');
  const [publisherError, setPublisherError] = useState('');
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState('mqtt://localhost:1883');
  const [stage, setStage] = useState<'setup' | 'game'>('setup');
  const drivingRef = useRef(false);
  const sendingRef = useRef(false);
  const stateRef = useRef(state);
  const telemetryTopic = useMemo(
    () =>
      state.deviceId.trim()
        ? `${MQTT_TOPIC_PREFIX}/devices/${state.deviceId.trim()}/telemetry`
        : `${MQTT_TOPIC_PREFIX}/devices/{device_id}/telemetry`,
    [state.deviceId],
  );
  const transportSummary = useMemo(() => {
    if (transport.protocol === 'mqtt') {
      return telemetryTopic;
    }

    return `${transport.host}:${transport.port}`;
  }, [telemetryTopic, transport.host, transport.port, transport.protocol]);

  const loadDevices = useCallback(async () => {
    try {
      setDevicesLoading(true);
      setDeviceError('');
      const res = await getAssignedDevices();
      setDevices(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setState((prev) => ({
          ...prev,
          deviceId: first.device_id ?? prev.deviceId,
          vehicleName: first.assignedVehicleName ?? first.device_id ?? '',
        }));
      }
    } catch (_error) {
      setDevices([]);
      setDeviceError('Devices load failed. Start `vts-device-simulator` and check its DB config.');
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  const loadBridgeHealth = useCallback(async () => {
    try {
      const res = await getBridgeHealth();
      const health = res.data;
      setMqttConnected(Boolean(health.transports.mqtt.connected));
      setMqttBrokerUrl(health.transports.mqtt.brokerUrl);
      setTransportDefaults({
        tcp: {
          host: health.transports.tcp.host,
          port: health.transports.tcp.port,
        },
        udp: {
          host: health.transports.udp.host,
          port: health.transports.udp.port,
        },
      });
      setTransport((prev) => ({
        protocol: prev.protocol,
        host: prev.protocol === 'udp' ? health.transports.udp.host : health.transports.tcp.host,
        port: prev.protocol === 'udp' ? health.transports.udp.port : health.transports.tcp.port,
      }));
      setPublisherStatus(health.transports.mqtt.connected ? 'ready' : 'idle');
      setPublisherError('');
    } catch (_error) {
      setPublisherStatus('disconnected');
      setPublisherError('Bridge health check failed.');
    }
  }, []);

  useEffect(() => {
    loadDevices();
    void loadBridgeHealth();
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [loadBridgeHealth, loadDevices]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const carIcon = useMemo(
    () =>
      L.divIcon({
        className: 'sim-car-icon',
        html: `<div class="sim-car-icon__arrow" style="transform: rotate(${state.headingDeg}deg)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [state.headingDeg],
  );

  const pushLog = (message: string) => {
    setLog((prev) => [message, ...prev].slice(0, 30));
  };

  const refreshBridge = async () => {
    setDeviceSimulatorUrl(deviceSimulatorUrl);
    await loadBridgeHealth();
  };

  const canEnterGame = Boolean(state.deviceId.trim());

  const setPosition = (lat: number, lng: number) => {
    setState((prev) => ({ ...prev, lat, lng }));
    setPicked(true);
    pushLog(`Start point set: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  };

  const searchLocation = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search.trim())}`,
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data.slice(0, 5));
      } else {
        setSearchError('No locations found.');
      }
    } catch (error) {
      setSearchError('Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    const handle = window.setTimeout(() => {
      searchLocation();
    }, 400);
    return () => window.clearTimeout(handle);
  }, [search]);

  const sendOnce = useCallback(async () => {
    const snapshot = stateRef.current;
    const payload = {
      device_id: snapshot.deviceId,
      timestamp: new Date().toISOString(),
      lat: snapshot.lat,
      lon: snapshot.lng,
      speed_kmph: Number(snapshot.speedKph.toFixed(1)),
      heading: Math.round(snapshot.headingDeg),
      battery_mv: Math.round(snapshot.batteryMv),
      signal_dbm: Math.round(snapshot.signalDbm),
      ignition: snapshot.ignitionOn,
    };
    try {
      await publishTelemetry(
        transport.protocol === 'mqtt'
          ? {
              protocol: 'mqtt',
              topic: `${MQTT_TOPIC_PREFIX}/devices/${snapshot.deviceId}/telemetry`,
              payload,
            }
          : {
              protocol: transport.protocol,
              host: transport.host,
              port: Number(transport.port),
              payload,
            },
      );
      setPublisherStatus('ready');
      setPublisherError('');
      pushLog(`${transport.protocol.toUpperCase()} sent: ${payload.device_id} -> ${transportSummary}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `${transport.protocol.toUpperCase()} send failed.`;
      setPublisherStatus('disconnected');
      setPublisherError(message);
      pushLog(message);
    }
  }, [transport, transportSummary]);

  const startSending = () => {
    if (sendingRef.current) return;
    setIsSending(true);
    setState((prev) => ({ ...prev, ignitionOn: true }));
  };

  const stopSending = () => {
    setIsSending(false);
    setState((prev) => ({ ...prev, ignitionOn: isDriving ? true : false }));
  };

  const startDriving = () => {
    if (drivingRef.current) return;
    setIsDriving(true);
    setState((prev) => ({ ...prev, ignitionOn: true }));
  };

  const stopDriving = () => {
    setIsDriving(false);
    setState((prev) => ({ ...prev, speedKph: 0, ignitionOn: isSending ? true : false }));
  };

  useEffect(() => {
    drivingRef.current = isDriving;
  }, [isDriving]);

  useEffect(() => {
    sendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    if (!isSending) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      void sendOnce();
    }, state.intervalMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSending, state.intervalMs, sendOnce]);

  useEffect(() => {
    if (!gameMode) return;
    const onKey = (event: KeyboardEvent, pressed: boolean) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keysRef.current.up = pressed;
      if (key === 's' || key === 'arrowdown') keysRef.current.down = pressed;
      if (key === 'a' || key === 'arrowleft') keysRef.current.left = pressed;
      if (key === 'd' || key === 'arrowright') keysRef.current.right = pressed;
      if (
        pressed &&
        !drivingRef.current &&
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)
      ) {
        startDriving();
      }
      if (key === ' ' || key === 'spacebar') {
        if (pressed) {
          setState((prev) => ({ ...prev, speedKph: 0 }));
        }
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault();
      }
    };
    const handleDown = (e: KeyboardEvent) => onKey(e, true);
    const handleUp = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [gameMode]);

  useEffect(() => {
    if (!isDriving || !gameMode) return;
    let raf = 0;
    const accelPerSec = Math.max(6, maxSpeedKph * 0.45);
    const brakePerSec = Math.max(10, maxSpeedKph * 0.7);
    const turnRate = 120; // deg per sec

    const loop = (ts: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = ts;
      const dt = Math.min(0.05, (ts - lastFrameRef.current) / 1000);
      lastFrameRef.current = ts;

      const keys = keysRef.current;
      setState((prev) => {
        let nextSpeed = prev.speedKph;
        if (keys.up) nextSpeed = Math.min(maxSpeedKph, nextSpeed + accelPerSec * dt);
        if (keys.down) nextSpeed = Math.max(0, nextSpeed - brakePerSec * dt);
        if (!keys.up && !keys.down) {
          nextSpeed = Math.max(0, nextSpeed - accelPerSec * 0.4 * dt);
        }

        let nextHeading = prev.headingDeg;
        if (keys.left) nextHeading = (nextHeading - turnRate * dt + 360) % 360;
        if (keys.right) nextHeading = (nextHeading + turnRate * dt) % 360;

        if (nextSpeed <= 0.01) {
          return {
            ...prev,
            speedKph: 0,
            headingDeg: Math.round(nextHeading),
          };
        }

        const distanceMeters = (nextSpeed * 1000 * dt) / 3600;
        const headingRad = (nextHeading * Math.PI) / 180;
        const dLat = (distanceMeters * Math.cos(headingRad)) / 111_320;
        const dLng =
          (distanceMeters * Math.sin(headingRad)) /
          (111_320 * Math.cos((prev.lat * Math.PI) / 180));
        return {
          ...prev,
          speedKph: Number(nextSpeed.toFixed(1)),
          headingDeg: Math.round(nextHeading),
          lat: Number((prev.lat + dLat).toFixed(6)),
          lng: Number((prev.lng + dLng).toFixed(6)),
        };
      });

      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      lastFrameRef.current = null;
    };
  }, [isDriving, gameMode, maxSpeedKph]);

  return (
    <div className="flex flex-col gap-6">
      {stage === 'setup' ? (
        <div className="sim-setup grid gap-6">
          <div className="glass card-glow rounded-2xl p-5">
            <h2 className="text-2xl font-semibold">Drive Setup</h2>
            <p className="text-sm text-[var(--muted)]">
              Pick a real assigned device, choose the start point, and drive. `vts-device-simulator`
              {' '}reads the devices from your DB and publishes the UI-generated telemetry over MQTT,
              {' '}TCP, or UDP.
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Publisher:{' '}
              <span className="text-white">
                {publisherStatus === 'ready'
                  ? 'Ready'
                  : publisherStatus === 'idle'
                    ? 'Idle'
                    : 'Disconnected'}
              </span>
              {publisherError ? ` • ${publisherError}` : ''}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass card-glow rounded-2xl p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span>Devices come from the real DB through `vts-device-simulator`.</span>
                    <button
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] hover:text-white"
                      onClick={loadDevices}
                    >
                      {devicesLoading ? 'Loading...' : 'Reload Devices'}
                    </button>
                  </div>
                  {deviceError ? <p className="text-xs text-[var(--danger)]">{deviceError}</p> : null}
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Publish Path</label>
                  <div className="rounded-xl border border-white/10 bg-[var(--panel)]/60 px-3 py-2 text-sm text-white">
                    <p className="truncate">Bridge: {deviceSimulatorUrl}</p>
                    <p className="mt-1 truncate text-[var(--muted)]">
                      {transport.protocol === 'mqtt'
                        ? `Topic: ${telemetryTopic}`
                        : `Destination: ${transportSummary}`}
                    </p>
                    {transport.protocol === 'mqtt' ? (
                      <p className="mt-1 truncate text-[var(--muted)]">
                        Broker: {mqttBrokerUrl} ({mqttConnected ? 'connected' : 'disconnected'})
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="w-fit rounded-xl border border-white/10 px-4 py-2 text-xs text-[var(--muted)] hover:text-white"
                    onClick={refreshBridge}
                  >
                    Refresh Bridge
                  </button>
                  {publisherError ? <p className="text-xs text-[var(--danger)]">{publisherError}</p> : null}
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Transport Protocol
                  </label>
                  <select
                    className="rounded-xl border border-white/10 bg-[var(--panel)] px-3 py-2 text-sm text-white"
                    value={transport.protocol}
                    onChange={(e) => {
                      const protocol = e.target.value as TransportProtocol;
                      setTransport((prev) => ({
                        ...prev,
                        protocol,
                        host:
                          protocol === 'udp'
                            ? transportDefaults.udp.host
                            : protocol === 'tcp'
                              ? transportDefaults.tcp.host
                              : prev.host,
                        port:
                          protocol === 'udp'
                            ? transportDefaults.udp.port
                            : protocol === 'tcp'
                              ? transportDefaults.tcp.port
                              : prev.port,
                      }));
                    }}
                  >
                    <option value="mqtt">MQTT</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Select Device
                  </label>
                  <select
                    className="rounded-xl border border-white/10 bg-[var(--panel)] px-3 py-2 text-sm text-white"
                    value={state.deviceId}
                    onChange={(e) => {
                      const selected = devices.find((d) => d.device_id === e.target.value);
                      setState((prev) => ({
                        ...prev,
                        deviceId: e.target.value,
                        vehicleName: selected?.assignedVehicleName ?? selected?.device_id ?? '',
                      }));
                    }}
                  >
                    <option value="">Select device</option>
                    {devices.map((device) => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.device_id}
                        {device.imei ? ` (${device.imei})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {transport.protocol !== 'mqtt' ? (
                  <>
                    <input
                      className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white"
                      placeholder={`${transport.protocol.toUpperCase()} host`}
                      value={transport.host}
                      onChange={(e) => setTransport((prev) => ({ ...prev, host: e.target.value }))}
                    />
                    <input
                      className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white"
                      type="number"
                      placeholder={`${transport.protocol.toUpperCase()} port`}
                      value={transport.port}
                      onChange={(e) => setTransport((prev) => ({ ...prev, port: Number(e.target.value) }))}
                    />
                  </>
                ) : null}
                <input
                  className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white"
                  type="number"
                  placeholder="Latitude"
                  value={state.lat}
                  onChange={(e) => setState({ ...state, lat: Number(e.target.value) })}
                />
                <input
                  className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white"
                  type="number"
                  placeholder="Longitude"
                  value={state.lng}
                  onChange={(e) => setState({ ...state, lng: Number(e.target.value) })}
                />
                <div className="rounded-xl border border-white/10 bg-[var(--panel)]/60 px-3 py-2 text-sm text-white">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Top Speed (km/h)</span>
                    <span>{maxSpeedKph}</span>
                  </div>
                  <input
                    className="mt-2 w-full accent-[var(--accent)]"
                    type="range"
                    min={20}
                    max={140}
                    step={5}
                    value={maxSpeedKph}
                    onChange={(e) => setMaxSpeedKph(Number(e.target.value))}
                  />
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--panel)]/60 px-3 py-2 text-sm text-white">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Interval (ms)</span>
                    <span>{state.intervalMs}</span>
                  </div>
                  <input
                    className="mt-2 w-full accent-[var(--accent)]"
                    type="range"
                    min={500}
                    max={5000}
                    step={100}
                    value={state.intervalMs}
                    onChange={(e) => setState({ ...state, intervalMs: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#061017] disabled:opacity-60"
                  onClick={() => setStage('game')}
                  disabled={!canEnterGame}
                >
                  Enter Drive Arena
                </button>
                <button
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[var(--muted)] hover:text-white"
                  onClick={sendOnce}
                >
                  Send Once
                </button>
              </div>
            </div>

            <div className="glass card-glow rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Pick Starting Point</h3>
              <p className="text-xs text-[var(--muted)]">Search or click map to set spawn</p>
              <div className="relative mt-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white placeholder:text-[var(--muted)]"
                    placeholder="Search location"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchLocation();
                      }
                    }}
                  />
                  <button
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[var(--muted)] hover:text-white"
                    onClick={searchLocation}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchError ? <p className="text-xs text-[var(--danger)]">{searchError}</p> : null}
                {searchResults.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-999 mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[var(--panel)] p-2 text-xs text-[var(--muted)] shadow-xl">
                    {searchResults.map((item) => (
                      <button
                        key={item.place_id}
                        className="w-full rounded-lg px-2 py-2 text-left hover:bg-white/5 hover:text-white"
                        onClick={() => {
                          const lat = Number(item.lat);
                          const lng = Number(item.lon);
                          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                            setPosition(lat, lng);
                            setSearchResults([]);
                            setSearch('');
                          }
                        }}
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 h-80 overflow-hidden rounded-2xl border border-white/10 sm:h-96">
                <MapContainer center={[state.lat, state.lng] as any} zoom={24} className="h-full w-full">
                  <TileLayer
                    attribution="Tiles &copy; Esri"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  <TileLayer
                    attribution="Labels &copy; Esri"
                    url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  />
                  <MapSync center={[state.lat, state.lng]} />
                  <MapClickHandler onSelect={setPosition} />
                  <Marker
                    position={[state.lat, state.lng]}
                    icon={carIcon}
                    draggable
                    eventHandlers={{
                      dragend: (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
                        const pos = event.target.getLatLng();
                        setPosition(pos.lat, pos.lng);
                      },
                    }}
                  />
                </MapContainer>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {picked ? 'Spawn set. Ready to play.' : 'Map la click panni start point set pannunga.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="sim-game">
          <div className="sim-game__top">
            <div>
              <h2 className="text-2xl font-semibold">Drive Arena</h2>
              <p className="text-sm text-[var(--muted)]">
                WASD / Arrow keys to drive. Space = brake. {transport.protocol.toUpperCase()} live
                {' '}stream on.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[var(--muted)] hover:text-white"
                onClick={() => setStage('setup')}
              >
                Back to Setup
              </button>
              {!isSending ? (
                <button
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[#061017]"
                  onClick={startSending}
                >
                  Start Sending
                </button>
              ) : (
                <button
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[var(--muted)] hover:text-white"
                  onClick={stopSending}
                >
                  Stop Sending
                </button>
              )}
              {!isDriving ? (
                <button
                  className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 hover:text-white"
                  onClick={startDriving}
                >
                  Start Drive
                </button>
              ) : (
                <button
                  className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs text-rose-200 hover:text-white"
                  onClick={stopDriving}
                >
                  Stop Drive
                </button>
              )}
            </div>
          </div>

          <div className="sim-game__grid">
            <div className="sim-game__map">
              <MapContainer center={[state.lat, state.lng] as any} zoom={24} className="h-full w-full">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                  attribution="Labels &copy; Esri"
                  url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />
                <MapSync center={[state.lat, state.lng]} />
                <MapClickHandler onSelect={setPosition} />
                <Marker
                  position={[state.lat, state.lng]}
                  icon={carIcon}
                  draggable
                  eventHandlers={{
                    dragend: (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
                      const pos = event.target.getLatLng();
                      setPosition(pos.lat, pos.lng);
                    },
                  }}
                />
              </MapContainer>
            </div>

            <div className="sim-game__hud">
              <div className="sim-hud-card">
                <p className="sim-hud-label">Speed</p>
                <p className="sim-hud-value">{Math.round(state.speedKph)} km/h</p>
                <div className="sim-hud-meter">
                  <div
                    className="sim-hud-meter__fill"
                    style={{ width: `${Math.min(100, (state.speedKph / maxSpeedKph) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="sim-hud-card">
                <p className="sim-hud-label">Heading</p>
                <p className="sim-hud-value">{state.headingDeg}°</p>
                <p className="sim-hud-sub">Device: {state.deviceId || '—'}</p>
              </div>
              <div className="sim-hud-card">
                <p className="sim-hud-label">{transport.protocol.toUpperCase()}</p>
                <p className="sim-hud-value">
                  {publisherStatus === 'ready'
                    ? 'Ready'
                    : publisherStatus === 'idle'
                      ? 'Idle'
                      : 'Disconnected'}
                </p>
                <p className="sim-hud-sub">
                  {transport.protocol === 'mqtt'
                    ? `Topic: ${telemetryTopic}`
                    : `Destination: ${transportSummary}`}
                </p>
                <p className="sim-hud-sub">Bridge: {deviceSimulatorUrl}</p>
              </div>
              <div className="sim-hud-card">
                <p className="sim-hud-label">Stream</p>
                <p className="sim-hud-value">{isSending ? 'Live' : 'Paused'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button
                    className="rounded-xl border border-white/10 px-3 py-2 text-[var(--muted)] hover:text-white"
                    onClick={() => setState((prev) => ({ ...prev, speedKph: 0 }))}
                  >
                    Brake
                  </button>
                  <button
                    className="rounded-xl border border-white/10 px-3 py-2 text-[var(--muted)] hover:text-white"
                    onClick={() => setPosition(defaultState.lat, defaultState.lng)}
                  >
                    Reset Position
                  </button>
                </div>
              </div>

              <div className="sim-hud-card sim-hud-log">
                <p className="sim-hud-label">Telemetry Log</p>
                <div className="sim-hud-log__list">
                  {log.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">No events yet.</p>
                  ) : (
                    log.map((line, index) => <div key={index}>{line}</div>)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event: { latlng: { lat: number; lng: number } }) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapSync({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}
