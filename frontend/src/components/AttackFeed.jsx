export default function AttackFeed({ attacks }) {
  return (
    <div
      style={{
        width: "320px",
        background: "#1a1a2e",
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #333",
          color: "#e94560",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        🔴 LIVE ATTACK STREAM
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {attacks.slice(0, 50).map((a, i) => (
          <div
            key={i}
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid #222",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            <div style={{ color: "#e94560", fontWeight: "bold" }}>{a.ip}</div>
            <div style={{ color: "#888", margin: "2px 0" }}>
              {a.country || "Unknown"} {a.city ? `/ ${a.city}` : ""}
            </div>
            <div style={{ color: "#555" }}>
              user: <span style={{ color: "#aaa" }}>{a.username}</span> | pass:{" "}
              <span style={{ color: "#aaa" }}>{a.password}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}