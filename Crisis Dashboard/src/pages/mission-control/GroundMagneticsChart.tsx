import { motion } from "framer-motion";
import { Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getGroundMagnetometerData } from "../../services/api";
import { ChartWrapper, ChartTooltipContent } from "../../components/ui-custom/ChartWrapper";

export default function GroundMagneticsChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ground-magnetometer"],
    queryFn: () => getGroundMagnetometerData(),
    staleTime: 60000 
  });

  const customLegend = (
    <div className="flex items-center gap-3 absolute top-4 right-4 z-10 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
        <span className="text-[10px] text-white/70 font-mono uppercase">Kp Index</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="h-full relative min-h-[300px]"
    >
      <ChartWrapper
        title="Ground Magnetics"
        description="Planetary K-index (1m)"
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
            <linearGradient id="colorKp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
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
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            domain={[0, 9]}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area 
            type="stepAfter" 
            dataKey="kpIndex" 
            name="Kp Index"
            stroke="#d946ef" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorKp)" 
            isAnimationActive={false}
          />
        </AreaChart>
        </>
      </ChartWrapper>
    </motion.div>
  );
}
