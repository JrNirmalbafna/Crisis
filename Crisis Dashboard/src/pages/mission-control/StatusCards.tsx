import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, BrainCircuit, CheckCircle2, ShieldAlert, Signal, ActivitySquare } from "lucide-react";
import { getMissionStatus, getSystemStatusOverview } from "../../services/api";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";
import { StatCard } from "../../components/ui-custom/StatCard";
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
          <LoadingSkeleton key={i} variant="card" className="h-[90px]" />
        ))}
      </div>
    );
  }

  if (isErrorMission || isErrorOverview) {
    return <ErrorState title="Failed to load telemetry" onRetry={() => refetchOverview()} className="h-[90px]" />;
  }

  if (!missionStatus || !systemOverview) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
        <StatCard
          icon={Activity}
          label="CME Status"
          value={isOverrideEnabled ? `MANUAL: ${manualThreatLevel}` : systemOverview.statusText}
          subtext={isOverrideEnabled ? "Operator Override Active" : "Last checked 2m ago"}
          status={isOverrideEnabled ? (manualThreatLevel === "Normal" ? "success" : "critical") : (systemOverview.statusColor === "green" ? "success" : systemOverview.statusColor === "amber" ? "warning" : "critical")}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
        <StatCard
          icon={BrainCircuit}
          label="AI Confidence"
          value={`${systemOverview.aiConfidence}%`}
          subtext="Consensus Model"
          status="neutral"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        <StatCard
          icon={CheckCircle2}
          label="Physics Validation"
          value={systemOverview.physicsValidation}
          subtext="Constraints met"
          status={systemOverview.physicsValidation === "Passed" ? "success" : "critical"}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
        <StatCard
          icon={Signal}
          label="Data Quality"
          value={`${systemOverview.dataQuality}%`}
          subtext="Telemetry optimal"
          status={systemOverview.dataQuality > 90 ? "neutral" : "warning"}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
        <StatCard
          icon={ShieldAlert}
          label="Alert Level"
          value={isOverrideEnabled ? manualThreatLevel.toUpperCase() : systemOverview.alertLevel}
          subtext={isOverrideEnabled ? "Forced by Operator" : "Action required"}
          status={isOverrideEnabled ? (manualThreatLevel === "Normal" ? "success" : "critical") : (systemOverview.alertLevel === "High" || systemOverview.alertLevel === "Extreme" ? "critical" : "warning")}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
        <StatCard
          icon={ActivitySquare}
          label="Mission Health"
          value={missionStatus.systemHealth === "healthy" ? "Nominal" : "Degraded"}
          subtext={`${missionStatus.activeSatellites}/${missionStatus.totalSatellites} Sats Online`}
          status={missionStatus.systemHealth === "healthy" ? "success" : "critical"}
        />
      </motion.div>
    </div>
  );
}
