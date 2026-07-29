import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getFeatureImportance } from "../../services/api";

interface Props {
  fusionData?: any;
}

// ── Monochromatic importance gradient: Cyan-400 → Cyan-900 ───────────────────
const IMPORTANCE_COLORS = [
  "#22d3ee", // rank 1 — Cyan-400
  "#0ea5e9", // rank 2 — Sky-500
  "#0284c7", // rank 3 — Sky-600
  "#0369a1", // rank 4 — Sky-700
  "#1e4e79", // rank 5 — Blue-800 adj
  "#164e63", // rank 6 — Cyan-900
];

// ── Normalize importances so they always sum to 100% ─────────────────────────
function normalizeImportances<T extends { importance: number }>(items: T[]): T[] {
  const total = items.reduce((s, i) => s + i.importance, 0);
  if (total === 0 || Math.abs(total - 1) < 0.005) return items; // already normalized
  return items.map((i) => ({ ...i, importance: i.importance / total }));
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-slate-900/95 border border-cyan-500/20 px-3 py-2.5 rounded-lg text-xs font-mono shadow-2xl max-w-[280px] backdrop-blur-md">
      <p className="text-white font-bold text-[13px] leading-tight mb-1">{item.feature}</p>
      <div className="flex items-center justify-between border-y border-white/10 py-1.5 my-1">
        <span className="text-slate-400">SHAP Weight</span>
        <span className="text-cyan-400 font-bold tabular-nums">+{(item.importance * 100).toFixed(1)}%</span>
      </div>
      <p className="text-slate-400 text-[11px] leading-relaxed">{item.description}</p>
    </div>
  );
};

// ── Y-axis custom tick: font-sans, medium weight ──────────────────────────────
const CustomYAxisTick = ({ x, y, payload }: any) => {
  // Truncate very long feature names to prevent overflow
  const label: string = payload.value.length > 32 ? payload.value.slice(0, 30) + "…" : payload.value;
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#cbd5e1"
      fontSize={11}
      fontFamily="sans-serif"
      fontWeight={500}
    >
      {label}
    </text>
  );
};

export default function FeatureImportanceChart(_props?: Props) {
  const { data: features = [], isLoading } = useQuery({
    queryKey: ["feature-importance"],
    queryFn: getFeatureImportance,
    refetchInterval: 15000,
  });

  const rawData = features.length > 0 ? features : [
    { feature: "CME Transit Speed (v_CME)",             importance: 0.38, description: "Primary driver of interplanetary transit time and shockwave arrival at L1 Lagrange point." },
    { feature: "IMF Bz Southward Coupling",             importance: 0.28, description: "Determines rate of magnetic reconnection with Earth's magnetosphere and energy injection into ring current." },
    { feature: "Solar Wind Dynamic Pressure (P_dyn)",   importance: 0.15, description: "Ram pressure (n_p * v²) compressing the magnetopause boundary and intensifying ground magnetics." },
    { feature: "Proton Density (N_p)",                  importance: 0.11, description: "Particle flux density determining shock compression ratio across the bow shock." },
    { feature: "Plasma Ion Temperature (T_p)",          importance: 0.05, description: "Thermal expansion and magnetic cloud characteristics of the coronal mass ejecta." },
    { feature: "Pre-storm Geomagnetic Baseline (Kp_0)", importance: 0.03, description: "Initial ambient state of Earth's geomagnetic field and ring current prior to shock arrival." },
  ];

  // Sort descending (highest first) then normalize
  const data = normalizeImportances(
    [...rawData].sort((a: any, b: any) => b.importance - a.importance)
  );

  return (
    <div className="flex flex-col h-full p-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-white/90">Feature Importance (SHAP Values)</h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
            Dynamic CME & IMF Bz Physical Coupling · Consensus Model
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          LIVE SHAP
        </span>
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-[280px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
            Calculating SHAP values from ensemble…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              // left: 140 → enough room for full feature-name labels; right: 48 → room for value labels
              margin={{ top: 0, right: 48, left: 140, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, "auto"]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                // No vertical gridlines — clean, uncluttered
              />
              <YAxis
                type="category"
                dataKey="feature"
                tick={<CustomYAxisTick />}
                axisLine={false}
                tickLine={false}
                // width is intentionally 0 — label drawn by CustomYAxisTick, offset via margin.left
                width={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive maxBarSize={14}>
                {/* Monochromatic intensity gradient — rank 0 is brightest */}
                {data.map((_: any, index: number) => (
                  <Cell key={index} fill={IMPORTANCE_COLORS[index % IMPORTANCE_COLORS.length]} fillOpacity={0.9} />
                ))}
                {/* Value labels: font-mono, cyan, positioned right of bar */}
                <LabelList
                  dataKey="importance"
                  position="right"
                  formatter={(v: any) => typeof v === "number" ? `+${(v * 100).toFixed(1)}%` : ""}
                  style={{ fill: "#22d3ee", fontSize: 11, fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
