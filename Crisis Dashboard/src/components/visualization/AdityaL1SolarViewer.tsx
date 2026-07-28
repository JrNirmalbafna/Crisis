import { useState, useEffect } from "react";
import { GlassCard } from "../ui-custom/GlassCard";
import { AppDialog } from "../ui-custom/AppDialog";
import { Activity, RotateCw, Maximize2, Layers } from "lucide-react";

// Live NASA SDO AIA imagery — L1 Lagrange point, same vantage as Aditya-L1
// Using 1024px versions without cache-bust query strings (NASA CDN compatible)
const SDO_CHANNELS = [
  {
    key: "aia171",
    label: "AIA 171Å",
    sublabel: "Coronal Loops · Fe IX · EUV",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    url: (_ts: number) =>
      `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg`,
    fullUrl: () => `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0171.jpg`,
    fallbackUrl: () => `https://soho.nascom.nasa.gov/data/realtime/eit_171/512/latest.jpg`,
  },
  {
    key: "aia304",
    label: "AIA 304Å",
    sublabel: "Chromosphere · He II · EUV",
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    url: (_ts: number) =>
      `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0304.jpg`,
    fullUrl: () => `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0304.jpg`,
    fallbackUrl: () => `https://services.swpc.noaa.gov/images/animations/suvi/primary/map/latest.png`,
  },
  {
    key: "aia193",
    label: "AIA 193Å",
    sublabel: "Corona & Holes · Fe XII",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    url: (_ts: number) =>
      `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg`,
    fullUrl: () => `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0193.jpg`,
    fallbackUrl: () => `https://soho.nascom.nasa.gov/data/realtime/eit_195/512/latest.jpg`,
  },
];

export default function AdityaL1SolarViewer() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [activeChannel, setActiveChannel] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-refresh every 15 minutes (SDO updates cadence)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const ch = SDO_CHANNELS[activeChannel];

  return (
    <>
      <GlassCard padding="none" className="h-full relative flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.04] shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-white/90 leading-none">
                L1 Solar Observatory
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                SDO / Aditya-L1
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
              {ch.sublabel} · NASA Heliophysics Fleet
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

        {/* Channel Tabs */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/[0.04] bg-white/[0.01] shrink-0 flex-wrap">
          <Layers className="w-3 h-3 text-white/30 mr-0.5 shrink-0" />
          {SDO_CHANNELS.map((c, idx) => (
            <button
              key={c.key}
              onClick={() => setActiveChannel(idx)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider transition-all duration-200 border ${
                activeChannel === idx
                  ? `${c.bg} ${c.color} ${c.border} shadow-[0_0_10px_rgba(0,0,0,0.3)]`
                  : "bg-transparent text-white/30 border-white/10 hover:text-white/60 hover:border-white/20"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Image Feed */}
        <div className="flex-1 relative w-full p-3 flex flex-col">
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden border border-white/5 min-h-[220px]">
            {/* Spinner behind image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
            </div>

            <img
              key={`${ch.key}-${timestamp}`}
              src={ch.url(timestamp)}
              alt={`${ch.label} solar imagery`}
              className="relative z-10 w-full h-full object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== (ch as any).fallbackUrl()) {
                  target.src = (ch as any).fallbackUrl();
                }
              }}
            />

            {/* Scanning line + crosshair overlay */}
            <div className={`absolute inset-0 z-20 pointer-events-none border ${ch.border} opacity-40`} />
            <div className={`absolute left-1/2 top-0 bottom-0 w-[1px] z-20 pointer-events-none opacity-30`} style={{ background: "currentColor" }} />
            <div className={`absolute top-1/2 left-0 right-0 h-[1px] z-20 pointer-events-none opacity-30`} style={{ background: "currentColor" }} />

            {/* Bottom Attribution */}
            <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
              <span className="text-[9px] font-mono text-white/30 bg-black/60 px-1.5 py-0.5 rounded">
                NASA/SDO · AIA · {ch.label}
              </span>
              <span className={`text-[9px] font-mono ${ch.color} bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                NEAR-REAL-TIME
              </span>
            </div>
          </div>
        </div>

        {/* ISRO Aditya-L1 Context Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.04] bg-gradient-to-r from-orange-950/20 via-transparent to-transparent shrink-0">
          <p className="text-[10px] text-white/40 font-mono leading-relaxed">
            <span className="text-orange-400/80 font-semibold">🛰 Aditya-L1</span>{" "}
            (ISRO, L1 Lagrange point) carries SUIT, SoLEXS &amp; HEL1OS at the same vantage.
            Scientific data via PRADAN portal · {" "}
            <span className="text-white/25">pradan.issdc.gov.in/al1</span>
          </p>
        </div>
      </GlassCard>

      {/* Fullscreen Dialog */}
      <AppDialog
        open={isFullscreen}
        onOpenChange={setIsFullscreen}
        title={`L1 Solar Observatory — ${ch.label}`}
        description={ch.sublabel}
        size="fullscreen"
      >
        {/* Channel switcher inside fullscreen */}
        <div className="flex items-center gap-2 pb-3 flex-wrap">
          {SDO_CHANNELS.map((c, idx) => (
            <button
              key={c.key}
              onClick={() => setActiveChannel(idx)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-200 border ${
                activeChannel === idx
                  ? `${c.bg} ${c.color} ${c.border}`
                  : "bg-transparent text-white/30 border-white/10 hover:text-white/60"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="w-full flex-1 min-h-[60vh] h-full flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden relative border border-white/5">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
          </div>
          <img
            key={`fullscreen-${ch.key}-${timestamp}`}
            src={ch.fullUrl()}
            alt={`${ch.label} fullscreen`}
            className="relative z-10 w-full h-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== (ch as any).fallbackUrl()) {
                target.src = (ch as any).fallbackUrl();
              }
            }}
          />
          <div className={`absolute inset-0 z-20 pointer-events-none border ${ch.border} opacity-30`} />
        </div>
      </AppDialog>
    </>
  );
}
