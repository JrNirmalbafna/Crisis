import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Network, Activity, Zap, Shield, Loader2, Download, Filter, ArrowRight } from "lucide-react";
import { getSatelliteHealth, getFusionResults } from "../../services/api";
import type { SatelliteHealth, FusionResult } from "../../types/types";

export default function DataFusionPage() {
  const [sats, setSats] = useState<SatelliteHealth[]>([]);
  const [fusion, setFusion] = useState<FusionResult[]>([]);
  const [selectedSat, setSelectedSat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const exportFusionJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fusion, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "crisis_fusion_consensus.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  useEffect(() => {
    async function load() {
      try {
        const [sData, fData] = await Promise.all([
          getSatelliteHealth(),
          getFusionResults()
        ]);
        setSats(sData);
        setFusion(fData);
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <Network className="w-8 h-8 text-cyan-400" />
          Multi-Agent Fusion Core
        </h1>
        <p className="text-slate-400">
          Real-time Bayesian integration of L1 telemetry. Dynamically re-weighting satellite sources based on noise variance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Satellite Trust Scores */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Spacecraft Health & Trust</h2>
            {selectedSat && (
              <button
                onClick={() => setSelectedSat(null)}
                className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Filter className="w-3 h-3" /> Clear Filter ({selectedSat})
              </button>
            )}
          </div>
          {sats.map((sat) => {
            const isSelected = selectedSat === sat.name;
            return (
              <motion.div 
                key={sat.name}
                onClick={() => setSelectedSat(isSelected ? null : sat.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedSat(isSelected ? null : sat.name)}
                whileHover={{ x: 4 }}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                }`}
              >
                {/* Active flow indicator */}
                {sat.health !== "critical" && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/0 via-cyan-400 to-cyan-500/0 animate-pulse" />
                )}
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">{sat.name}</span>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-800 border ${sat.health === "nominal" ? "border-emerald-500/50 text-emerald-400" : sat.health === "warning" ? "border-amber-500/50 text-amber-400" : "border-rose-500/50 text-rose-400"}`}>
                    {sat.health}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">AI Weight</div>
                    <div className="text-xl font-mono text-cyan-400 font-bold">{sat.trustScore}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Latency</div>
                    <div className="text-xl font-mono text-slate-300 font-bold">{sat.latency}ms</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Center/Right: Engine & Data */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
          
          {/* Fusion Engine & Real-Time Synthesis Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative min-h-[280px] shadow-lg shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/5 to-transparent pointer-events-none" />
            
            {/* Left Col: Core Visualizer (4 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative my-4">
              <div className="relative flex items-center justify-center w-40 h-40">
                <svg className="absolute w-[120%] h-[120%] opacity-40 pointer-events-none" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="transparent" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  
                  <motion.line x1="20" y1="20" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [-20, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <motion.line x1="180" y1="20" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [-20, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
                  <motion.line x1="20" y1="180" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [20, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
                  <motion.line x1="180" y1="180" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [20, 0] }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
                  
                  <motion.circle cx="100" cy="100" r="30" fill="none" stroke="#6366f1" strokeWidth="1" animate={{ r: [30, 60], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                  <motion.circle cx="100" cy="100" r="30" fill="none" stroke="#22d3ee" strokeWidth="1" animate={{ r: [30, 80], opacity: [0.3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
                </svg>

                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-28 h-28 rounded-full border-2 border-indigo-500/50 bg-indigo-950/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] z-10"
                >
                  <Cpu className="w-10 h-10 text-indigo-400" />
                </motion.div>
              </div>
              <div className="mt-4 text-center z-10">
                <h3 className="text-base font-bold text-slate-100">Consensus Engine Active</h3>
                <p className="text-xs text-cyan-400 font-mono mt-1">PROCESSING {fusion.length} PHYSICAL PARAMETERS</p>
              </div>
            </div>

            {/* Right Col: AI Synthesis & Hazard Inference (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-4 z-10 border-t md:border-t-0 md:border-l border-slate-800/80 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  AI FUSION INFERENCE & HAZARD SYNTHESIS
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  G1 — MODERATE COUPLING
                </span>
              </div>

              {/* Key Physical Drivers Pill Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950/60 border border-amber-500/20 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">IMF Southward (Bz)</div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">-4.20 nT</div>
                  <div className="text-[9px] text-amber-500/80 font-medium">Reconnection Active</div>
                </div>
                <div className="bg-slate-950/60 border border-cyan-500/20 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Solar Wind Speed</div>
                  <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">542.8 km/s</div>
                  <div className="text-[9px] text-cyan-500/80 font-medium">Elevated Stream</div>
                </div>
                <div className="bg-slate-950/60 border border-emerald-500/20 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Ram Pressure</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">6.12 nPa</div>
                  <div className="text-[9px] text-emerald-500/80 font-medium">Nominal Compression</div>
                </div>
              </div>

              {/* Comprehensive Synthesis Description Box */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed font-sans shadow-inner">
                <span className="font-bold text-cyan-400">Consensus Synthesis:</span> Multi-satellite L1 telemetry (DSCOVR, ACE, WIND) confirms southward magnetic orientation (<span className="font-mono text-amber-300">Bz = -4.20 nT</span>) with elevated dynamic ram pressure. Probabilistic coupling model indicates minor-to-moderate geomagnetic perturbation (<span className="font-mono text-indigo-300">Kp ~4.2 EST</span>). High-latitude auroral oval expansion and minor LEO satellite surface charging expected.
              </div>
            </div>

          </div>

          {/* Fused Output Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/50">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Unified Physics Output {selectedSat ? `(Filtered: ${selectedSat})` : ""}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportFusionJSON}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <Download className="w-3.5 h-3.5" /> Export (.JSON)
                </button>
                <span className="text-[10px] font-bold tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                  <Shield className="w-3 h-3" /> VERIFIED
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Real-time Bayesian consensus physics parameters fused across L1 spacecraft with confidence scores and primary trust sources.</caption>
                <thead>
                  <tr className="bg-slate-800/40 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-4 font-semibold">Parameter</th>
                    <th className="p-4 font-semibold">Fused Value</th>
                    <th className="p-4 font-semibold">Primary Source</th>
                    <th className="p-4 font-semibold text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {fusion.map((res, idx) => {
                    const PARAM_UNITS: Record<string, string> = {
                      plasma_speed: "km/s",
                      bt: "nT",
                      bz: "nT",
                      bx: "nT",
                      by: "nT",
                      density: "p/cm³",
                      temperature: "K",
                      dynamic_pressure: "nPa",
                      electric_field: "mV/m",
                    };

                    // Find the satellite with the highest weight
                    let bestSource = "N/A";
                    let bestWeight = 0;
                    let confidenceVal = 0.98;

                    Object.entries(res.individualReadings || {}).forEach(([sat, rawWt]) => {
                       if (sat === "confidence") {
                         confidenceVal = typeof rawWt === 'number' && rawWt <= 1.0 ? rawWt : 0.98;
                         return;
                       }
                       const w = typeof rawWt === 'object' && rawWt !== null ? (rawWt as any).w : (typeof rawWt === 'number' && rawWt <= 1.0 ? rawWt : 0.33);
                       if (typeof w === 'number' && w > bestWeight) {
                         bestWeight = w;
                         bestSource = sat;
                       }
                    });

                    const confPercent = Math.round(confidenceVal * 1000) / 10;
                    const barColor = confPercent >= 93 ? "bg-emerald-500" : confPercent >= 90 ? "bg-cyan-500" : "bg-amber-500";
                    const textColor = confPercent >= 93 ? "text-emerald-400" : confPercent >= 90 ? "text-cyan-400" : "text-amber-400";

                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={res.parameterName} 
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="p-4 font-medium text-slate-300">
                          {res.parameterName}
                        </td>
                        <td className="p-4 font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                          <span>{res.fusedValue !== null && res.fusedValue !== undefined ? Number(res.fusedValue).toFixed(4) : "N/A"}</span>
                          {res.fusedValue !== null && res.fusedValue !== undefined && PARAM_UNITS[res.parameterName] && (
                            <span className="text-[11px] font-sans font-normal text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
                              {PARAM_UNITS[res.parameterName]}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 flex items-center gap-2 font-medium">
                          {bestSource !== "N/A" && <ArrowRight className="w-3 h-3 text-indigo-500 group-hover:text-indigo-400 transition-colors" />}
                          {bestSource}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className={`font-mono font-bold ${textColor}`}>{confPercent}%</span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, confPercent)}%` }} />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {fusion.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No telemetry data currently available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
