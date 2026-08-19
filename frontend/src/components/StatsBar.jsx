export default function StatsBar({ attacks }) {
  const total = attacks.length;
  const uniqueIPs = new Set(attacks.map((a) => a.ip)).size;

  const countryCounts = attacks.reduce((acc, a) => {
    if (a.country) acc[a.country] = (acc[a.country] || 0) + 1;
    return acc;
  }, {});
  const topCountry =
    Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const userCounts = attacks.reduce((acc, a) => {
    if (a.username) acc[a.username] = (acc[a.username] || 0) + 1;
    return acc;
  }, {});
  const topUser =
    Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "16px",
        background: "#1a1a2e",
        borderBottom: "1px solid #333",
      }}
    >
      {[
        { label: "Total Attacks", value: total },
        { label: "Unique IPs", value: uniqueIPs },
        { label: "Top Origin", value: topCountry },
        { label: "Top Targeted User", value: topUser },
      ].map(({ label, value }) => (
        <div
          key={label}
          style={{
            flex: 1,
            background: "#16213e",
            borderRadius: "8px",
            padding: "12px 16px",
            border: "1px solid #0f3460",
          }}
        >
          <div style={{ color: "#888", fontSize: "12px" }}>{label}</div>
          <div
            style={{
              color: "#e94560",
              fontSize: "22px",
              fontWeight: "bold",
              marginTop: "4px",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}