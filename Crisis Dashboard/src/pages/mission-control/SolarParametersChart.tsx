import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getSolarParameters } from "../../services/api";
import { GlassCard } from "../../components/ui-custom/GlassCard";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import { Download } from "lucide-react";

// ── Custom synchronized tooltip shown on both panels ────────────────────────
const SpeedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#030712]/95 border border-cyan-500/20 px-3 py-2 rounded-lg text-xs font-mono shadow-2xl backdrop-blur-md">
      <p className="text-slate-400 mb-1">{label ? format(new Date(label), "HH:mm 'UTC'") : ""}</p>
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
  const { data, isLoading, isError, refetch } = useQuery({
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

  const handleExport = () => {
    if (!safeData || safeData.length === 0) return;
    const headers = "Timestamp,Speed (km/s),Bz (nT)";
    const rows = safeData.map(row => 
      `${row.timestamp},${row.speed ?? ""},${row.magneticField ?? ""}`
    ).join("\n");
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `solar_parameters_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <GlassCard padding="none" className="h-full flex flex-col min-h-[300px]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.04] shrink-0">
          <div className="flex flex-col gap-1">
            <h3 className="text-[15px] font-semibold text-white/90 leading-none">Solar Parameters</h3>
            <p className="text-[11px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
              L1 Telemetry · Dynamic Auto-Scaled View
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
              aria-label="Export Chart"
            >
              <Download className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              LIVE
            </span>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex-1 p-5">
            <LoadingSkeleton variant="chart" className="h-full" />
          </div>
        ) : isError || safeData.length === 0 ? (
          <div className="flex-1 p-5">
            <ErrorState title="Failed to load telemetry" onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="flex-1 p-5 grid grid-rows-[1fr_1fr] gap-4">
            {/* Panel 1: Solar Wind Speed */}
            <div className="relative h-full w-full">
              <div className="absolute top-0 left-0 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">Speed (km/s)</span>
              </div>
              <div className="w-full h-full pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    {sharedXAxis}
                    <YAxis
                      domain={["dataMin - 15", "dataMax + 15"]}
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
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
            </div>

            {/* Panel 2: IMF Bz (nT) */}
            <div className="relative h-full w-full">
              <div className="absolute top-0 left-0 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]" />
                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">IMF Bz (nT)</span>
              </div>
              <div className="w-full h-full pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    {sharedXAxis}
                    <YAxis
                      domain={["dataMin - 2", "dataMax + 2"]}
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<BzTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                    <ReferenceLine y={0} stroke="#e2e8f0" strokeOpacity={0.15} strokeDasharray="4 4" />
                    <ReferenceLine y={-10} stroke="#f43f5e" strokeOpacity={0.4} strokeDasharray="3 3"
                      label={{ value: "Storm", position: "insideTopRight", fill: "#f43f5e", fontSize: 9, fontFamily: "monospace" }}
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
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
