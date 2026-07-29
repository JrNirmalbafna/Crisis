import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getSolarParameters } from "../../services/api";
import { GlassCard } from "../../components/ui-custom/GlassCard";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import { AppDialog } from "../../components/ui-custom/AppDialog";
import { Download, Maximize2 } from "lucide-react";

// ── Combined Tooltip displaying both parameters ─────────────────────────────
const DualTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const speedVal = payload.find((p: any) => p.dataKey === "speed")?.value;
  const bzVal = payload.find((p: any) => p.dataKey === "magneticField")?.value;

  return (
    <div className="bg-[#030712]/95 border border-white/10 px-3.5 py-2.5 rounded-xl text-xs font-mono shadow-2xl backdrop-blur-md min-w-[160px]">
      <p className="text-slate-400 mb-2 pb-1.5 border-b border-white/5">
        {label ? format(new Date(label), "HH:mm 'UTC'") : ""}
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Speed:</span>
          </div>
          <span className="text-cyan-400 font-bold tabular-nums">
            {speedVal !== undefined ? Number(speedVal).toFixed(0) : "N/A"} <span className="text-slate-500 font-normal text-[10px]">km/s</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-slate-300">IMF Bz:</span>
          </div>
          <span className={`font-bold tabular-nums ${bzVal < 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {bzVal !== undefined ? (bzVal > 0 ? "+" : "") + Number(bzVal).toFixed(2) : "N/A"} <span className="text-slate-500 font-normal text-[10px]">nT</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const axisTick = { fill: "#94a3b8", fontSize: 11, fontFamily: "monospace", fontVariantNumeric: "tabular-nums" } as const;

export default function SolarParametersChart() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["solar-parameters"],
    queryFn: () => getSolarParameters(),
    staleTime: 60000,
  });

  // Clamp extreme outliers and limit density to last 30 points to prevent layout squeeze
  const safeData = (data || []).slice(-30).map((d: any) => ({
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

  const renderChart = (heightClass: string) => (
    <div className={`w-full ${heightClass}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={safeData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          
          <XAxis
            dataKey="timestamp"
            tickFormatter={(val) => format(new Date(val), "HH:mm")}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            minTickGap={45}
          />

          {/* Left Axis: Speed */}
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={["dataMin - 15", "dataMax + 15"]}
            tick={{ fill: "#22d3ee", fontSize: 10, fontFamily: "monospace" }}
            tickFormatter={(val) => Math.round(val).toString()}
            tickLine={false}
            axisLine={false}
            width={45}
          />

          {/* Right Axis: Bz */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={["dataMin - 2", "dataMax + 2"]}
            tick={{ fill: "#f43f5e", fontSize: 10, fontFamily: "monospace" }}
            tickFormatter={(val) => Number(val).toFixed(1)}
            tickLine={false}
            axisLine={false}
            width={40}
          />

          <Tooltip content={<DualTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
          
          {/* Visual Reference Guidelines */}
          <ReferenceLine yAxisId="right" y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
          <ReferenceLine 
            yAxisId="right" 
            y={-10} 
            stroke="#f43f5e" 
            strokeOpacity={0.4} 
            strokeDasharray="3 3"
            label={{ value: "Storm Warning", position: "insideTopRight", fill: "#f43f5e", fontSize: 9, fontFamily: "monospace" }}
          />

          {/* Speed Line (Left Axis) */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="speed"
            name="Speed (km/s)"
            stroke="#22d3ee"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />

          {/* Bz Line (Right Axis) */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="magneticField"
            name="Bz (nT)"
            stroke="#f43f5e"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />

          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            content={({ payload }) => (
              <div className="flex items-center justify-center gap-6 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                {payload?.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="h-full relative"
      >
        <GlassCard padding="none" className="h-full flex flex-col min-h-[350px]">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-white/[0.04] shrink-0">
            <div className="flex flex-col gap-1">
              <h3 className="text-[15px] font-semibold text-white/90 leading-none">Solar Parameters</h3>
              <p className="text-[10px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
                Speed (Cyan, Left Axis) vs. IMF Bz (Rose, Right Axis)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExport}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
                aria-label="Export Chart"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
                aria-label="View Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
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
            <div className="flex-1 p-4 flex flex-col justify-center">
              {renderChart("h-[240px]")}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Fullscreen Dialog */}
      <AppDialog
        open={isFullscreen}
        onOpenChange={setIsFullscreen}
        title="Solar Parameters Telemetry Analysis"
        description="L1 Lagrange Point Near-Real-Time Stream"
        size="fullscreen"
      >
        <div className="w-full flex-1 min-h-[60vh] h-full flex flex-col justify-center p-3">
          {renderChart("h-[480px]")}
        </div>
      </AppDialog>
    </>
  );
}
