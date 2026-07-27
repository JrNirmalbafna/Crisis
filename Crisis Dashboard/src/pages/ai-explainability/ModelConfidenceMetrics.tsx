import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Cpu } from "lucide-react";
import { GlassCard } from "../../components/ui-custom/GlassCard";
import type { PredictionResult } from "../../types/types";

interface Props {
  prediction: PredictionResult | null;
}

export default function ModelConfidenceMetrics({ prediction }: Props) {
  if (!prediction) return null;

  const confidence = Math.round((1 - prediction.uncertainty) * 100);
  const isHighConfidence = confidence >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <GlassCard padding="md" className="flex flex-col gap-6 relative overflow-hidden">
        {/* Glow behind the card */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="flex items-start justify-between z-10">
          <div>
            <h3 className="text-white/90 font-semibold text-[14px]">Consensus Confidence</h3>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
              Ensemble Model
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isHighConfidence ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Cpu className={`w-4 h-4 ${isHighConfidence ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
        </div>

        <div className="flex items-center gap-6 z-10">
          {/* Main Confidence Dial */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${confidence * 2.51} 251.2`}
                strokeLinecap="round"
                className={`${isHighConfidence ? 'text-cyan-500' : 'text-amber-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white/90">{confidence}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 font-mono uppercase">Uncertainty Bound</span>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-amber-400/70" />
                <span className="text-sm font-semibold text-white/90">±{prediction.uncertainty * 100}%</span>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 font-mono uppercase">Physics Validation</span>
              <div className="flex items-center gap-2">
                {prediction.physicsValidated ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Passed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span className="text-sm font-semibold text-rose-400">Failed</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
