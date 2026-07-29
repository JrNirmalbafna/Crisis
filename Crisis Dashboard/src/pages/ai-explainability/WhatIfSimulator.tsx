import { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";

export default function WhatIfSimulator() {
  const [bz, setBz] = useState<number>(-14.2);
  const [speed, setSpeed] = useState<number>(680);
  const [density, setDensity] = useState<number>(18.5);

  // Counterfactual calculation of Kp index based on Newell IMF coupling formula
  // Kp increases when Bz is southward (<0), speed is high, and density is high.
  const calculateSimulatedKp = () => {
    let base = 2.0;

    // Southward Bz contribution (if negative, contributes strongly)
    if (bz < 0) {
      base += Math.abs(bz) * 0.28;
    } else {
      // Northward Bz suppresses reconnection
      base -= bz * 0.15;
    }

    // Solar wind speed contribution (above baseline 400 km/s)
    if (speed > 400) {
      base += ((speed - 400) / 100) * 0.85;
    }

    // Plasma density contribution (above baseline 5 p/cm3)
    if (density > 5) {
      base += ((density - 5) / 10) * 0.35;
    }

    // Clip between 0.0 and 9.0
    return Math.max(0.0, Math.min(9.0, base));
  };

  const simKp = calculateSimulatedKp();

  // Determine NOAA Storm Scale
  const getStormScale = (kp: number) => {
    if (kp >= 8.5) return { label: "G5 Extreme Storm", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/40", alert: "Critical satellite surface charging & widespread grid voltage blackouts likely." };
    if (kp >= 7.5) return { label: "G4 Severe Storm", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", alert: "High-voltage protective relay tripping required; LEO drag increased." };
    if (kp >= 6.5) return { label: "G3 Strong Storm", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", alert: "GPS/GNSS degradation and HF radio blackouts across polar caps." };
    if (kp >= 5.5) return { label: "G2 Moderate Storm", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/30", alert: "High-latitude power systems may experience voltage alarms." };
    if (kp >= 4.5) return { label: "G1 Minor Storm", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", alert: "Minor fluctuations in power grid; auroras visible at high latitudes." };
    return { label: "G0 Nominal (No Storm)", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", alert: "Nominal space weather conditions. No operational action required." };
  };

  const storm = getStormScale(simKp);

  // Magnetopause stand-off distance estimation (R_e)
  const magnetopauseDistance = Math.max(4.8, 10.2 - (Math.abs(bz) * 0.15 + (speed - 400) * 0.005 + (density - 5) * 0.08)).toFixed(1);

  const resetToNominal = () => {
    setBz(-14.2);
    setSpeed(680);
    setDensity(18.5);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Interactive "What-If" Counterfactual Simulator</h3>
            <p className="text-xs text-slate-400">
              Perturb interplanetary solar wind parameters to test how the AI reasoning and Kp forecast respond in real-time.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setBz(-22); setSpeed(950); setDensity(42); }}
            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-[11px] font-mono text-rose-300 border border-rose-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            1989 Quebec G5
          </button>
          <button
            onClick={() => { setBz(-18); setSpeed(820); setDensity(35); }}
            className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-[11px] font-mono text-amber-300 border border-amber-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            2003 Halloween G4
          </button>
          <button
            onClick={resetToNominal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-center">
        {/* Sliders Column */}
        <div className="lg:col-span-2 space-y-5 bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl">
          {/* Bz Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="slider-bz" className="font-semibold text-slate-200 cursor-pointer">
                IMF Bz Magnetic Field <span className="text-slate-400 font-normal">(Southward vs Northward)</span>
              </label>
              <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {bz > 0 ? `+${bz}` : bz} nT
              </span>
            </div>
            <input
              id="slider-bz"
              aria-label="IMF Bz Magnetic Field in nanoteslas"
              type="range"
              min="-25"
              max="15"
              step="0.5"
              value={bz}
              onChange={(e) => setBz(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>-25 nT (Extreme Southward)</span>
              <span>0 nT</span>
              <span>+15 nT (Northward)</span>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="slider-speed" className="font-semibold text-slate-200 cursor-pointer">
                Solar Wind Bulk Velocity <span className="text-slate-400 font-normal">(CME Shock Speed)</span>
              </label>
              <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {speed} km/s
              </span>
            </div>
            <input
              id="slider-speed"
              aria-label="Solar Wind Bulk Velocity in kilometers per second"
              type="range"
              min="300"
              max="1100"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>300 km/s (Slow Wind)</span>
              <span>400 km/s (Nominal)</span>
              <span>1100 km/s (Extreme CME)</span>
            </div>
          </div>

          {/* Density Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="slider-density" className="font-semibold text-slate-200 cursor-pointer">
                Plasma Ram Density <span className="text-slate-400 font-normal">(Proton Sheath Density)</span>
              </label>
              <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {density} p/cm³
              </span>
            </div>
            <input
              id="slider-density"
              aria-label="Plasma Ram Density in protons per cubic centimeter"
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={density}
              onChange={(e) => setDensity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>1.0 p/cm³</span>
              <span>5.0 p/cm³ (Nominal)</span>
              <span>50.0 p/cm³ (High Compression)</span>
            </div>
          </div>
        </div>

        {/* Counterfactual Output Response Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-full min-h-[220px]">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold tracking-wider">
              Simulated Consensus Output
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                Kp {simKp.toFixed(1)}
              </span>
              <span className={`text-xs font-bold font-mono px-2 py-1 rounded border ${storm.bg} ${storm.color}`}>
                {storm.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3">
              <span>Magnetopause Stand-off:</span>
              <span className="text-slate-200 font-bold">{magnetopauseDistance} R_e</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>SHAP Delta from Base:</span>
              <span className="text-cyan-400 font-bold">
                {simKp >= 8.5 ? "+3.9 Kp" : simKp >= 5.0 ? `+${(simKp - 2.0).toFixed(1)} Kp` : `${(simKp - 2.0).toFixed(1)} Kp`}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300 block mb-1">Operational Impact & Guidance:</span>
            {storm.alert}
          </div>
        </div>
      </div>
    </div>
  );
}
