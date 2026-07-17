import { motion } from "framer-motion";
import { EARTH_X, EARTH_Y, EARTH_RADIUS, GOES_ORBIT_RADIUS } from "./constants";

export function Earth() {
  return (
    <g className="celestial-body-earth">
      <defs>
        <radialGradient id="earthGradient" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#67e8f9" />    {/* cyan-300 */}
          <stop offset="60%" stopColor="#0ea5e9" />   {/* sky-500 */}
          <stop offset="100%" stopColor="#0369a1" />  {/* sky-700 */}
        </radialGradient>
        
        <filter id="earthBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
        </filter>
      </defs>

      {/* Pulsing Ambient Outer Glow */}
      <motion.circle
        cx={EARTH_X}
        cy={EARTH_Y}
        r={EARTH_RADIUS * 2}
        fill="#0ea5e9"
        opacity={0.3}
        filter="url(#earthBlur)"
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ 
          duration: 4.5, // slightly different timing than Sun
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="pointer-events-none"
      />

      {/* GOES Orbit Ring */}
      <circle
        cx={EARTH_X}
        cy={EARTH_Y}
        r={GOES_ORBIT_RADIUS}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="1"
        strokeDasharray="2 4"
        className="pointer-events-none"
      />
      {/* GOES_MARKER_SLOT: satellite marker will animate along this ring in a later step */}

      {/* Core Earth Body */}
      <circle
        cx={EARTH_X}
        cy={EARTH_Y}
        r={EARTH_RADIUS}
        fill="url(#earthGradient)"
        className="drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]"
      />
    </g>
  );
}
