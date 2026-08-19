import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function AttackMap({ attacks }) {
  const mapped = attacks.filter((a) => a.latitude && a.longitude);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ flex: 1, height: "100%", background: "#0d0d1a" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {mapped.map((attack, i) => (
        <CircleMarker
          key={i}
          center={[attack.latitude, attack.longitude]}
          radius={6}
          pathOptions={{
            color: "#e94560",
            fillColor: "#e94560",
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#000" }}>
              <b>IP:</b> {attack.ip}<br />
              <b>Country:</b> {attack.country}<br />
              <b>City:</b> {attack.city || "-"}<br />
              <b>User:</b> {attack.username}<br />
              <b>Pass:</b> {attack.password}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}