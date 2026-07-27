import { useState, useEffect } from "react";
import { GlassCard } from "../ui-custom/GlassCard";
import { AppDialog } from "../ui-custom/AppDialog";
import { Activity, RotateCw, Maximize2 } from "lucide-react";

export default function SolarCoronagraphViewer() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-refresh image every 5 minutes (NOAA updates frequently)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <GlassCard padding="none" className="h-full relative flex flex-col">
      {/* Header matching ChartWrapper style */}
      <div className="flex items-start justify-between p-5 border-b border-white/[0.04] shrink-0">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold text-white/90 leading-none">SOHO LASCO C2 Coronagraph</h3>
          <p className="text-[11px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
            White-light Coronal Mass Ejection Tracker
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden border border-white/5 min-h-[300px]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
          </div>
          <img 
            src={`https://services.swpc.noaa.gov/images/animations/lasco-c2/latest.jpg?${timestamp}`} 
            alt="SOHO LASCO C2"
            className="relative z-10 w-full h-full object-contain"
            loading="lazy"
          />
          {/* Crosshair Overlay for NASA aesthetics */}
          <div className="absolute inset-0 z-20 pointer-events-none border border-cyan-500/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-500/20 z-20 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/20 z-20 pointer-events-none" />
        </div>
      </div>
    </GlassCard>
    
    <AppDialog
      open={isFullscreen}
      onOpenChange={setIsFullscreen}
      title="SOHO LASCO C2 Coronagraph"
      description="White-light Coronal Mass Ejection Tracker"
      size="fullscreen"
    >
      <div className="w-full flex-1 min-h-[60vh] h-full flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden relative border border-white/5">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
        </div>
        <img 
          src={`https://services.swpc.noaa.gov/images/animations/lasco-c2/latest.jpg?${timestamp}`} 
          alt="SOHO LASCO C2"
          className="relative z-10 w-full h-full object-contain"
          loading="lazy"
        />
        <div className="absolute inset-0 z-20 pointer-events-none border border-cyan-500/20" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-500/20 z-20 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/20 z-20 pointer-events-none" />
      </div>
    </AppDialog>
    </>
  );
}
