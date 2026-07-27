import { motion } from "framer-motion";
import { Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getSolarParameters } from "../../services/api";
import { ChartWrapper, ChartTooltipContent } from "../../components/ui-custom/ChartWrapper";

export default function SolarParametersChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["solar-parameters"],
    queryFn: () => getSolarParameters(),
    staleTime: 60000 // Cache for 60 seconds to prevent lag from huge NOAA JSONs
  });

  const customLegend = (
    <div className="flex items-center gap-3 absolute top-4 right-4 z-10 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="text-[10px] text-white/70 font-mono uppercase">Speed (km/s)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        <span className="text-[10px] text-white/70 font-mono uppercase">Mag (Bz)</span>
      </div>
    </div>
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
        description="L1 Telemetry"
        data={data}
        isLoading={isLoading}
        isEmpty={isError || (data && data.length === 0)}
        height={140}
        className="h-full"
      >
        <>
          {customLegend}
          <AreaChart data={data || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(val) => format(new Date(val), "HH:mm")} 
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            yAxisId="left"
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="speed" 
            name="Speed (km/s)"
            stroke="#22d3ee" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSpeed)" 
            isAnimationActive={false}
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="magneticField" 
            name="Bz (nT)"
            stroke="#fb7185" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorMag)" 
            isAnimationActive={false}
          />
        </AreaChart>
        </>
      </ChartWrapper>
    </motion.div>
  );
}
