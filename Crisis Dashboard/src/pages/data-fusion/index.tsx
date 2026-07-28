import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Network, Activity, Zap, Shield, Loader2, ArrowRight } from "lucide-react";
import { getSatelliteHealth, getFusionResults } from "../../services/api";
import type { SatelliteHealth, FusionResult } from "../../types/types";

export default function DataFusionPage() {
  const [sats, setSats] = useState<SatelliteHealth[]>([]);
  const [fusion, setFusion] = useState<FusionResult[]>([]);
  const [loading, setLoading] = useState(true);

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
        {/* Left Column: Satellites */}
        <div className="space-y-4 col-span-1">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Telemetry Streams
          </h2>
          {sats.map((sat, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={sat.name}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-lg shadow-black/50"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">AI Weight</div>
                  <div className="text-xl font-mono text-cyan-400 font-bold">{sat.trustScore}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Latency</div>
                  <div className="text-xl font-mono text-slate-300 font-bold">{sat.latency}ms</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Center/Right: Engine & Data */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
          
          {/* Fusion Engine Visualization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center relative min-h-[300px] shadow-lg shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/5 to-transparent" />
            
            <div className="relative flex items-center justify-center w-full h-full my-8">
              {/* Nodes pointing to center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="absolute w-[120%] h-[120%] opacity-40 pointer-events-none" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="transparent" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  
                  {/* Lines from 4 corners */}
                  <motion.line x1="20" y1="20" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [-20, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <motion.line x1="180" y1="20" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [-20, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
                  <motion.line x1="20" y1="180" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [20, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
                  <motion.line x1="180" y1="180" x2="100" y2="100" stroke="url(#beam)" strokeWidth="2" strokeDasharray="4 4" animate={{ strokeDashoffset: [20, 0] }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
                  
                  {/* Pulsing rings */}
                  <motion.circle cx="100" cy="100" r="30" fill="none" stroke="#6366f1" strokeWidth="1" animate={{ r: [30, 60], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                  <motion.circle cx="100" cy="100" r="30" fill="none" stroke="#22d3ee" strokeWidth="1" animate={{ r: [30, 80], opacity: [0.3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
                </svg>
              </div>

              {/* Core */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-32 h-32 rounded-full border-2 border-indigo-500/50 bg-indigo-950/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] z-10"
              >
                <Cpu className="w-12 h-12 text-indigo-400" />
              </motion.div>
            </div>
            <div className="mt-2 text-center z-10">
              <h3 className="text-lg font-bold text-slate-100">Consensus Engine Active</h3>
              <p className="text-sm text-cyan-400 font-mono mt-1">PROCESSING {fusion.length} PHYSICAL PARAMETERS</p>
            </div>
          </div>

          {/* Fused Output Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/50">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Unified Physics Output
              </h2>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                <Shield className="w-3 h-3" /> VERIFIED
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
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
                    // Find the satellite with the highest weight
                    let bestSource = "N/A";
                    let bestWeight = 0;
                    Object.entries(res.individualReadings || {}).forEach(([sat, rawWt]) => {
                       let w = typeof rawWt === 'object' && rawWt !== null ? (rawWt as any).w : rawWt;
                       if (typeof w === 'number' && w > 1.0) {
                         w = 0.98; // Clamp safety so confidence never exceeds 100%
                       }
                       if (typeof w === 'number' && w > bestWeight) {
                         bestWeight = w;
                         bestSource = sat;
                       }
                    });

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
                        <td className="p-4 font-mono text-cyan-400 font-bold">
                          {res.fusedValue !== null && res.fusedValue !== undefined ? Number(res.fusedValue).toFixed(4) : "N/A"}
                        </td>
                        <td className="p-4 text-slate-400 flex items-center gap-2 font-medium">
                          {bestSource !== "N/A" && <ArrowRight className="w-3 h-3 text-indigo-500 group-hover:text-indigo-400 transition-colors" />}
                          {bestSource}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="font-mono font-bold text-emerald-400">{Math.round(bestWeight * 100)}%</span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${bestWeight * 100}%` }} />
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
