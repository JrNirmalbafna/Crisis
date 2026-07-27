import { useState, useEffect } from "react";
import { GlassCard } from "../ui-custom/GlassCard";
import { AppDialog } from "../ui-custom/AppDialog";
import { Activity, Map, RotateCw, Maximize2 } from "lucide-react";

export default function AuroralForecastMap() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-refresh image every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <GlassCard padding="none" className="h-full relative flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/[0.04] shrink-0">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold text-white/90 leading-none">Ovation Auroral Forecast</h3>
          <p className="text-[11px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
            Polar Precipitation Probability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-md uppercase tracking-wider items-center gap-1">
            <Map className="w-3 h-3" />
            N-Hemisphere
          </div>
          <button 
            onClick={() => setTimestamp(Date.now())}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
            title="Refresh Imagery"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
            title="View Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 relative w-full p-4 flex flex-col">
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#000000] rounded-xl overflow-hidden border border-white/5 min-h-[300px]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
          </div>
          <img 
            src={`https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg?${timestamp}`} 
            alt="OVATION Auroral Forecast Northern Hemisphere"
            className="relative z-10 w-full h-full object-contain"
            loading="lazy"
          />
          {/* Subdued radar overlay */}
          <div 
            className="absolute inset-0 z-20 pointer-events-none opacity-20"
            style={{
              background: "radial-gradient(circle at center, transparent 40%, #000 80%), repeating-radial-gradient(transparent, transparent 20px, rgba(16,185,129,0.1) 21px)"
            }}
          />
        </div>
      </div>
    </GlassCard>
    
    <AppDialog
      open={isFullscreen}
      onOpenChange={setIsFullscreen}
      title="Ovation Auroral Forecast"
      description="Polar Precipitation Probability"
      size="fullscreen"
    >
      <div className="w-full flex-1 min-h-[60vh] h-full flex flex-col items-center justify-center bg-[#000000] rounded-xl overflow-hidden relative border border-white/5">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
        </div>
        <img 
          src={`https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg?${timestamp}`} 
          alt="OVATION Auroral Forecast Northern Hemisphere"
          className="relative z-10 w-full h-full object-contain"
          loading="lazy"
        />
        {/* Subdued radar overlay */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle at center, transparent 40%, #000 80%), repeating-radial-gradient(transparent, transparent 20px, rgba(16,185,129,0.1) 21px)"
          }}
        />
      </div>
    </AppDialog>
    </>
  );
}
