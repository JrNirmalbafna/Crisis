import { useState } from "react";
import { Save, Check, UserCheck, History } from "lucide-react";

interface AuditEntry {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
  status: "VERIFIED" | "OVERRIDE" | "FLAGGED";
}

export default function OperatorFeedbackPanel() {
  const [feedbackType, setFeedbackType] = useState<"agree" | "flag" | "override">("agree");
  const [overrideKp, setOverrideKp] = useState<number>(7.0);
  const [rationale, setRationale] = useState<string>("");
  const [dscovrTrust, setDscovrTrust] = useState<number>(85);
  const [sohoTrust, setSohoTrust] = useState<number>(91);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    {
      id: "AUD-8842",
      time: "2 mins ago",
      operator: "Dr. K. Sharma (ISRO Space Weather)",
      action: "Sensor Trust Calibration",
      detail: "Downweighted Aditya-L1 SWIS due to solar flare RF saturation.",
      status: "VERIFIED",
    },
    {
      id: "AUD-8839",
      time: "14 mins ago",
      operator: "M. Vance (NOAA SWPC Analyst)",
      action: "Physics Gate Validation",
      detail: "Confirmed Rankine-Hugoniot shock continuity across L1-Earth transit.",
      status: "VERIFIED",
    },
  ]);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: AuditEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      time: "Just now",
      operator: "Current Analyst (Duty Lead)",
      action:
        feedbackType === "agree"
          ? "Operator Forecast Confirmation"
          : feedbackType === "flag"
          ? "Sensor Anomaly Flagged"
          : `Kp Override -> Kp ${overrideKp}`,
      detail: rationale || (feedbackType === "agree" ? "Verified model reasoning and MHD continuity." : "Analyst manual intervention."),
      status: feedbackType === "override" ? "OVERRIDE" : feedbackType === "flag" ? "FLAGGED" : "VERIFIED",
    };

    setAuditLogs([newEntry, ...auditLogs]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setRationale("");
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Human-in-the-Loop (HITL) Operator Feedback & Calibration</h3>
            <p className="text-xs text-slate-400">
              Submit feedback, tune sensor trust weights, or execute an audited Kp forecast override.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          HITL AUDIT ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Left: Feedback & Override Submission Form */}
        <form onSubmit={handleSubmitFeedback} className="space-y-4 bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl">
          {/* Feedback Type Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setFeedbackType("agree")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                feedbackType === "agree"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Agree with Forecast
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType("flag")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                feedbackType === "flag"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Flag Sensor Anomaly
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType("override")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                feedbackType === "override"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Kp Forecast Override
            </button>
          </div>

          {/* Conditional Override Slider */}
          {feedbackType === "override" && (
            <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-2 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-rose-300">Analyst Kp Override Value:</span>
                <span className="font-mono font-bold text-rose-400 text-sm bg-rose-950/60 px-2 py-0.5 rounded border border-rose-700">
                  Kp {overrideKp.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="9.0"
                step="0.5"
                value={overrideKp}
                onChange={(e) => setOverrideKp(parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Dynamic Trust Weight Adjustment */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <label htmlFor="dscovr-trust-slider">DSCOVR Trust Weight</label>
                <span className="font-mono text-cyan-400">{dscovrTrust}%</span>
              </div>
              <input
                id="dscovr-trust-slider"
                aria-label="DSCOVR Trust Weight Percentage"
                type="range"
                min="30"
                max="100"
                value={dscovrTrust}
                onChange={(e) => setDscovrTrust(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <label htmlFor="soho-trust-slider">SOHO Optical Trust</label>
                <span className="font-mono text-pink-400">{sohoTrust}%</span>
              </div>
              <input
                id="soho-trust-slider"
                aria-label="SOHO Optical Trust Percentage"
                type="range"
                min="30"
                max="100"
                value={sohoTrust}
                onChange={(e) => setSohoTrust(parseInt(e.target.value))}
                className="w-full accent-pink-400 bg-slate-800 h-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>
          </div>

          {/* Operational Rationale Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="rationale-input" className="text-xs font-semibold text-slate-300 block">
              Operational Audit Rationale <span className="text-slate-400 font-normal">(Required for logs)</span>
            </label>
            <textarea
              id="rationale-input"
              aria-label="Operational Audit Rationale"
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={
                feedbackType === "agree"
                  ? "e.g., Checked ground magnetometer data; agrees with model Kp 8.5 forecast..."
                  : feedbackType === "flag"
                  ? "e.g., Flagging temporary radio noise spike on ACE SWEPAM sensor..."
                  : "e.g., Terrestrial magnetometer arrays in high latitudes indicate Kp 7.0 limit..."
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          {submitted && (
            <div role="alert" className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Analyst Calibration Applied — Ensemble PINN Weights Recalibrated</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                Audit Trail Recorded!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Submit Feedback & Log to Audit Trail
              </>
            )}
          </button>
        </form>

        {/* Right: Real-Time Immutable Operational Audit Trail */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                Operational XAI Audit Trail
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                15-Table Provenance (`audit_logs`)
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-300 text-[11px] font-semibold">{log.id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{log.action}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        log.status === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : log.status === "OVERRIDE"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{log.detail}</p>
                  <span className="text-[10px] text-slate-500 block font-mono">By: {log.operator}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3 font-mono">
            * All analyst feedbacks adjust dynamic reliability weights $R_i(t)$ across the 6-satellite sensor fusion ensemble.
          </p>
        </div>
      </div>
    </div>
  );
}
