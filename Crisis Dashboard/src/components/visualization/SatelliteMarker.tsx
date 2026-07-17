import { motion } from "framer-motion";
import type { SatelliteHealth } from "../../types/types";

interface SatelliteMarkerProps {
  satellite: SatelliteHealth;
  x: number;
  y: number;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent<SVGGElement, MouseEvent>) => void;
  onMouseLeave: () => void;
}

export function SatelliteMarker({ satellite, x, y, onClick, onMouseEnter, onMouseLeave }: SatelliteMarkerProps) {
  // Determine color based on health/trustScore
  let baseColor = "#22d3ee"; // cyan-400 for nominal
  if (satellite.health === "warning" || satellite.trustScore < 85) {
    baseColor = "#fbbf24"; // amber-400
  }
  if (satellite.health === "critical") {
    baseColor = "#fb7185"; // rose-400
  }

  return (
    <motion.g
      className="satellite-marker cursor-pointer"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.15 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Invisible large hit area for easier interaction */}
      <circle cx={x} cy={y} r={16} fill="transparent" />
      
      {/* Soft outer glow */}
      <circle 
        cx={x} 
        cy={y} 
        r={6} 
        fill={baseColor} 
        opacity={0.3} 
        className="pointer-events-none"
        style={{ filter: "blur(2px)" }}
      />
      
      {/* Core marker dot */}
      <circle 
        cx={x} 
        cy={y} 
        r={2.5} 
        fill={baseColor} 
        className="pointer-events-none" 
      />
    </motion.g>
  );
}
