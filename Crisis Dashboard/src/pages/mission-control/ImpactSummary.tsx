import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getImpactSummary } from "../../services/api";
import { GlassCard } from "../../components/ui-custom/GlassCard";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import type { Severity } from "../../types/types";

function buildDomains(data: Awaited<ReturnType<typeof getImpactSummary>>) {
  if (!data) return {
    satelliteRisk: "low" as const,
    powerGridRisk: "low" as const,
    airlinesRisk: "low" as const,
    gpsRisk: "low" as const,
    astronautRisk: "low" as const,
  };
  return {
    satelliteRisk: data.satelliteRisk,
    powerGridRisk:  data.powerGridRisk,
    airlinesRisk:   data.airlinesRisk,
    gpsRisk:        data.gpsRisk,
    astronautRisk:  data.astronautRisk,
  };
}

const DOMAIN_LABELS: Array<{ label: string; key: keyof ReturnType<typeof buildDomains> }> = [
  { label: "Satellites",  key: "satelliteRisk" },
  { label: "Power Grid",  key: "powerGridRisk" },
  { label: "Airlines",    key: "airlinesRisk" },
  { label: "GPS / GNSS",  key: "gpsRisk" },
  { label: "Astronauts",  key: "astronautRisk" },
];

function getRiskColor(risk: Severity): string {
  switch (risk) {
    case "low":      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "medium":   return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "high":     return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    case "critical": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  }
}

export default function ImpactSummary() {
  const { data: impact, isLoading, isError, refetch } = useQuery({
    queryKey: ["impact-summary"],
    queryFn: getImpactSummary,
  });

  if (isLoading) {
    return (
      <GlassCard padding="md" className="flex flex-col h-full gap-3">
        <LoadingSkeleton variant="text" count={5} />
      </GlassCard>
    );
  }

  if (isError || !impact) {
    return <ErrorState title="Failed to load impact data" onRetry={() => refetch()} />;
  }

  const domains = buildDomains(impact);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="h-full"
    >
      <GlassCard padding="md" className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white/90 font-semibold text-[14px]">Impact Summary</h3>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
              Risk Profile
            </p>
          </div>
          <div className={`px-2 py-1 rounded-lg border flex flex-col items-center justify-center min-w-[48px] ${getRiskColor(impact.overallRisk)}`}>
            <span className="text-sm font-bold leading-none">{impact.riskScore}</span>
          </div>
        </div>

        {/* Domain Risk List */}
        <div className="flex-1 flex flex-col gap-1.5 mt-1">
          {DOMAIN_LABELS.map(({ label, key }) => {
            const riskValue = domains[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors duration-200"
              >
                <span className="text-[13px] font-medium text-white/80">{label}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border ${getRiskColor(riskValue)}`}>
                  {riskValue}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}
