import React from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "../../utils";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  subtext?: string;
  status?: "success" | "warning" | "critical" | "neutral";
  className?: string;
}

export function StatCard({ icon: Icon, label, value, subtext, status = "neutral", className }: StatCardProps) {
  const statusConfig = {
    success:  { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    warning:  { color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
    critical: { color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/20" },
    neutral:  { color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20" },
  };

  const config = statusConfig[status];

  return (
    <GlassCard hover padding="sm" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50">{label}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", config.bg, config.border)}>
          <Icon className={cn("w-3.5 h-3.5", config.color)} strokeWidth={2} />
        </div>
      </div>
      
      <div className="mt-1">
        <p className="text-[17px] font-semibold text-white/90 leading-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-[10px] text-white/30 font-mono mt-1 uppercase tracking-wider">
            {subtext}
          </p>
        )}
      </div>
    </GlassCard>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { StatCard } from "@/components/ui-custom/StatCard";
// import { Activity } from "lucide-react";
// <StatCard icon={Activity} label="Status" value="Nominal" status="success" />
