import type { LucideIcon } from "lucide-react";


interface SatelliteIconProps {
  icon: LucideIcon;
  className?: string;
}

export function SatelliteIcon({ icon: Icon, className = "" }: SatelliteIconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft background glow */}
      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
      
      {/* Badge container */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-inner">
        <Icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
      </div>
    </div>
  );
}
