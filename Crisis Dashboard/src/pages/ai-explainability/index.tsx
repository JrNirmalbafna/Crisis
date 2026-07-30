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

const INITIAL_PREDICTION: PredictionResult = {
  id: "pred-1",
  eventId: "evt-1",
  model: "helios-consensus",
  kpIndex: 8.5,
  dstIndex: -475,
  stormProbability: 0.95,
  horizonHours: 24,
  uncertainty: 0.1,
  physicsValidated: true,
  errorRangeMin: 0,
  errorRangeMax: 0,
  createdAt: new Date().toISOString()
};

const INITIAL_FUSION: FusionResult[] = [
  {
    timestamp: new Date().toISOString(),
    parameterName: "plasma_speed",
    fusedValue: 542.8,
    individualReadings: {
      "DSCOVR": { "w": 0.44, "value": 541.2, "trust": 0.99 },
      "ACE": { "w": 0.33, "value": 543.5, "trust": 0.98 },
      "WIND": { "w": 0.23, "value": 543.8, "trust": 0.96 },
      "confidence": 0.942
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "bt",
    fusedValue: 8.4,
    individualReadings: {
      "DSCOVR": { "w": 0.31, "value": 8.3, "trust": 0.99 },
      "ACE": { "w": 0.45, "value": 8.5, "trust": 0.98 },
      "WIND": { "w": 0.24, "value": 8.4, "trust": 0.96 },
      "confidence": 0.961
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "bz",
    fusedValue: -4.2,
    individualReadings: {
      "DSCOVR": { "w": 0.32, "value": -4.1, "trust": 0.99 },
      "ACE": { "w": 0.28, "value": -4.3, "trust": 0.98 },
      "WIND": { "w": 0.40, "value": -4.2, "trust": 0.96 },
      "confidence": 0.914
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "bx",
    fusedValue: 3.1,
    individualReadings: {
      "DSCOVR": { "w": 0.42, "value": 3.0, "trust": 0.99 },
      "ACE": { "w": 0.34, "value": 3.2, "trust": 0.98 },
      "WIND": { "w": 0.24, "value": 3.1, "trust": 0.96 },
      "confidence": 0.895
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "by",
    fusedValue: -5.8,
    individualReadings: {
      "DSCOVR": { "w": 0.30, "value": -5.7, "trust": 0.99 },
      "ACE": { "w": 0.46, "value": -5.9, "trust": 0.98 },
      "WIND": { "w": 0.24, "value": -5.8, "trust": 0.96 },
      "confidence": 0.928
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "density",
    fusedValue: 12.6,
    individualReadings: {
      "DSCOVR": { "w": 0.35, "value": 12.5, "trust": 0.99 },
      "ACE": { "w": 0.42, "value": 12.7, "trust": 0.98 },
      "WIND": { "w": 0.23, "value": 12.6, "trust": 0.96 },
      "confidence": 0.937
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "temperature",
    fusedValue: 185400.0,
    individualReadings: {
      "DSCOVR": { "w": 0.43, "value": 185000, "trust": 0.99 },
      "ACE": { "w": 0.33, "value": 186000, "trust": 0.98 },
      "WIND": { "w": 0.24, "value": 185200, "trust": 0.96 },
      "confidence": 0.876
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "dynamic_pressure",
    fusedValue: 6.12,
    individualReadings: {
      "DSCOVR": { "w": 0.32, "value": 6.10, "trust": 0.99 },
      "ACE": { "w": 0.28, "value": 6.15, "trust": 0.98 },
      "WIND": { "w": 0.40, "value": 6.12, "trust": 0.96 },
      "confidence": 0.903
    }
  },
  {
    timestamp: new Date().toISOString(),
    parameterName: "electric_field",
    fusedValue: 2.28,
    individualReadings: {
      "DSCOVR": { "w": 0.45, "value": 2.26, "trust": 0.99 },
      "ACE": { "w": 0.32, "value": 2.30, "trust": 0.98 },
      "WIND": { "w": 0.23, "value": 2.28, "trust": 0.96 },
      "confidence": 0.889
    }
  }
];

export default function AIExplainabilityPage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(INITIAL_PREDICTION);
  const [fusionData, setFusionData] = useState<FusionResult[]>(INITIAL_FUSION);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    async function load() {
      setSyncing(true);
      try {
        const [pData, fData] = await Promise.all([
          getPredictionSummary(),
          getFusionResults()
        ]);
        if (pData) setPrediction(pData);
        if (fData && fData.length > 0) setFusionData(fData);
      } catch (err) {
        console.error(err);
      } finally {
        setSyncing(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="flex items-center gap-2 shrink-0">
          {syncing ? (
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5 shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              SYNCING MODEL...
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MODEL SYNCED
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            PINN v2.4 OPERATIONAL
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
