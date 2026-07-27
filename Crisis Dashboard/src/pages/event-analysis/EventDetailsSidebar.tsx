import { Link } from "lucide-react";
import type { CMEEvent, PredictionResult, ImpactRisk } from "../../types/types";

interface Props {
  event: CMEEvent | null;
  prediction: PredictionResult | null;
  impact: ImpactRisk | null;
}

export default function EventDetailsSidebar({ event, prediction }: Props) {
  if (!event) {
    return (
      <div className="w-[320px] bg-[#020617] border-l border-slate-800/50 p-6 flex flex-col items-center justify-center text-slate-500 font-mono text-sm shrink-0">
        No event selected
      </div>
    );
  }

  const isCritical = event.severity === "critical" || event.severity === "high";

  return (
    <div className="w-[320px] bg-[#020617] border-l border-slate-800/50 flex flex-col h-full overflow-y-auto shrink-0 hidden lg:flex">
      
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
        <h2 className="text-slate-200 font-bold uppercase tracking-widest text-xs">Selected CME</h2>
        <button className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors text-[10px]">
          <Link className="w-3 h-3" /> Copy link
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6">
        <div>
          <h3 className={`text-sm font-bold flex items-start gap-2 ${isCritical ? 'text-amber-400' : 'text-slate-300'}`}>
            <span className="mt-0.5">⚠️</span> 
            {isCritical ? 'Earth-directed full halo CME' : 'Possible glancing blow - flank may brush Earth'}
          </h3>
        </div>

        <div className="flex flex-col gap-2 font-mono text-[11px]">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-slate-500">First seen</span>
            <span className="text-slate-300">{new Date(event.detectedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UT</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-slate-500">Cone speed</span>
            <span className="text-slate-300">{event.speed || '---'} km/s (type S) · faster than 4% of the catalog</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-slate-500">Direction</span>
            <span className="text-slate-300">S16W39 · half-width 32°</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-slate-500">Source flare</span>
            <span className="text-amber-500">M1.1 · Jul 12 08:11 UT</span>
          </div>
        </div>

        <div className="w-full h-px bg-slate-800/50" />

        <div className="flex flex-col gap-2">
          <h4 className="text-amber-500 font-bold text-lg">T-{(prediction?.horizonHours || 0).toFixed(0)}h 14m <span className="text-slate-400 text-sm font-normal">to arrival</span></h4>
          
          {/* --- ML VISUALIZATIONS --- */}
          <div className="flex flex-col gap-5 font-mono text-[11px] mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
            
            {/* 1. Impact Probability Gauge */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Impact Probability</span>
                <span className="text-emerald-400 font-bold">85.4%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: '85.4%' }} />
              </div>
            </div>

            {/* 2. Arrival Time Uncertainty Timeline */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Predicted Arrival (±38h UQ)</span>
                <span className="text-amber-400">{new Date(event.estimatedArrival || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UT</span>
              </div>
              <div className="relative w-full h-8 mt-1">
                {/* Timeline axis */}
                <div className="absolute top-1/2 w-full h-0.5 bg-slate-700 -translate-y-1/2 rounded" />
                {/* Uncertainty bound (±38h) - showing a relative width */}
                <div className="absolute top-1/2 left-[20%] w-[60%] h-3 bg-blue-500/20 border border-blue-500/50 -translate-y-1/2 rounded-full" />
                {/* Predicted marker */}
                <div className="absolute top-1/2 left-[50%] w-1.5 h-4 bg-amber-400 -translate-y-1/2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                
                {/* Labels */}
                <div className="absolute top-full left-[20%] -translate-x-1/2 mt-1 text-[8px] text-slate-500">-38h</div>
                <div className="absolute top-full left-[50%] -translate-x-1/2 mt-1 text-[9px] text-amber-500 font-bold">T₀</div>
                <div className="absolute top-full left-[80%] -translate-x-1/2 mt-1 text-[8px] text-slate-500">+38h</div>
              </div>
            </div>

            {/* 3. Kp Severity Meter */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Kp Severity Index</span>
                <span className="text-red-400 font-bold">~{(prediction?.kpIndex || 3.6).toFixed(1)} / 9.0</span>
              </div>
              <div className="relative w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600">
                {/* Marker */}
                <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white shadow-[0_0_5px_white]" style={{ left: `${((prediction?.kpIndex || 3.6) / 9) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                <span>Quiet (0-3)</span>
                <span>Active (4)</span>
                <span>Storm (5-9)</span>
              </div>
            </div>

          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          Faint and slow CME first seen to the SW by SOHO LASCO C2 beginning at 2026-07-12T09:00Z, as well as by SOHO LASCO C3, STEREO A COR2 and GOES SUVI in later frames. The source of this event is an M1.1 flare from Active Region 14485.
        </p>

        <a href="#" className="text-cyan-500 text-xs font-bold hover:underline">DONKI event ↗</a>
        
        {/* Mock 3D Earth representation */}
        <div className="mt-4 border border-slate-800 rounded p-4 flex flex-col gap-4 relative overflow-hidden bg-slate-900/30">
          <div className="flex justify-between items-center z-10">
            <h4 className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">Earth - Sun-Facing Side</h4>
            <span className="text-[9px] text-slate-500 font-mono border border-slate-700 rounded px-1">at map time</span>
          </div>
          
          <div className="h-32 w-full flex items-center justify-center relative z-10">
            {/* Extremely simple CSS Earth mock */}
            <div className="w-24 h-24 rounded-full bg-blue-600 shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(37,99,235,0.4)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-4 left-2 w-10 h-10 bg-emerald-500/80 rounded-full blur-[2px]" />
              <div className="absolute bottom-2 right-4 w-12 h-8 bg-emerald-500/80 rounded-[40%] blur-[2px]" />
              
              {/* Latitude/Longitude grid lines */}
              <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
              <div className="absolute w-full h-[1px] bg-white/20 top-1/2" />
              <div className="absolute h-full w-[1px] bg-white/20 left-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
