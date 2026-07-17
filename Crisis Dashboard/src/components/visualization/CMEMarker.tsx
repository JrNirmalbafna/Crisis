import { motion } from "framer-motion";
import { interpolatePosition } from "../../utils/interpolatePosition";
import { SUN_X, SUN_Y, EARTH_X, EARTH_Y } from "./constants";
import type { CMEEventType } from "../../types/types";

// Same hex values as the tailwind colors from EventsTimeline
const EVENT_COLORS: Record<CMEEventType, string> = {
  "Halo CME":    "#fb7185", // rose-400
  "Solar Flare": "#fbbf24", // amber-400
  "Solar Wind":  "#22d3ee", // cyan-400
  "SEP":         "#c084fc", // purple-400
  "CIR":         "#60a5fa", // blue-400
};

interface CMEMarkerProps {
  progress: number;
  eventType: CMEEventType;
  id?: string; // Optional for uniqueness if rendering multiple
}

export function CMEMarker({ progress, eventType, id = "cme-marker" }: CMEMarkerProps) {
  const { x, y } = interpolatePosition(SUN_X, SUN_Y, EARTH_X, EARTH_Y, progress);
  const color = EVENT_COLORS[eventType] || EVENT_COLORS["Solar Flare"];
  
  // Angle of travel (in radians)
  const angle = Math.atan2(EARTH_Y - SUN_Y, EARTH_X - SUN_X);
  const angleDegrees = (angle * 180) / Math.PI;

  const gradientId = `tail-gradient-${id}`;

  return (
    <motion.g
      className="cme-marker pointer-events-none"
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      // Keep it on top of the axis line but below UI overlays
      style={{ zIndex: 10 }}
    >
      <defs>
        {/* Tail gradient: solid at the right (head), transparent at the left (tail end) */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={0} />
          <stop offset="100%" stopColor={color} stopOpacity={0.8} />
        </linearGradient>
      </defs>

      {/* Trailing Tail */}
      <g transform={`rotate(${angleDegrees})`}>
        {/* An elongated ellipse trailing behind the origin (0,0) */}
        <ellipse 
          cx={-30} 
          cy={0} 
          rx={30} 
          ry={3} 
          fill={`url(#${gradientId})`}
          style={{ filter: "blur(1px)" }}
        />
      </g>

      {/* Energetic ambient pulse loop */}
      <motion.circle
        cx={0}
        cy={0}
        r={12}
        fill={color}
        opacity={0.4}
        style={{ filter: "blur(3px)" }}
        animate={{ 
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      />

      {/* Core glowing marker */}
      <circle 
        cx={0} 
        cy={0} 
        r={4} 
        fill="#fff" 
        style={{ 
          boxShadow: `0 0 10px ${color}`, // fallback
          filter: `drop-shadow(0 0 4px ${color})` 
        }} 
      />
    </motion.g>
  );
}
