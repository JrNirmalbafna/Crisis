import { motion } from "framer-motion";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getRecentEvents } from "../../services/api";
import { Activity, Zap, Wind, Navigation, Asterisk, CalendarDays } from "lucide-react";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import { EmptyState } from "../../components/ui-custom/EmptyState";
import { GlassCard } from "../../components/ui-custom/GlassCard";
import type { CMEEventType } from "../../types/types";

// ── Badge & Icon Config ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  "Halo CME":    { icon: Asterisk,  color: "text-rose-400",   bg: "bg-rose-400/10" },
  "Solar Flare": { icon: Zap,       color: "text-amber-400",  bg: "bg-amber-400/10" },
  "Solar Wind":  { icon: Wind,      color: "text-cyan-400",   bg: "bg-cyan-400/10" },
  "SEP":         { icon: Activity,  color: "text-purple-400", bg: "bg-purple-400/10" },
  "CIR":         { icon: Navigation,color: "text-blue-400",   bg: "bg-blue-400/10" },
};

export default function EventsTimeline() {
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["recent-events"],
    queryFn: () => getRecentEvents(10)
  });

  return (
    <GlassCard padding="none" className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/[0.04] shrink-0 flex items-center justify-between">
        <h3 className="text-white/90 font-semibold text-[15px]">Recent Events</h3>
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
          Last 72h
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: "none" }}>
        {isLoading && (
          <div className="flex flex-col gap-6">
            <LoadingSkeleton variant="row" count={3} />
          </div>
        )}
        
        {isError && (
          <ErrorState title="Failed to load events" onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && events?.length === 0 && (
          <EmptyState icon={CalendarDays} title="No events recorded" description="All clear in the last 72 hours." />
        )}

        {!isLoading && !isError && events?.map((evt, i) => {
          const config = TYPE_CONFIG[evt.type] || TYPE_CONFIG["Solar Flare"];
          const Icon = config.icon;
          const timeFormatted = format(new Date(evt.detectedAt), "HH:mm 'UTC'");

          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              className="relative pl-6 before:absolute before:left-[11px] before:top-6 before:bottom-[-20px] before:w-px before:bg-white/10 last:before:hidden"
            >
              {/* Timeline Dot */}
              <div
                className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center ${config.bg} border border-white/5`}
              >
                <Icon className={`w-2.5 h-2.5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40 font-mono font-medium">
                      {timeFormatted}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${config.color} ${config.bg}`}
                    >
                      {evt.type}
                    </span>
                  </div>
                  {evt.status === "active" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                
                <p className="text-[13px] text-white/80 leading-snug mt-0.5">
                  {evt.description}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white/30 font-mono uppercase">
                    Source: {evt.sources.join(", ")}
                  </span>
                  <span className="text-[10px] text-white/30 font-mono uppercase">
                    Conf: {(evt.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
