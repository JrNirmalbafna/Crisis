import { motion } from "framer-motion";
import { Settings, ShieldAlert, Sliders } from "lucide-react";
import { useOperational } from "../../context/OperationalContext";

export default function SettingsPage() {
  const { 
    isOverrideEnabled, 
    setOverrideEnabled, 
    manualThreatLevel, 
    setManualThreatLevel,
    kpThreshold,
    setKpThreshold
  } = useOperational();

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-full">
      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
          <Settings className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mission Control Settings</h1>
          <p className="text-slate-400 text-sm">System configuration and operator overrides</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* OPERATOR OVERRIDE SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl border p-6 transition-colors duration-500 ${
            isOverrideEnabled 
              ? 'bg-rose-950/20 border-rose-500/30' 
              : 'bg-slate-900/50 border-slate-800'
          }`}
        >
          {isOverrideEnabled && (
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
          )}
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-4">
              <div className={`p-2.5 rounded-lg ${isOverrideEnabled ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isOverrideEnabled ? 'text-rose-400' : 'text-white'}`}>
                  Manual Operator Override
                </h2>
                <p className="text-slate-400 text-sm max-w-xl mt-1">
                  Engaging override disconnects the AI Threat Assessment engine and forces the system into a manual state. Only use during known sensor saturation or extreme anomalies.
                </p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isOverrideEnabled}
                onChange={(e) => setOverrideEnabled(e.target.checked)}
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
            </label>
          </div>

          <div className={`transition-all duration-300 ${isOverrideEnabled ? 'opacity-100 h-auto' : 'opacity-30 pointer-events-none'}`}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Force Global Threat Level</h3>
            <div className="flex gap-4">
              {(['Normal', 'High', 'Critical'] as const).map(level => (
                <button
                  key={level}
                  disabled={!isOverrideEnabled}
                  onClick={() => setManualThreatLevel(level)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border ${
                    manualThreatLevel === level && isOverrideEnabled
                      ? level === 'Normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : level === 'High' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(243,62,98,0.3)]'
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* THRESHOLDS SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-slate-900/50 border-slate-800 p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 rounded-lg bg-slate-800 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alert Thresholds</h2>
              <p className="text-slate-400 text-sm mt-1">Configure when automatic systems should page operators.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Minimum Kp Index for High Alert</label>
                <span className="text-blue-400 font-mono font-bold">Kp {kpThreshold}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="9" 
                step="1"
                value={kpThreshold}
                onChange={(e) => setKpThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>0</span>
                <span>3</span>
                <span>6</span>
                <span>9</span>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
