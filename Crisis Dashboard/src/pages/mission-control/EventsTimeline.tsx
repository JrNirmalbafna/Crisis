import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getRecentEvents } from "../../services/api";
import {
  Activity, Zap, Wind, Navigation, Asterisk, CalendarDays,
  Sparkles, Orbit, ShieldCheck, Clock, Gauge, SatelliteDish
} from "lucide-react";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import { EmptyState } from "../../components/ui-custom/EmptyState";
import { GlassCard } from "../../components/ui-custom/GlassCard";

// ── Badge & Cosmic Config ─────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  icon: any; color: string; bg: string; border: string; glow: string; dot: string;
}> = {
  "Halo CME":    { icon: Asterisk,   color: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/30",   glow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",  dot: "bg-rose-400" },
  "Solar Flare": { icon: Zap,        color: "text-amber-400",  bg: "bg-amber-500/15",  border: "border-amber-500/30",  glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]", dot: "bg-amber-400" },
  "Solar Wind":  { icon: Wind,       color: "text-cyan-400",   bg: "bg-cyan-500/15",   border: "border-cyan-500/30",   glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)]",  dot: "bg-cyan-400" },
  "SEP":         { icon: Activity,   color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30", glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]", dot: "bg-purple-400" },
  "CIR":         { icon: Navigation, color: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/30",   glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",  dot: "bg-blue-400" },
};

export default function EventsTimeline() {
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["recent-events"],
    queryFn: () => getRecentEvents(10),
    refetchInterval: 30000,
  });

  return (
    <GlassCard
      padding="none"
      className="flex flex-col h-full bg-gradient-to-br from-slate-900/95 via-slate-900/60 to-indigo-950/40 border border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.5)]"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/10 border border-cyan-500/25 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white/95 font-semibold text-[15px] tracking-tight leading-none">
              Heliospheric Event Chronicle
            </h3>
            <p className="text-[10px] text-white/35 font-mono tracking-[0.12em] uppercase mt-1">
              L1 Spacecraft · SOHO · GOES-18 · SDO · NOAA SWPC Catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Event count badge */}
          {events && events.length > 0 && (
            <span className="text-[11px] text-white/50 font-mono">
              {events.length} events
            </span>
          )}
          <span className="text-[10px] text-cyan-300/80 font-mono uppercase bg-cyan-950/50 px-3 py-1.5 rounded-full border border-cyan-500/20 flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.08)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            LIVE STREAM
          </span>
        </div>
      </div>

      {/* ── Event Grid ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
        {isLoading && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="row" count={1} />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-5">
            <ErrorState title="Failed to load events" onRetry={() => refetch()} />
          </div>
        )}

        {!isLoading && !isError && events?.length === 0 && (
          <div className="p-5">
            <EmptyState icon={CalendarDays} title="No events recorded" description="All clear across NOAA / SWPC catalogs." />
          </div>
        )}

        {!isLoading && !isError && events && events.length > 0 && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-auto">
            {events.map((evt, i) => {
              const config = TYPE_CONFIG[evt.type] || TYPE_CONFIG["Solar Flare"];
              const Icon = config.icon;
              const dateFmt = format(new Date(evt.detectedAt), "MMM dd, yyyy");
              const timeFmt = format(new Date(evt.detectedAt), "HH:mm 'UTC'");
              const timeAgo = formatDistanceToNow(new Date(evt.detectedAt), { addSuffix: true });

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.04 * i, duration: 0.3, ease: "easeOut" }}
                  className="group"
                >
                  <div
                    className={`
                      h-full p-4 rounded-2xl flex flex-col gap-3
                      bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent
                      border border-white/[0.07]
                      hover:border-white/[0.14] hover:bg-white/[0.05]
                      hover:${config.glow}
                      transition-all duration-300 cursor-default
                    `}
                  >
                    {/* ── Top: Icon + Type Badge + Status ──── */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* Icon glowing orb */}
                        <div className={`p-2 rounded-xl ${config.bg} ${config.border} border ${config.glow} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${config.color}`}>
                            {evt.type}
                          </span>
                          <span className="text-[10px] text-white/35 font-mono truncate">
                            {dateFmt}
                          </span>
                        </div>
                      </div>

                      {/* Active / Passed badge */}
                      {evt.status === "active" ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/[0.05] text-white/30 border border-white/[0.08] flex items-center gap-1">
                          <Orbit className="w-2.5 h-2.5" />
                          PAST
                        </span>
                      )}
                    </div>

                    {/* ── Description ───────────────────────── */}
                    <p className="text-[12px] text-white/70 leading-relaxed font-normal line-clamp-3 flex-1">
                      {evt.description}
                    </p>

                    {/* ── Metadata Pills ────────────────────── */}
                    <div className="flex flex-col gap-1.5 pt-2.5 border-t border-white/[0.05]">
                      {/* Velocity row */}
                      {(evt.speed ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3 h-3 text-cyan-400/60 shrink-0" />
                          <span className="text-[10px] font-mono text-cyan-300/80">
                            {evt.speed?.toLocaleString()} km/s
                          </span>
                        </div>
                      )}
                      {/* Source row */}
                      <div className="flex items-start gap-1.5">
                        <SatelliteDish className="w-3 h-3 text-indigo-400/60 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-mono text-white/40 leading-snug">
                          {evt.sources.join(" · ")}
                        </span>
                      </div>
                      {/* Time + Confidence row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/25 shrink-0" />
                          <span className="text-[10px] font-mono text-white/30">
                            {timeFmt} · {timeAgo}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300/80">
                          <ShieldCheck className="w-3 h-3 text-emerald-400/70" />
                          {(evt.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
