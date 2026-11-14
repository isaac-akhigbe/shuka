// Every northern state at its capital, sized by how often the first rains failed (2000 to 2026).
// A snapshot of Shuka's NASA POWER analysis, so the landing page works even if the API is down.
const STATES: { name: string; lat: number; lon: number; risk: string; rate: number; side?: boolean }[] = [
  { name: "Kano", lat: 12.0, lon: 8.52, risk: "medium", rate: 0.27 },
  { name: "Kaduna", lat: 10.52, lon: 7.44, risk: "low", rate: 0.13 },
  { name: "Katsina", lat: 12.99, lon: 7.6, risk: "medium", rate: 0.23 },
  { name: "Sokoto", lat: 13.06, lon: 5.24, risk: "medium", rate: 0.15 },
  { name: "Zamfara", lat: 12.16, lon: 6.66, risk: "medium", rate: 0.15 },
  { name: "Kebbi", lat: 12.45, lon: 4.2, risk: "low", rate: 0.08 },
  { name: "Jigawa", lat: 11.76, lon: 9.34, risk: "medium", rate: 0.21 },
  { name: "Bauchi", lat: 10.31, lon: 9.84, risk: "medium", rate: 0.17 },
  { name: "Gombe", lat: 10.29, lon: 11.17, risk: "medium", rate: 0.16 },
  { name: "Yobe", lat: 11.75, lon: 11.96, risk: "low", rate: 0.12 },
  { name: "Borno", lat: 11.85, lon: 13.16, risk: "medium", rate: 0.22 },
  { name: "Adamawa", lat: 9.21, lon: 12.48, risk: "low", rate: 0.11 },
  { name: "Taraba", lat: 8.89, lon: 11.36, risk: "low", rate: 0.15 },
  { name: "Plateau", lat: 9.9, lon: 8.86, risk: "medium", rate: 0.29 },
  { name: "Nasarawa", lat: 8.49, lon: 8.52, risk: "high", rate: 0.32, side: true },
  { name: "Benue", lat: 7.73, lon: 8.54, risk: "medium", rate: 0.23 },
  { name: "Kogi", lat: 7.8, lon: 6.74, risk: "low", rate: 0.11 },
  { name: "Kwara", lat: 8.5, lon: 4.55, risk: "low", rate: 0 },
  { name: "Niger", lat: 9.61, lon: 6.56, risk: "low", rate: 0.11 },
  { name: "FCT", lat: 9.06, lon: 7.49, risk: "medium", rate: 0.22 },
];

const COLORS: Record<string, string> = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };

const W = 800;
const H = 500;
const x = (lon: number) => 50 + ((lon - 3.7) / 10) * (W - 100);
const y = (lat: number) => 40 + ((13.5 - lat) / 6.2) * (H - 90);

export default function StateBubbleMap() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of false start risk across northern Nigeria">
      {/* latitude guide lines */}
      {[8, 10, 12].map((lat) => (
        <g key={lat}>
          <line x1={20} x2={W - 20} y1={y(lat)} y2={y(lat)} stroke="#14201a" strokeOpacity={0.08} strokeDasharray="4 6" />
          <text x={W - 22} y={y(lat) - 6} textAnchor="end" fontSize={11} fill="#a1a1aa">
            {lat}°N
          </text>
        </g>
      ))}
      {STATES.map((s) => {
        const r = 9 + s.rate * 62;
        const c = COLORS[s.risk];
        return (
          <g key={s.name}>
            <title>{`${s.name}: first rains failed in ${Math.round(s.rate * 100)}% of seasons`}</title>
            {s.risk === "high" && <circle cx={x(s.lon)} cy={y(s.lat)} r={r} fill={c} className="ping-ring" />}
            <circle cx={x(s.lon)} cy={y(s.lat)} r={r} fill={c} fillOpacity={0.22} stroke={c} strokeWidth={2} />
            <circle cx={x(s.lon)} cy={y(s.lat)} r={3} fill={c} />
            <text
              x={s.side ? x(s.lon) + r + 8 : x(s.lon)}
              y={s.side ? y(s.lat) - 2 : y(s.lat) + r + 15}
              textAnchor={s.side ? "start" : "middle"}
              fontSize={13}
              fontWeight={600}
              fill="#27272a"
            >
              {s.name}
            </text>
            <text
              x={s.side ? x(s.lon) + r + 8 : x(s.lon)}
              y={s.side ? y(s.lat) + 13 : y(s.lat) + r + 30}
              textAnchor={s.side ? "start" : "middle"}
              fontSize={11}
              fill={c}
              fontWeight={600}
            >
              {Math.round(s.rate * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
