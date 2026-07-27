import { Satellite } from "lucide-react";
import { GlassCard } from "../ui-custom/GlassCard";
import { SatelliteIcon } from "./SatelliteIcon";
import type { SatelliteInfo } from "../../types/types";

interface SatelliteInfoCardProps {
  satellite: SatelliteInfo;
  className?: string;
}

export function SatelliteInfoCard({ satellite, className = "" }: SatelliteInfoCardProps) {
  const isL1 = satellite.orbitPosition === "L1 Lagrange Point";
  
  // Visual distinction: L1 = Cyan tone, Earth = Emerald tone
  const orbitBadgeClasses = isL1 
    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  return (
    <GlassCard hover padding="md" className={`flex flex-col h-full ${className}`}>
      {/* Top Header Row: Icon + Badge */}
      <div className="flex justify-between items-start mb-5">
        {/* ICON_SLOT: This generic icon can be swapped per satellite later */}
        <SatelliteIcon icon={Satellite} />
        
        {/* Orbit Position Tag */}
        <div className={`px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border ${orbitBadgeClasses}`}>
          {satellite.orbitPosition}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        <h3 className="text-lg font-bold text-white/90 tracking-tight">
          {satellite.name}
        </h3>
        
        <p className="text-xs text-white/50 font-mono mt-1 mb-4">
          {satellite.agency} <span className="opacity-50 mx-1">·</span> {satellite.launchYear}
        </p>

        {/* Role Text: allowed to wrap freely, ensures full text is always readable */}
        <p className="text-[13px] text-white/70 leading-relaxed mt-auto">
          {satellite.role}
        </p>
      </div>
    </GlassCard>
  );
}
