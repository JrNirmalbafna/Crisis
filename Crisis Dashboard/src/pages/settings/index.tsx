import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ShieldAlert, Sliders, Download, RotateCcw, AlertTriangle } from "lucide-react";
import { useOperational } from "../../context/OperationalContext";

// ── NOAA Geomagnetic Storm Scale reference ────────────────────────────────────
const KP_SCALE_LABELS = [
  { kp: 0,  label: "Quiet",   color: "#10b981" },
  { kp: 5,  label: "G1",      color: "#f59e0b" },
  { kp: 6,  label: "G2",      color: "#f97316" },
  { kp: 7,  label: "G3",      color: "#ef4444" },
  { kp: 8,  label: "G4",      color: "#dc2626" },
  { kp: 9,  label: "G5",      color: "#b91c1c" },
];

const NOAA_DEFAULTS = { kpThreshold: 5, manualThreatLevel: "Normal" as const, isOverrideEnabled: false };

// ── Storm-scale gradient track for the Kp slider ─────────────────────────────
const KP_TRACK_GRADIENT = `linear-gradient(to right,
  #10b981 0%, #10b981 44%,
  #f59e0b 55%,
  #f97316 66%,
  #ef4444 77%,
  #dc2626 88%,
  #b91c1c 100%
)`;

export default function SettingsPage() {
  const {
    isOverrideEnabled,
    setOverrideEnabled,
    manualThreatLevel,
    setManualThreatLevel,
    kpThreshold,
    setKpThreshold,
  } = useOperational();

  // Safety confirmation dialog state for high Kp suppression
  const [pendingKp, setPendingKp] = useState<number | null>(null);

  const exportConfigJSON = () => {
    const config = { isOverrideEnabled, manualThreatLevel, kpThreshold, timestamp: new Date().toISOString() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "mission_control_config.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const resetToDefaults = () => {
    setKpThreshold(NOAA_DEFAULTS.kpThreshold);
    setManualThreatLevel(NOAA_DEFAULTS.manualThreatLevel);
    setOverrideEnabled(NOAA_DEFAULTS.isOverrideEnabled);
  };

  // Intercept slider changes > Kp 8 with safety modal
  const handleKpChange = (val: number) => {
    if (val >= 8) {
      setPendingKp(val);
    } else {
      setKpThreshold(val);
    }
  };

  const confirmHighKp = () => {
    if (pendingKp !== null) setKpThreshold(pendingKp);
    setPendingKp(null);
  };

  // Compute current NOAA storm scale label
  const currentScale = KP_SCALE_LABELS.slice().reverse().find(s => kpThreshold >= s.kp) || KP_SCALE_LABELS[0];

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <Settings className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Mission Control Settings</h1>
            <p className="text-slate-400 text-sm">System configuration and operator overrides</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to NOAA Defaults
          </button>
          <button
            onClick={exportConfigJSON}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Download className="w-4 h-4" /> Export Config (.JSON)
          </button>
        </div>
      </div>

      {/* ── 2-Column Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── LEFT: Operator Override ──────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl border p-6 transition-colors duration-500 ${
            isOverrideEnabled
              ? "bg-rose-950/20 border-rose-500/30"
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          {isOverrideEnabled && (
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
          )}

          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-3">
              <div className={`p-2.5 rounded-lg ${isOverrideEnabled ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isOverrideEnabled ? "text-rose-400" : "text-white"}`}>
                  Manual Operator Override
                </h2>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Disconnects AI Threat Assessment. Use only during sensor saturation or extreme anomalies.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                aria-label="Toggle Manual Operator Override"
                className="sr-only peer"
                checked={isOverrideEnabled}
                onChange={(e) => setOverrideEnabled(e.target.checked)}
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer
                peer-checked:after:translate-x-full peer-checked:after:border-white
                after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white
                after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6
                after:transition-all peer-checked:bg-rose-500 shadow-inner
                peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400
                peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900" />
            </label>
          </div>

          <div className={`transition-all duration-300 ${isOverrideEnabled ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Force Global Threat Level</h3>
            <div className="flex gap-3">
              {(["Normal", "High", "Critical"] as const).map((level) => (
                <button
                  key={level}
                  disabled={!isOverrideEnabled}
                  onClick={() => setManualThreatLevel(level)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    manualThreatLevel === level && isOverrideEnabled
                      ? level === "Normal"   ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : level === "High"     ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(243,62,98,0.3)]"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── RIGHT: Kp Alert Threshold ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border bg-slate-900/50 border-slate-800 p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 rounded-lg bg-slate-800 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alert Thresholds</h2>
              <p className="text-slate-400 text-sm mt-1">Configure when systems should page operators.</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* ── Kp large display badge ─────────────────────────────── */}
            <div className="flex items-center justify-between">
              <label htmlFor="kp-threshold-slider" className="text-sm font-medium text-slate-300">
                Minimum Kp Index for High Alert
              </label>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-mono font-bold tabular-nums" style={{ color: currentScale.color }}>
                  {kpThreshold}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-mono font-bold" style={{ color: currentScale.color }}>
                    {currentScale.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">NOAA scale</span>
                </div>
              </div>
            </div>

            {/* ── NOAA Storm-Scale Color Track Slider ────────────────── */}
            <div>
              <div className="relative h-3 rounded-full mb-1" style={{ background: KP_TRACK_GRADIENT }}>
                <input
                  id="kp-threshold-slider"
                  aria-label="Minimum Kp Index for High Alert"
                  type="range"
                  min="0"
                  max="9"
                  step="1"
                  value={kpThreshold}
                  onChange={(e) => handleKpChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Thumb indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 border-slate-900 transition-all pointer-events-none"
                  style={{ left: `calc(${(kpThreshold / 9) * 100}% - 10px)` }}
                />
              </div>

              {/* ── NOAA scale tick labels ─────────────────────────────── */}
              <div className="flex justify-between text-[10px] font-mono mt-2">
                {KP_SCALE_LABELS.map((s) => (
                  <div key={s.kp} className="flex flex-col items-center">
                    <span style={{ color: s.color }} className="font-bold">{s.label}</span>
                    <span className="text-slate-600">Kp{s.kp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ── Safety Confirmation Dialog ────────────────────────────────────── */}
      <AnimatePresence>
        {pendingKp !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex gap-3 mb-4">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">High Kp Suppression Warning</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Setting alert threshold to <span className="text-rose-400 font-mono font-bold">Kp {pendingKp}</span> (G{pendingKp - 4} Storm) will suppress major geomagnetic storm warnings below this level. Confirm this is intentional.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setPendingKp(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmHighKp}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  Confirm — Set Kp {pendingKp}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
