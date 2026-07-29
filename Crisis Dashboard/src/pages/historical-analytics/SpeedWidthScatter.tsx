import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ReferenceArea } from "recharts";
import type { HistoricalCME } from "./mockData";

interface Props {
  events: HistoricalCME[];
}

// ── Severity → color mapping ─────────────────────────────────────────────────
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high":     return "#f97316";
    case "medium":   return "#eab308";
    default:         return "#3b82f6";
  }
};

// ── Kp Index → bubble radius: r = max(3, kpIndex * 2.2) ─────────────────────
const getRadius = (kpIndex: number): number => Math.max(3, kpIndex * 2.2);

// ── Halo CME flag: angularWidth ≥ 180 ────────────────────────────────────────
const isHalo = (entry: HistoricalCME): boolean => entry.angularWidth >= 180;

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HistoricalCME;
  const halo = isHalo(d);
  return (
    <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-2xl backdrop-blur-sm text-xs font-mono">
      <p className={`font-bold mb-1 ${halo ? "text-rose-400" : "text-slate-200"}`}>
        {halo ? "⚡ HALO CME" : d.type}
      </p>
      <p className="text-slate-400 mb-2 tabular-nums">{new Date(d.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Transit Velocity</span>
          <span className="text-cyan-400 tabular-nums">{d.speed} km/s</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Angular Width</span>
          <span className="text-amber-400 tabular-nums">{d.angularWidth}°</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Kp Index</span>
          <span className="text-rose-400 tabular-nums font-bold">{d.kpIndex.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Severity</span>
          <span className={`uppercase font-bold ${
            d.severity === "critical" ? "text-red-400" :
            d.severity === "high"     ? "text-orange-400" :
            d.severity === "medium"   ? "text-yellow-400" : "text-blue-400"
          }`}>{d.severity}</span>
        </div>
      </div>
    </div>
  );
};

// ── Legend pill ───────────────────────────────────────────────────────────────
const LegendPill = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ background: color }} />
    <span className="text-[10px] text-slate-400 font-mono">{label}</span>
  </div>
);

const axisTick = { fill: "#94a3b8", fontSize: 12, fontFamily: "monospace" };

export default function SpeedWidthScatter({ events }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex-1 flex flex-col gap-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Kinematics Correlation</h2>
          <p className="text-slate-400 text-sm">CME Transit Velocity vs. Angular Width · Bubble = Kp Index magnitude</p>
        </div>
        {/* ── Legend ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <LegendPill color="#ef4444" label="Critical (Kp ≥ 8)" />
          <LegendPill color="#f97316" label="High (Kp 6–7)" />
          <LegendPill color="#eab308" label="Medium (Kp 4–5)" />
          <LegendPill color="#3b82f6" label="Low (Kp < 4)" />
        </div>
      </div>

      {/* ── Chart: aspect-ratio locked container ──────────────────────── */}
      <div className="w-full aspect-video max-h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, left: -10, bottom: 28 }}>
            {/* Danger zone annotation: width ≥ 180°, speed ≥ 800 km/s */}
            <ReferenceArea
              x1={180} x2={360}
              y1={800} y2={2000}
              fill="#ef4444"
              fillOpacity={0.05}
              strokeOpacity={0}
            />

            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" />

            <XAxis
              type="number"
              dataKey="angularWidth"
              name="Angular Width"
              unit="°"
              domain={[0, 360]}
              tick={axisTick}
              stroke="rgba(255,255,255,0.08)"
              tickLine={false}
              label={{ value: "Angular Width (deg)", position: "insideBottom", offset: -18, fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
            />

            <YAxis
              type="number"
              dataKey="speed"
              name="Transit Velocity"
              unit=" km/s"
              domain={[200, 2200]}
              tick={axisTick}
              stroke="rgba(255,255,255,0.08)"
              tickLine={false}
              axisLine={false}
              label={{ value: "Transit Velocity (km/s)", angle: -90, position: "insideLeft", offset: 14, fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
            />

            {/* Halo threshold lines */}
            <ReferenceLine x={180} stroke="#f43f5e" strokeOpacity={0.3} strokeDasharray="4 4"
              label={{ value: "Halo", position: "insideTopRight", fill: "#f43f5e", fontSize: 9, fontFamily: "monospace" }} />
            <ReferenceLine y={800} stroke="#f97316" strokeOpacity={0.3} strokeDasharray="4 4"
              label={{ value: "Fast", position: "insideBottomRight", fill: "#f97316", fontSize: 9, fontFamily: "monospace" }} />

            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }} />

            <Scatter name="CMEs" data={events}>
              {events.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getSeverityColor(entry.severity)}
                  fillOpacity={0.65}
                  stroke="#0f172a"
                  strokeWidth={1}
                  // @ts-ignore — Recharts accepts r as a prop on Cell inside ScatterChart
                  r={getRadius(entry.kpIndex)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── Danger Zone Label ─────────────────────────────────────────── */}
      <p className="text-[10px] font-mono text-rose-500/70 text-right">
        ⬢ Shaded region = Halo CME Danger Zone (width ≥ 180°, speed ≥ 800 km/s)
      </p>
    </div>
  );
}
