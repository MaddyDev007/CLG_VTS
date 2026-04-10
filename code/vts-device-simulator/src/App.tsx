import Simulator from './Simulator';

export default function App() {
  return (
    <div className="sim-shell min-h-screen px-4 py-6 sm:px-8 lg:px-10">
      <header className="sim-hero">
        <div className="sim-hero__glow" />
        <div className="sim-hero__content">
          <p className="sim-hero__eyebrow">Fleet Lab</p>
          <h1 className="sim-hero__title">VTS Device Simulator</h1>
          <p className="sim-hero__sub">
            Drive mode la WASD/Arrow keys use panni bus ah drive pannunga. Data direct ah MQTT, TCP, illa UDP ku send aagum.
          </p>
        </div>
        <div className="sim-hero__badge">
          <span className="sim-hero__dot" />
          Ready to transmit
        </div>
      </header>

      <main className="sim-main">
        <Simulator />
      </main>
    </div>
  );
}
