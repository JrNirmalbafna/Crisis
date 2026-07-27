import { useEffect, useRef } from "react";
import { GlassCard } from "../ui-custom/GlassCard";
import { Orbit } from "lucide-react";

export default function CMEPropagationMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let radius = 10;
    
    // Scale for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;

    // Center coordinates
    const cx = w / 2;
    const cy = h / 2;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // Draw background grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let i = 0; i < h; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }

      // Draw Earth Orbit
      ctx.beginPath();
      ctx.arc(cx, cy, h/3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Sun
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#FBBF24"; // Amber
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Earth
      const earthX = cx;
      const earthY = cy + h/3;
      ctx.beginPath();
      ctx.arc(earthX, earthY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#3B82F6"; // Blue
      ctx.shadowColor = "#60A5FA";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label Earth
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "10px monospace";
      ctx.fillText("Earth", earthX + 10, earthY + 3);

      // Draw propagating CME cone
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Simulating a cone aiming slightly off-center of Earth
      const angleCenter = Math.PI / 2 - 0.1; 
      const coneWidth = Math.PI / 4; // 45 degrees
      
      const startAngle = angleCenter - coneWidth/2;
      const endAngle = angleCenter + coneWidth/2;

      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Update radius
      radius += 0.5; // expansion speed
      
      // Reset if it passes Earth significantly
      if (radius > h/2) {
        radius = 10;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <GlassCard padding="none" className="h-full relative flex flex-col">
      <div className="flex items-start justify-between p-5 border-b border-white/[0.04] shrink-0">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold text-white/90 leading-none">CME Propagation Simulator</h3>
          <p className="text-[11px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
            Ecliptic Plane Kinematic Model (WSA-Enlil Proxy)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono rounded-md uppercase tracking-wider items-center gap-1">
            <Orbit className="w-3 h-3 inline-block mr-1" />
            2D Ecliptic
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative w-full p-4 flex flex-col">
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-xl overflow-hidden border border-white/5 min-h-[350px]">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full absolute inset-0"
            style={{ display: "block" }}
          />
        </div>
      </div>
    </GlassCard>
  );
}
