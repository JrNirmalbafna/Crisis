import { motion } from "framer-motion";
import { cn } from "../../utils";

interface MetricGaugeProps {
  value: number; // 0 to 100
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MetricGauge({ value, label, size = "md", className }: MetricGaugeProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const sizeMap = {
    sm: { svg: "w-12 h-12", text: "text-[10px]", stroke: 6 },
    md: { svg: "w-16 h-16", text: "text-xs", stroke: 8 },
    lg: { svg: "w-24 h-24", text: "text-lg", stroke: 10 },
  };

  const { svg, text, stroke } = sizeMap[size];

  // Determine color based on value
  const getColor = (val: number) => {
    if (val >= 80) return "#34d399"; // emerald-400
    if (val >= 50) return "#fbbf24"; // amber-400
    return "#f87171"; // rose-400
  };

  const color = getColor(value);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", svg)}>
        {/* Background Circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />
          {/* Animated Value Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>
        <span className={cn("font-bold text-white/90 font-mono relative z-10", text)}>
          {value}%
        </span>
      </div>
      {label && <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{label}</span>}
    </div>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { MetricGauge } from "@/components/ui-custom/MetricGauge";
// <MetricGauge value={92} label="AI Conf" size="md" />
