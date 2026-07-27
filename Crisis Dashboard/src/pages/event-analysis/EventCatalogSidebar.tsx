import type { CMEEvent } from "../../types/types";

interface Props {
  events: CMEEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
}

export default function EventCatalogSidebar({ events, selectedEventId, onSelectEvent }: Props) {
  return (
    <div className="w-[280px] bg-[#020617] border-r border-slate-800/50 flex flex-col h-full overflow-y-auto hidden md:flex shrink-0">
      
      <div className="p-4 border-b border-slate-800/50 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-200 font-bold uppercase tracking-widest text-xs">CME Catalog</h2>
          <span className="text-slate-500 text-[10px]">NASA DONKI</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1 mt-2">
          {/* Mock stats boxes like the screenshot */}
          <div className="border border-slate-700/50 rounded flex flex-col items-center justify-center py-1">
             <span className="text-cyan-400 font-bold text-xs">S</span>
             <span className="text-slate-500 text-[9px]">277</span>
          </div>
          <div className="border border-amber-500/30 rounded flex flex-col items-center justify-center py-1 bg-amber-500/5">
             <span className="text-amber-400 font-bold text-xs">C</span>
             <span className="text-slate-500 text-[9px]">183</span>
          </div>
          <div className="border border-slate-700/50 rounded flex flex-col items-center justify-center py-1">
             <span className="text-orange-400 font-bold text-xs">O</span>
             <span className="text-slate-500 text-[9px]">13</span>
          </div>
          <div className="border border-rose-500/30 rounded flex flex-col items-center justify-center py-1 bg-rose-500/5">
             <span className="text-rose-400 font-bold text-xs">ER</span>
             <span className="text-slate-500 text-[9px]">8</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {events.map((ev) => {
          const isSelected = selectedEventId === ev.id;
          return (
            <div 
              key={ev.id}
              onClick={() => onSelectEvent(ev.id)}
              className={`p-3 rounded border cursor-pointer transition-all ${isSelected ? 'border-amber-500/50 bg-slate-800/50' : 'border-slate-800/50 hover:bg-slate-900/50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-slate-300 font-mono text-xs">{new Date(ev.detectedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UT</span>
                <span className="border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-slate-400 font-mono">S slow</span>
              </div>
              <div className="font-mono text-xs text-slate-200 mb-2">
                {ev.speed ? `${Math.round(ev.speed)} km/s` : '--- km/s'} <span className="text-slate-500 ml-1">N29W40 ±29°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${ev.severity === 'critical' || ev.severity === 'high' ? 'border-amber-500/50 text-amber-500' : 'border-slate-600 text-slate-400'}`}>
                  {ev.severity === 'critical' ? 'EARTH DIRECTED' : 'GLANCING'}
                </span>
                <span className="text-[9px] text-slate-500 truncate">
                  → Earth {new Date(ev.estimatedArrival || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800/50 mt-auto">
        <h2 className="text-slate-200 font-bold uppercase tracking-widest text-xs mb-3">Recent Flares</h2>
        <div className="flex flex-col gap-2">
           <div className="flex justify-between text-xs font-mono">
             <span className="text-slate-400">Jul 18 03:45 UT</span>
             <span className="text-slate-300">B9.0</span>
           </div>
           <div className="flex justify-between text-xs font-mono">
             <span className="text-slate-400">Jul 18 01:20 UT</span>
             <span className="text-cyan-400">C2.2</span>
           </div>
           <div className="flex justify-between text-xs font-mono">
             <span className="text-slate-400">Jul 17 00:02 UT</span>
             <span className="text-cyan-400">C1.5</span>
           </div>
        </div>
      </div>
    </div>
  );
}
