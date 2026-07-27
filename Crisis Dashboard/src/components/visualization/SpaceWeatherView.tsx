import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, SAT_POSITIONS, EARTH_X, EARTH_Y } from "./constants";
import { SunEarthAxis } from "./SunEarthAxis";
import { Sun } from "./Sun";
import { Earth } from "./Earth";
import { CMEMarker } from "./CMEMarker";
import { SatelliteMarker } from "./SatelliteMarker";
import { SatelliteDetailDialog } from "./SatelliteDetailDialog";
import { getSatelliteHealth } from "../../services/api";
import { getSatelliteInfoById } from "../../constants/satelliteInfo";
import { useEffect } from "react";
import type { SatelliteHealth } from "../../types/types";

export function SpaceWeatherView() {
  const { data: satellites = [] } = useQuery({
    queryKey: ["satellite-health"],
    queryFn: getSatelliteHealth,
  });

  const [selectedSat, setSelectedSat] = useState<SatelliteHealth | null>(null);
  const [hoveredSat, setHoveredSat] = useState<{ sat: SatelliteHealth; x: number; y: number } | null>(null);
  
  // Step 3 temporary state for CME movement
  const [progress, setProgress] = useState(30);
  const [hasImpacted, setHasImpacted] = useState(false);

  useEffect(() => {
    if (progress >= 98 && !hasImpacted) {
      setHasImpacted(true);
    } else if (progress < 98 && hasImpacted) {
      setHasImpacted(false);
    }
  }, [progress, hasImpacted]);

  const handleMarkerEnter = (e: React.MouseEvent, sat: SatelliteHealth) => {
    setHoveredSat({ sat, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-w-full max-h-full"
      >
        {/* Background elements */}
        <SunEarthAxis />
        
        {/* CME Marker (Rendered behind celestial bodies but above axis) */}
        <CMEMarker progress={progress} eventType="Halo CME" />

        {/* Celestial Bodies */}
        <Sun />
        <Earth />

        {/* Earth Arrival Flash */}
        <AnimatePresence>
          {hasImpacted && (
            <motion.circle
              key="earth-flash"
              cx={EARTH_X}
              cy={EARTH_Y}
              initial={{ r: 8, opacity: 0.9, strokeWidth: 4 }}
              animate={{ r: 48, opacity: 0, strokeWidth: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              stroke="#38bdf8" // sky-400
              fill="none"
              className="pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        {/* Satellite Markers */}
        {satellites.map((sat) => {
          const pos = SAT_POSITIONS[sat.name];
          if (!pos) return null; // Fallback if name doesn't match
          
          return (
            <SatelliteMarker
              key={sat.name}
              satellite={sat}
              x={pos.x}
              y={pos.y}
              onClick={() => setSelectedSat(sat)}
              onMouseEnter={(e) => handleMarkerEnter(e, sat)}
              onMouseLeave={() => setHoveredSat(null)}
            />
          );
        })}
      </svg>

      {/* HTML Tooltip Overlay (Fixed position so it's not affected by SVG scaling) */}
      <AnimatePresence>
        {hoveredSat && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: hoveredSat.x,
              top: hoveredSat.y - 12,
              transform: "translate(-50%, -100%)", // Center horizontally, above cursor
            }}
          >
            <div className="flex flex-col gap-1 px-3 py-2 rounded-lg shadow-xl"
                 style={{
                   background: "rgba(11, 23, 40, 0.85)",
                   border: "1px solid rgba(255, 255, 255, 0.1)",
                   backdropFilter: "blur(12px)",
                 }}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${hoveredSat.sat.health === 'nominal' ? 'bg-emerald-400' : hoveredSat.sat.health === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-xs font-semibold text-white/90">{hoveredSat.sat.name}</span>
              </div>
              <span className="text-[10px] text-white/60 font-mono leading-tight max-w-[160px]">
                {getSatelliteInfoById(hoveredSat.sat.name)?.role || "Space environment monitor"}
              </span>
              <span className={`text-[9px] font-bold uppercase mt-0.5 ${hoveredSat.sat.health === 'nominal' ? 'text-emerald-400/80' : hoveredSat.sat.health === 'warning' ? 'text-amber-400/80' : 'text-rose-400/80'}`}>
                {hoveredSat.sat.health}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Dialog */}
      <SatelliteDetailDialog 
        open={!!selectedSat} 
        onOpenChange={(isOpen) => !isOpen && setSelectedSat(null)} 
        satellite={selectedSat}
      />

      {/* Temporary Debug Slider (to be removed in Step 4) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[300px] bg-slate-900/80 backdrop-blur border border-white/10 p-4 rounded-xl z-50 flex flex-col gap-2">
        <label className="text-xs text-white/70 font-mono flex justify-between">
          <span>TEST PROGRESS</span>
          <span>{progress}%</span>
        </label>
        <input 
          type="range" 
          min="0" max="100" 
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>
    </div>
  );
}
