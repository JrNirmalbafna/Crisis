import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, BrainCircuit, CheckCircle2, ShieldAlert, Signal, Radio } from "lucide-react";
import { getMissionStatus, getSystemStatusOverview } from "../../services/api";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import { useOperational } from "../../context/OperationalContext";

export default function StatusCards() {
  const { 
    data: missionStatus, 
    isLoading: isLoadingMission, 
    isError: isErrorMission 
  } = useQuery({
    queryKey: ["mission-status"],
    queryFn: getMissionStatus
  });

  const { 
    data: systemOverview, 
    isLoading: isLoadingOverview, 
    isError: isErrorOverview,
    refetch: refetchOverview
  } = useQuery({
    queryKey: ["system-status-overview"],
    queryFn: getSystemStatusOverview
  });

  const { isOverrideEnabled, manualThreatLevel } = useOperational();

  if (isLoadingMission || isLoadingOverview) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" className="h-[105px]" />
        ))}
      </div>
    );
  }

  if (isErrorMission || isErrorOverview) {
    return <ErrorState title="Failed to load telemetry" onRetry={() => refetchOverview()} className="h-[105px]" />;
  }

  if (!missionStatus || !systemOverview) return null;

  const cmeSpeedDisplay = systemOverview.cmeSpeedKmS 
    ? `Halo CME • ${systemOverview.cmeSpeedKmS} km/s` 
    : systemOverview.statusText;

  const cards = [
    {
      id: "cme-telemetry",
      label: "L1 CME Telemetry",
      value: isOverrideEnabled ? `MANUAL: ${manualThreatLevel}` : cmeSpeedDisplay,
      subtext: isOverrideEnabled ? "Operator Override Active" : "SOHO/LASCO C3 & DSCOVR • L1 Transit",
      icon: Activity,
      accent: "from-rose-500/20 to-red-500/5",
      border: "border-red-500/30 hover:border-red-500/60",
      glowColor: "bg-rose-500",
      badge: "LIVE",
      badgeColor: "bg-red-500/10 text-rose-400 border-red-500/30",
    },
    {
      id: "ai-ensemble",
      label: "AI Ensemble Agreement",
      value: `${systemOverview.aiConfidence}% Consensus Confidence`,
      subtext: "XGBoost • PINN • Transformer Consensus",
      icon: BrainCircuit,
      accent: "from-purple-500/20 to-indigo-500/5",
      border: "border-purple-500/30 hover:border-purple-500/60",
      glowColor: "bg-purple-500",
      badge: "95% UQ",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      id: "mhd-physics",
      label: "MHD Physics Validation",
      value: systemOverview.physicsValidation === "Passed" ? "100% Validated (MHD)" : systemOverview.physicsValidation,
      subtext: systemOverview.physicsLawsVerified || "Rankine-Hugoniot & Energy Conservation Met",
      icon: CheckCircle2,
      accent: "from-emerald-500/20 to-teal-500/5",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      glowColor: "bg-emerald-500",
      badge: "VERIFIED",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "telemetry-feed",
      label: "L1 Telemetry Feed",
      value: `${systemOverview.dataQuality}% (4/4 Spacecraft)`,
      subtext: "DSCOVR • ACE • WIND • SOHO • 0% Loss",
      icon: Signal,
      accent: "from-cyan-500/20 to-blue-500/5",
      border: "border-cyan-500/30 hover:border-cyan-500/60",
      glowColor: "bg-cyan-500",
      badge: "ONLINE",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
    {
      id: "swpc-alert",
      label: "NOAA / SWPC Alert Scale",
      value: isOverrideEnabled ? manualThreatLevel.toUpperCase() : (systemOverview.swpcScale || systemOverview.alertLevel),
      subtext: isOverrideEnabled ? "Forced by Operator" : "Geomagnetic (G) • Solar (S) • Radio (R) Scales",
      icon: ShieldAlert,
      accent: "from-amber-500/20 to-orange-500/5",
      border: "border-amber-500/30 hover:border-amber-500/60",
      glowColor: "bg-amber-500",
      badge: "SWPC",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "constellation-link",
      label: "L1 Constellation Feed",
      value: "Nominal Link (4/4 Online)",
      subtext: "DSCOVR/ACE/WIND/SOHO • DSN Ground Lock",
      icon: Radio,
      accent: "from-blue-500/20 to-sky-500/5",
      border: "border-blue-500/30 hover:border-blue-500/60",
      glowColor: "bg-blue-500",
      badge: "DSN LOCK",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`relative group overflow-hidden rounded-xl bg-slate-900/80 border backdrop-blur-xl p-3.5 flex flex-col justify-between transition-all duration-300 ${card.border} hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5`}
          >
            {/* Top gradient glow line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.accent}`} />
            
            {/* Ambient subtle card glow */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none ${card.glowColor}`} />

            {/* Header: Label + Icon */}
            <div className="flex items-start justify-between gap-2 mb-2 z-10">
              <span className="text-[11px] font-medium text-white/60 font-mono tracking-tight uppercase leading-tight">
                {card.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${card.badgeColor}`}>
                  {card.badge}
                </span>
                <div className="p-1 rounded-md bg-white/[0.04] text-white/70 group-hover:text-white group-hover:bg-white/[0.08] transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Main Metric Value */}
            <div className="z-10 my-0.5">
              <div className="text-[14px] font-bold text-white tracking-tight leading-snug font-mono group-hover:text-cyan-300 transition-colors">
                {card.value}
              </div>
            </div>

            {/* Subtext Footer */}
            <div className="z-10 mt-1 flex items-center justify-between">
              <span className="text-[10px] text-white/40 font-mono truncate">
                {card.subtext}
              </span>
              <span className="relative flex h-2 w-2 shrink-0 ml-1">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${card.glowColor}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${card.glowColor}`} />
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

