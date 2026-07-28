import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { getPredictionSummary } from "../../services/api";
import { GlassCard } from "../../components/ui-custom/GlassCard";
import { LoadingSkeleton } from "../../components/ui-custom/LoadingSkeleton";
import { ErrorState } from "../../components/ui-custom/ErrorState";

/** Maps a raw Kp index to a readable geomagnetic storm category */
function getStormCategory(kp: number): string {
  if (kp >= 9) return "G5 Extreme";
  if (kp >= 8) return "G4 Severe";
  if (kp >= 7) return "G3 Strong";
  if (kp >= 6) return "G2 Moderate";
  if (kp >= 5) return "G1 Minor";
  return "Quiet";
}

export default function PredictionSummary() {
  const { data: prediction, isLoading, isError, refetch } = useQuery({
    queryKey: ["prediction-summary"],
    queryFn: getPredictionSummary,
  });

  if (isLoading) {
    return (
      <GlassCard padding="md" className="flex flex-col h-full gap-4">
        <LoadingSkeleton variant="text" count={3} />
      </GlassCard>
    );
  }

  if (isError || !prediction) {
    return <ErrorState title="Failed to load prediction" onRetry={() => refetch()} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className="h-full"
    >
      <GlassCard padding="md" className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-white/90 font-semibold text-[14px]">Prediction Summary</h3>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
              {prediction.model}
            </p>
          </div>
          {prediction.physicsValidated && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-wide">
                Physics Validated
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-white/40 font-mono uppercase">Forecasted Peak Kp (At Arrival)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-rose-400">
                  {prediction.kpIndex?.toFixed(1) ?? "—"}
                </span>
                <span className="text-xs text-rose-400/60 font-mono font-medium">
                  {prediction.kpIndex ? getStormCategory(prediction.kpIndex) : ""}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-white/40 font-mono uppercase">Arrival</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-white/90">
                  +{prediction.horizonHours}h
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-white/5" />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-white/40 font-mono uppercase">Storm Prob.</span>
                <span className="text-sm font-semibold text-white/90">
                  {(prediction.stormProbability * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-white/40 font-mono uppercase">Uncertainty</span>
                <span className="text-sm font-semibold text-white/90">
                  ±{(prediction.uncertainty * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
