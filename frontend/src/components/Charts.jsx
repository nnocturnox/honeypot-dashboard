import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#e94560", "#0f3460", "#533483", "#2ecc71", "#f39c12", "#1abc9c"];

const darkCard = {
  background: "#16213e",
  border: "1px solid #0f3460",
  borderRadius: "8px",
  padding: "16px",
};

const labelStyle = {
  color: "#888",
  fontSize: "12px",
  marginBottom: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// ── Hourly attack metrics ──────────────────────────────────────
function prepareHourly(attacks) {
  const counts = {};
  attacks.forEach((a) => {
    const d = new Date(a.timestamp);
    const key = `${String(d.getHours()).padStart(2, "0")}:00`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, count]) => ({ hour, count }));
}

// ── Top attacking countries ─────────────────────────────────────
function prepareCountries(attacks) {
  const counts = {};
  attacks.forEach((a) => {
    if (a.country) counts[a.country] = (counts[a.country] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, count]) => ({ country, count }));
}

// ── Top targeted passwords ───────────────────────────────────────
function preparePasswords(attacks) {
  const counts = {};
  attacks.forEach((a) => {
    if (a.password) counts[a.password] = (counts[a.password] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([password, count]) => ({ password, count }));
}

// ── Protocol distribution ────────────────────────────────────────
function prepareProtocols(attacks) {
  const counts = {};
  attacks.forEach((a) => {
    const p = a.protocol || "SSH";
    counts[p] = (counts[p] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

// ── Custom tooltip component ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1a2e",
        border: "1px solid #e94560",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "12px",
      }}
    >
      <div style={{ color: "#888" }}>{label}</div>
      <div style={{ color: "#e94560", fontWeight: "bold" }}>
        {payload[0].value} attacks
      </div>
    </div>
  );
};

export default function Charts({ attacks }) {
  const hourly = prepareHourly(attacks);
  const countries = prepareCountries(attacks);
  const passwords = preparePasswords(attacks);
  const protocols = prepareProtocols(attacks);

  if (attacks.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#555" }}>
        No attack metrics available yet. Awaiting events...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "auto auto",
        gap: "16px",
        padding: "16px",
        background: "#0d0d1a",
      }}
    >
      {/* 1. Hourly Attack Trend - Full Width */}
      <div style={{ ...darkCard, gridColumn: "1 / -1" }}>
        <div style={labelStyle}>Hourly Attack Distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={hourly}>
            <XAxis dataKey="hour" stroke="#555" tick={{ fill: "#888", fontSize: 11 }} />
            <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#e94560"
              strokeWidth={2}
              dot={{ fill: "#e94560", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Top Attack Origins */}
      <div style={darkCard}>
        <div style={labelStyle}>Attacks by Country</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={countries} layout="vertical">
            <XAxis type="number" stroke="#555" tick={{ fill: "#888", fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="country"
              stroke="#555"
              tick={{ fill: "#888", fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#e94560" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Top Targeted Passwords */}
      <div style={darkCard}>
        <div style={labelStyle}>Top Targeted Passwords</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={passwords} layout="vertical">
            <XAxis type="number" stroke="#555" tick={{ fill: "#888", fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="password"
              stroke="#555"
              tick={{ fill: "#888", fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#533483" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Protocol Distribution */}
      <div
        style={{
          ...darkCard,
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div>
          <div style={labelStyle}>Protocol Distribution</div>
          <ResponsiveContainer width={200} height={180}>
            <PieChart>
              <Pie
                data={protocols}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {protocols.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid #e94560",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {protocols.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  background: COLORS[i % COLORS.length],
                }}
              />
              <span style={{ color: "#aaa" }}>{p.name}</span>
              <span style={{ color: "#555" }}>({p.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}