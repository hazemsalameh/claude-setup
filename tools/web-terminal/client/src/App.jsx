import { useState, useEffect } from 'react';
import Aurora from './components/Aurora';
import GlitchText from './components/GlitchText';
import ShinyText from './components/ShinyText';
import Terminal from './components/Terminal';
import Cursor from './components/Cursor';
import Ribbons from './components/Ribbons';
import SpotlightCard from './components/SpotlightCard';
import './App.css';

const WS_URL = `ws://${window.location.hostname}:3001`;

export default function App() {
  const [connStatus, setConnStatus] = useState('connecting');
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
      setUptime(s => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const statusMap = {
    connected:    { color: '#4ade80', label: 'LIVE', pulse: true },
    connecting:   { color: '#facc15', label: 'CONNECTING', pulse: true },
    disconnected: { color: '#f87171', label: 'OFFLINE', pulse: false },
    error:        { color: '#f87171', label: 'ERROR', pulse: false },
  };
  const st = statusMap[connStatus] || statusMap.disconnected;

  return (
    <div className="app">
      {/* Custom cursor */}
      <Cursor />

      {/* Ribbon cursor trails */}
      <Ribbons
        colors={['#a78bfa', '#7c3aed', '#6d28d9']}
        baseThickness={20}
        pointCount={60}
        enableFade
      />

      {/* Animated Aurora background */}
      <div className="aurora-wrap">
        <Aurora colorStops={['#1e0533', '#4c1d95', '#0f172a']} amplitude={1.4} blend={0.7} speed={0.35} />
      </div>

      {/* Scanlines overlay */}
      <div className="scanlines" />
      {/* Noise overlay */}
      <div className="noise" />

      {/* Main layout */}
      <div className="app-layout">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-brand">
            <div className="brand-icon">
              <span className="brand-bracket">[</span>
              <span className="brand-symbol">⬡</span>
              <span className="brand-bracket">]</span>
            </div>
            <div className="brand-text">
              <GlitchText speed={0.6} enableShadows enableOnHover className="brand-title">
                Hazem&apos;s Terminal
              </GlitchText>
              <div className="brand-sub">
                <ShinyText text="v2.0 · WSL2 · Node PTY" speed={5} color="#475569" shineColor="#94a3b8" spread={80} />
              </div>
            </div>
          </div>

          <div className="header-center">
            <div className="hud-grid">
              <div className="hud-item">
                <span className="hud-label">STATUS</span>
                <span className="hud-value" style={{ color: st.color }}>
                  {st.pulse && <span className="pulse-dot" style={{ background: st.color }} />}
                  {st.label}
                </span>
              </div>
              <div className="hud-sep" />
              <div className="hud-item">
                <span className="hud-label">UPTIME</span>
                <span className="hud-value mono">{fmt(uptime)}</span>
              </div>
              <div className="hud-sep" />
              <div className="hud-item">
                <span className="hud-label">TIME</span>
                <span className="hud-value mono">{time}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="corner-badge">
              <ShinyText text="● WSL2 LINUX" speed={4} color="#7c3aed" shineColor="#a78bfa" spread={60} />
            </div>
          </div>
        </header>

        {/* ── Terminal ── */}
        <main className="app-main">
          <SpotlightCard className="terminal-spotlight" spotlightColor="rgba(124, 58, 237, 0.12)">
            <div className="terminal-window">

              {/* Corner decorations */}
              <div className="corner tl" />
              <div className="corner tr" />
              <div className="corner bl" />
              <div className="corner br" />

              {/* Title bar */}
              <div className="terminal-bar">
                <div className="traffic-lights">
                  <span className="tl-dot red" />
                  <span className="tl-dot yellow" />
                  <span className="tl-dot green" />
                </div>
                <div className="bar-title">
                  <ShinyText text="bash  —  hazem@wsl2  —  ~/  " speed={6} color="#64748b" shineColor="#94a3b8" spread={120} />
                </div>
                <div className="bar-right">
                  <span className="bar-tag">PTY</span>
                  <span className="bar-tag" style={{ color: st.color }}>●</span>
                </div>
              </div>

              {/* xterm.js */}
              <Terminal wsUrl={WS_URL} onStatusChange={setConnStatus} />
            </div>
          </SpotlightCard>
        </main>

        {/* ── Footer ── */}
        <footer className="app-footer">
          <div className="footer-line" />
          <div className="footer-content">
            <ShinyText text="⚡ Powered by React Bits · xterm.js · node-pty · OGL WebGL" speed={8} color="#1e293b" shineColor="#475569" spread={160} />
            <ShinyText text="© 2026 Hazem" speed={10} color="#1e293b" shineColor="#475569" spread={80} />
          </div>
        </footer>
      </div>
    </div>
  );
}
