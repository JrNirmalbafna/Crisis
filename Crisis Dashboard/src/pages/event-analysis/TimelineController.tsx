import React, { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useSimulationStore } from "../../store/simulationStore";

export default function TimelineController() {
  const { simulationTime, isPlaying, playbackSpeed, setSimulationTime, setIsPlaying, setPlaybackSpeed } = useSimulationStore();
  
  const [localTime, setLocalTime] = useState(simulationTime);

  // Sync local slider state when not dragging (for performance)
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(useSimulationStore.getState().simulationTime);
    }, 100); // 10fps update for the slider thumb
    return () => clearInterval(interval);
  }, []);

  // Time boundaries for the slider: 7 days ago to 3 days in future
  const now = Date.now();
  const minTime = now - (7 * 24 * 60 * 60 * 1000);
  const maxTime = now + (3 * 24 * 60 * 60 * 1000);

  const speeds = [
    { label: "1h/s", value: 1 },
    { label: "3h/s", value: 3 },
    { label: "6h/s", value: 6 },
    { label: "12h/s", value: 12 },
    { label: "1d/s", value: 24 },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setLocalTime(newTime);
    setSimulationTime(newTime);
  };

  const jumpToLive = () => {
    setSimulationTime(Date.now());
    setIsPlaying(false);
  };

  return (
    <div className="h-16 bg-[#020617] border-t border-slate-800 flex items-center px-4 gap-4 z-10 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      
      {/* Play/Pause */}
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-8 h-8 rounded bg-slate-800/50 hover:bg-slate-700 text-amber-500 flex items-center justify-center transition-colors border border-slate-700/50"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* LIVE toggle */}
      <button 
        onClick={jumpToLive}
        className="px-4 py-1.5 rounded border border-slate-700/50 hover:bg-slate-800/50 text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors"
      >
        Live
      </button>

      {/* Speeds */}
      <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800/80">
        {speeds.map((s) => (
          <button
            key={s.label}
            onClick={() => setPlaybackSpeed(s.value)}
            className={`px-3 py-1 text-[10px] font-mono rounded ${playbackSpeed === s.value ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button className="px-4 py-1.5 rounded border border-slate-700/50 hover:bg-slate-800/50 text-slate-400 font-mono text-[10px] uppercase tracking-widest ml-4 transition-colors">
        Isolate
      </button>

      {/* Scrubber */}
      <div className="flex-1 ml-4 relative flex items-center h-full">
        {/* Track visualization (markers) */}
        <div className="absolute w-full flex justify-between px-2 pointer-events-none top-2">
          {Array.from({ length: 11 }).map((_, i) => (
             <div key={i} className="flex flex-col items-center">
                <span className="text-[9px] text-slate-600 font-mono mb-1">{i - 7}d</span>
                <div className="w-px h-1.5 bg-slate-700" />
             </div>
          ))}
        </div>

        <input 
          type="range"
          min={minTime}
          max={maxTime}
          value={localTime}
          onChange={handleSliderChange}
          className="w-full mt-4 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:-mt-1 cursor-pointer relative z-10"
        />
        
        {/* NOW marker */}
        <div 
          className="absolute top-7 bottom-0 w-px bg-amber-500 z-0 pointer-events-none"
          style={{ left: `${((now - minTime) / (maxTime - minTime)) * 100}%` }}
        >
          <span className="absolute -top-3 -translate-x-1/2 text-[9px] text-amber-500 font-mono font-bold">NOW</span>
        </div>
      </div>
      
    </div>
  );
}
