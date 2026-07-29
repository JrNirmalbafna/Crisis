import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getSolarParameters } from "../../services/api";
import { ChartWrapper } from "../../components/ui-custom/ChartWrapper";

// ── Custom synchronized tooltip shown on both panels ────────────────────────
const SpeedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#030712]/95 border border-cyan-500/20 px-3 py-2 rounded-lg text-xs font-mono shadow-2xl backdrop-blur-md">
      <p className="text-slate-400 mb-1">{label ? format(new Date(label), "HH:mm 'UTC'"): ""}</p>
      <p className="text-cyan-400 font-bold tabular-nums">
        {Number(payload[0]?.value ?? 0).toFixed(0)} <span className="text-slate-500 font-normal">km/s</span>
      </p>
    </div>
  );
};

const BzTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value ?? 0);
  const isNegative = val < 0;
  return (
    <div className="bg-[#030712]/95 border border-rose-500/20 px-3 py-2 rounded-lg text-xs font-mono shadow-2xl backdrop-blur-md">
      <p className="text-slate-400 mb-1">{label ? format(new Date(label), "HH:mm 'UTC'") : ""}</p>
      <p className={`font-bold tabular-nums ${isNegative ? "text-rose-400" : "text-emerald-400"}`}>
        {val > 0 ? "+" : ""}{val.toFixed(2)} <span className="text-slate-500 font-normal">nT</span>
      </p>
      {isNegative && val < -10 && (
        <p className="text-rose-500 text-[10px] mt-0.5">⚠ Storm Coupling Active</p>
      )}
    </div>
  );
};

const axisTick = { fill: "#94a3b8", fontSize: 11, fontFamily: "monospace", fontVariantNumeric: "tabular-nums" } as const;

export default function SolarParametersChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["solar-parameters"],
    queryFn: () => getSolarParameters(),
    staleTime: 60000,
  });

  // Clamp extreme outliers: speed capped at 300–1200 km/s (sensor noise guard)
  const safeData = (data || []).map((d: any) => ({
    ...d,
    speed: d.speed != null ? Math.min(1200, Math.max(300, d.speed)) : null,
    magneticField: d.magneticField != null ? d.magneticField : null,
  }));

  const sharedXAxis = (
    <XAxis
      dataKey="timestamp"
      tickFormatter={(val) => format(new Date(val), "HH:mm")}
      tick={axisTick}
      tickLine={false}
      axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
      minTickGap={40}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="h-full relative"
    >
      <ChartWrapper
        title="Solar Parameters"
        description="L1 Telemetry — Stacked Synchronized View"
        data={data}
        isLoading={isLoading}
        isEmpty={isError || (data && data.length === 0)}
        height={200}
        className="h-full"
      >
        {/* ── Layout: CSS grid with 2 rows, shared proportional height ── */}
        <div className="grid grid-rows-[1fr_1fr] gap-3 h-full pt-1">

          {/* ── Panel 1: Solar Wind Speed ────────────────────────────── */}
          <div className="relative">
            <div className="absolute top-0 left-0 flex items-center gap-1.5 z-10">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">Speed (km/s)</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeData} margin={{ top: 18, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                {sharedXAxis}
                <YAxis
                  domain={[300, 1200]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                  width={42}
                />
                <Tooltip content={<SpeedTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="speed"
                  name="Speed (km/s)"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Panel 2: IMF Bz (nT) ─────────────────────────────────── */}
          <div className="relative">
            <div className="absolute top-0 left-0 flex items-center gap-1.5 z-10">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]" />
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">IMF Bz (nT)</span>
              <span className="text-[9px] font-mono text-slate-500 ml-2">— storm trigger at −10 nT</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeData} margin={{ top: 18, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                {sharedXAxis}
                <YAxis
                  domain={["auto", "auto"]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                  width={42}
                />
                <Tooltip content={<BzTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                {/* Zero-line reference */}
                <ReferenceLine y={0} stroke="#e2e8f0" strokeOpacity={0.15} strokeDasharray="4 4" />
                {/* Storm-threshold reference at Bz = -10 nT */}
                <ReferenceLine y={-10} stroke="#f43f5e" strokeOpacity={0.4} strokeDasharray="3 3"
                  label={{ value: "G-storm", position: "insideTopRight", fill: "#f43f5e", fontSize: 9, fontFamily: "monospace" }}
                />
                <Line
                  type="monotone"
                  dataKey="magneticField"
                  name="Bz (nT)"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartWrapper>
    </motion.div>
  );
}
