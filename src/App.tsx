import { useState, useEffect, useRef, RefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface Pulse {
  count: number;
  timestamp: number;
  elapsed_secs: number;
}

function App() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const startBtnRef = useRef<HTMLButtonElement>(null);
  const stopBtnRef = useRef<HTMLButtonElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);

  // === EVENTS: subscribe to "pulse" emitted by the Rust background task ===
  useEffect(() => {
    const unlisten = listen<Pulse>("pulse", (event) => {
      setPulse(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Demo cycle for the recording. Cursor uses real DOM positions of the
  // buttons via getBoundingClientRect, so it always lands exactly on the
  // button regardless of layout. Remove this block in a real app.
  useEffect(() => {
    const moveTo = (ref: RefObject<HTMLElement | null>) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      // Tip near the button's TOP-LEFT so the cursor body (~30 down × 22 right)
      // lands fully inside the button rather than extending past its bottom.
      setCursor({
        x: r.left + 18,
        y: r.top + 8,
        visible: true,
      });
    };
    const moveHome = () => moveTo(homeRef);

    // Cycle is delayed ~4s so it begins AFTER the recording script's ffmpeg
    // warmup (open + 3s sleep). Each button: cursor moves, pauses ~1.5s, click,
    // pauses ~1.3s, then back home.
    const timers = [
      // Start
      setTimeout(() => moveTo(startBtnRef), 4500),
      setTimeout(() => invoke("start_pulse").then(() => setRunning(true)), 6100),
      setTimeout(moveHome, 7400),
      // Stop
      setTimeout(() => moveTo(stopBtnRef), 12500),
      setTimeout(() => invoke("stop_pulse").then(() => setRunning(false)), 14000),
      setTimeout(moveHome, 15300),
      // Reset
      setTimeout(() => moveTo(resetBtnRef), 16500),
      setTimeout(() => invoke("reset_pulse").then(() => { setRunning(false); setPulse(null); }), 17800),
      setTimeout(moveHome, 19100),
      // Start again
      setTimeout(() => moveTo(startBtnRef), 20000),
      setTimeout(() => invoke("start_pulse").then(() => setRunning(true)), 21500),
      setTimeout(moveHome, 23000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // === COMMANDS: invoke Rust functions ===
  const start = async () => { await invoke("start_pulse"); setRunning(true); };
  const stop  = async () => { await invoke("stop_pulse");  setRunning(false); };
  const reset = async () => { await invoke("reset_pulse"); setRunning(false); setPulse(null); };

  return (
    <main className="container">
      <header>
        <span className="brand">Pulse</span>
        <span className="brand-accent">Monitor</span>
        <span className="subtitle">Built with Tauri 2 · Codegiz · Built by Claude AI</span>
      </header>

      <section className="dial">
        {/* Cursor home position — top-right of the dial area */}
        <div ref={homeRef} className="cursor-home" aria-hidden />
        <div className={`heart ${running ? "beating" : ""}`}>♥</div>
        <div className="count">{pulse?.count ?? 0}</div>
        <div className="elapsed">{pulse?.elapsed_secs ?? 0}s elapsed</div>
      </section>

      <section className="controls">
        <button ref={startBtnRef} onClick={start} disabled={running} className="btn primary">Start</button>
        <button ref={stopBtnRef}  onClick={stop}  disabled={!running} className="btn">Stop</button>
        <button ref={resetBtnRef} onClick={reset} className="btn ghost">Reset</button>
      </section>

      <footer>
        Tauri 2 · #[tauri::command] · State&lt;Mutex&gt; · emit / listen
      </footer>

      {/* Demo cursor overlay — visible only during the recording demo cycle. */}
      <div
        className="demo-cursor"
        style={{
          left: cursor.x,
          top: cursor.y,
          opacity: cursor.visible ? 1 : 0,
        }}
        aria-hidden
      />
    </main>
  );
}

export default App;
