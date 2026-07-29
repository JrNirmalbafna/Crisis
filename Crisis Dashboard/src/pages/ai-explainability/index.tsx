import { useEffect, useState } from "react";
import { BrainCircuit, Network } from "lucide-react";
import { getPredictionSummary, getFusionResults } from "../../services/api";
import type { PredictionResult, FusionResult } from "../../types/types";
import NeuralNetworkGraph from "./NeuralNetworkGraph";
import FeatureImportanceChart from "./FeatureImportanceChart";
import ModelConfidenceMetrics from "./ModelConfidenceMetrics";
import AIReasoningFeed from "./AIReasoningFeed";
import WhatIfSimulator from "./WhatIfSimulator";
import OperatorFeedbackPanel from "./OperatorFeedbackPanel";
import { Loader2 } from "lucide-react";

export default function AIExplainabilityPage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [fusionData, setFusionData] = useState<FusionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pData, fData] = await Promise.all([
          getPredictionSummary(),
          getFusionResults()
        ]);
        setPrediction(pData);
        setFusionData(fData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative min-h-full flex flex-col pb-12">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Crisis AI Core — Human-in-the-Loop Explainability
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Transparent neural pathway visualization, step-by-step MHD scientific reasoning, counterfactual simulations, and analyst calibration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            PINN v2.4 OPERATIONAL
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            MHD LAWS VERIFIED
          </span>
        </div>
      </div>

      {/* Row 1: Key Model Metrics */}
      <ModelConfidenceMetrics prediction={prediction} />

      {/* Row 2: Interactive Clickable Pathway Graph + SHAP Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Feature Importance Chart */}
        <div className="col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-lg shadow-black/50 h-[520px]">
          <FeatureImportanceChart fusionData={fusionData} />
        </div>

        {/* Center/Right: Interactive Clickable Neural Graph Visualization */}
        <div className="col-span-1 lg:col-span-2 flex flex-col h-full">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between relative min-h-[520px] h-full shadow-lg shadow-black/50 overflow-hidden">
            <div className="w-full flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                Interactive Consensus Pathway Visualizer
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                Click nodes below to inspect XAI formula & SHAP score
              </span>
            </div>
            <div className="w-full h-full flex-1 flex flex-col justify-center">
              <NeuralNetworkGraph prediction={prediction} fusionData={fusionData} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: AI Chain-of-Thought Reasoning Narrative & MHD Physics Checklist */}
      <AIReasoningFeed />

      {/* Row 4: Interactive Counterfactual What-If Simulator */}
      <WhatIfSimulator />

      {/* Row 5: Human-in-the-Loop Operator Feedback & Calibration Center */}
      <OperatorFeedbackPanel />
    </div>
  );
}
