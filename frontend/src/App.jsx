import { useState, useEffect, useRef } from "react";
import AttackMap from "./components/AttackMap";
import StatsBar from "./components/StatsBar";
import AttackFeed from "./components/AttackFeed";

const BACKEND = "http://localhost:8000";

export default function App() {
  const [attacks, setAttacks] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // 1. Fetch initial attack history on mount
    fetch(`${BACKEND}/attacks`)
      .then((r) => r.json())
      .then((data) => setAttacks(data))
      .catch((err) => console.error("API fetch error:", err));

    // 2. Establish WebSocket connection for real-time attack stream
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const attack = JSON.parse(event.data);
        // Prepend incoming attack to state
        setAttacks((prev) => [attack, ...prev]);
      } catch (err) {
        console.error("WS Parse error:", err);
      }
    };

    ws.onclose = () => console.log("WebSocket disconnected");

    return () => ws.close();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0d0d1a",
        color: "#fff",
        fontFamily: "monospace",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: "12px 20px",
          background: "#1a1a2e",
          borderBottom: "1px solid #333",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#e94560",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>🛡️ SSH Honeypot Dashboard</span>
        <span style={{ fontSize: "12px", color: "#888" }}>
          {attacks.length} events logged
        </span>
      </div>

      {/* Stats Summary Bar */}
      <StatsBar attacks={attacks} />

      {/* Main Map & Live Attack Stream */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <AttackMap attacks={attacks} />
        <AttackFeed attacks={attacks} />
      </div>
    </div>
  );
}