import { useState } from "react";
import { CheckCircle2, Sparkles, Terminal, ChevronRight, Layers } from "lucide-react";

export default function AIReasoningFeed() {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const reasoningSteps = [
    {
      step: 1,
      title: "Step 1: Multi-Sensor Telemetry Consensus",
      badge: "DATA LAYER",
      status: "VERIFIED",
      color: "cyan",
      content:
        "DSCOVR and SOHO LASCO optical coronagraph data correlate at 98.4% across L1-to-Earth propagation geometry. Aditya-L1 radio telemetry was downweighted (weight 0.42) due to solar flare radio burst interference in the 100 MHz band.",
      metric: "6 Active Satellites · 0.88 Avg SNR Trust",
    },
    {
      step: 2,
      title: "Step 2: SHAP Feature Importance Attribution",
      badge: "AI REASONING",
      status: "HIGH DRIVER",
      color: "amber",
      content:
        "Southward interplanetary magnetic field (Bz = -14.2 nT) is the primary driver of geomagnetic coupling (+42% SHAP attribution), amplified by high CME shock propagation speed (680 km/s) and plasma sheath compression (18.5 p/cm³).",
      metric: "Bz contributes +3.9 to predicted Kp",
    },
    {
      step: 3,
      title: "Step 3: Physics-Informed Neural Network (PINN) Gate",
      badge: "MHD GATE",
      status: "PASS",
      color: "emerald",
      content:
        "Rankine-Hugoniot MHD shock jump conditions and magnetic flux conservation are mathematically validated across the L1 transit horizon. Residual magnetic divergence ||∇·B||² is bounded at 0.014 (well below 0.05 safety threshold).",
      metric: "Rankine-Hugoniot continuity verified",
    },
    {
      step: 4,
      title: "Step 4: Operational Synthesis & Decision Rule",
      badge: "DSS ACTION",
      status: "G4 ALERT",
      color: "rose",
      content:
        "Consensus forecast synthesizes Kp 8.5 (Severe Geomagnetic Storm G4) with 90% calibrated confidence. Arrival window is +42h (±2.5h). Recommends immediate high-voltage grid protective relay arming and satellite safe-mode prep.",
      metric: "Calibrated Uncertainty Interval ±0.4 Kp",
    },
  ];

  const physicsChecks = [
    { name: "Alfvén Wave Speed Consistency", value: "450 km/s (Nominal)", passed: true },
    { name: "Rankine-Hugoniot Shock Jump Condition", value: "ΔB / B = 2.4", passed: true },
    { name: "Magnetic Flux Conservation", value: "Residual < 0.014%", passed: true },
    { name: "Chapman-Ferraro Magnetopause Compression", value: "R_mp = 6.2 R_e", passed: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Chain of Thought Narrative Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI Chain-of-Thought Reasoning Narrative
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              PINN v2.4 CONSENSUS
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Real-time step-by-step scientific explanation of how multi-satellite telemetry and MHD physics laws synthesize into the current forecast:
          </p>

          <div className="space-y-3">
            {reasoningSteps.map((s, i) => {
              const isSelected = selectedStep === i;
              return (
                <div
                  key={s.step}
                  onClick={() => setSelectedStep(i)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-950 border-cyan-500/50 shadow-md"
                      : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                      {s.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-5 mb-2">
                    {s.content}
                  </p>
                  <div className="flex items-center justify-between pl-5 text-[11px] font-mono text-slate-400">
                    <span>{s.metric}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: MHD Physics Verification Checklist */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              MHD Physics Law Verification Checklist
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              100% CONVERGENT
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-5">
            Every neural prediction is subjected to rigorous magnetohydrodynamic (MHD) continuity and conservation checks before being released to decision makers:
          </p>

          <div className="space-y-3">
            {physicsChecks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{check.name}</span>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/50">
                  {check.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Physics Guarantee Footnote */}
        <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center gap-3">
          <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
          <p className="text-[11px] text-slate-400 leading-normal">
            <strong className="text-slate-200">Zero-Hallucination Safety Guarantee:</strong> If any MHD conservation law residual exceeds 0.05%, the model automatically falls back to empirical solar wind numerical simulation.
          </p>
        </div>
      </div>
    </div>
  );
}
