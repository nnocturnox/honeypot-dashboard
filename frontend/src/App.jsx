import { useState, useEffect, useRef } from "react";
import AttackMap from "./components/AttackMap";
import StatsBar from "./components/StatsBar";
import AttackFeed from "./components/AttackFeed";
import Charts from "./components/Charts"; // 1. YENİ IMPORT

const BACKEND = "http://localhost:8000";

export default function App() {
  const [attacks, setAttacks] = useState([]);
  const [view, setView] = useState("map"); // 2. YENİ STATE ("map" veya "charts")
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e94560" }}>
          🛡️ SSH Honeypot Dashboard
          <span style={{ fontSize: "12px", color: "#888", marginLeft: "12px" }}>
            {attacks.length} events logged
          </span>
        </div>

        {/* 3. YENİ: Sekme Geçiş Butonları */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "map", label: "🗺️ Map View" },
            { id: "charts", label: "📊 Analytics" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                border: "1px solid #0f3460",
                fontSize: "12px",
                background: view === id ? "#e94560" : "transparent",
                color: view === id ? "#fff" : "#888",
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <StatsBar attacks={attacks} />

      {/* 4. GÜNCELLENEN: Harita veya Grafik Görünümü */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "auto" }}>
          {view === "map" ? (
            <AttackMap attacks={attacks} />
          ) : (
            <Charts attacks={attacks} />
          )}
        </div>
        <AttackFeed attacks={attacks} />
      </div>
    </div>
  );
}