import type { SolarParameter, PredictionResult } from "../../types/types";

interface Props {
  params: SolarParameter[];
  prediction: PredictionResult | null;
}

export default function TopTelemetryBar({ params, prediction }: Props) {
  const current = params.length > 0 ? params[params.length - 1] : null;

  return (
    <div className="w-full flex items-center bg-[#050B14] border-b border-slate-800/50 px-4 py-3 text-xs font-mono shadow-md z-10 shrink-0">
      {/* Brand / Logo */}
      <div className="flex items-center gap-2 mr-8">
        <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] flex-shrink-0" />
        <span className="text-amber-500 font-bold tracking-widest text-lg ml-1" style={{ letterSpacing: '0.15em' }}>CME TRACKER</span>
        <span className="text-slate-500 tracking-wide hidden lg:inline ml-2 text-xs">Sun → Earth solar storm watch</span>
      </div>

      <div className="flex-1 flex items-center gap-6 justify-center">
        {/* Solar Wind */}
        <div className="flex items-center gap-3">
          <span className="text-slate-500 uppercase tracking-widest text-[9px] leading-tight text-right hidden md:block">Solar<br/>Wind</span>
          <span className="text-3xl font-bold text-emerald-400">{current ? Math.round(current.speed) : "---"}</span>
          <span className="text-emerald-400/60 flex flex-col leading-none text-[10px]">
            <span>km/</span>
            <span>s</span>
          </span>
        </div>

        {/* Density */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">Density</span>
          <span className="text-xl font-bold text-slate-200">{current ? current.density.toFixed(1) : "---"}</span>
          <span className="text-slate-500 flex flex-col leading-none text-[9px]">
            <span>p/</span>
            <span>cm³</span>
          </span>
        </div>

        {/* Bz */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">Bz</span>
          <span className={`text-xl font-bold ${current && current.magneticField < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {current ? current.magneticField.toFixed(1) : "---"}
          </span>
          <span className="text-slate-500 text-[10px]">nT</span>
        </div>

        {/* KP */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">Kp</span>
          <span className="text-xl font-bold text-emerald-400">{prediction?.kpIndex?.toFixed(1) || "1.7"}</span>
          
          <div className="flex items-end gap-[1px] h-3">
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <div 
                key={i} 
                className={`w-1.5 h-full ${i <= (prediction?.kpIndex || 1.7) ? 'bg-emerald-500' : 'bg-slate-800'}`}
                style={{ opacity: i <= (prediction?.kpIndex || 1.7) ? 1 : 0.3 }}
              />
            ))}
          </div>
          <span className="text-slate-500 text-[10px] ml-1">{prediction?.kpIndex && prediction.kpIndex > 4 ? 'storm' : 'quiet'}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4 hidden md:flex">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider">Data</span>
        <span className="text-emerald-400 font-bold">cached</span>
        <span className="text-slate-500 text-[10px] flex flex-col leading-tight items-center">
          <span>7m</span>
          <span>ago</span>
        </span>
      </div>
    </div>
  );
}
