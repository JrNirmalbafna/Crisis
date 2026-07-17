import { motion } from "framer-motion";
import { SUN_X, SUN_Y, SUN_RADIUS } from "./constants";

export function Sun() {
  return (
    <g className="celestial-body-sun">
      <defs>
        <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />    {/* warm white/yellow */}
          <stop offset="50%" stopColor="#f59e0b" />   {/* amber */}
          <stop offset="100%" stopColor="#9a3412" />  {/* deep orange/brown */}
        </radialGradient>
        
        <filter id="sunBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="24" result="blur" />
        </filter>
      </defs>

      {/* Pulsing Ambient Outer Glow */}
      <motion.circle
        cx={SUN_X}
        cy={SUN_Y}
        r={SUN_RADIUS * 2.5}
        fill="#f59e0b"
        opacity={0.3}
        filter="url(#sunBlur)"
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [0.9, 1.1, 0.9]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="pointer-events-none"
      />

      {/* Core Sun Body */}
      <circle
        cx={SUN_X}
        cy={SUN_Y}
        r={SUN_RADIUS}
        fill="url(#sunGradient)"
        className="drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
      />
    </g>
  );
}
