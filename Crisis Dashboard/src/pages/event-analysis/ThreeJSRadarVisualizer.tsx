import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useSimulationStore } from "../../store/simulationStore";
import type { CMEEvent } from "../../types/types";

interface Props {
  events: CMEEvent[];
}

// -----------------------------------------------------
// 1. Orbit Ring Component
// -----------------------------------------------------
function OrbitRing({ radius, name, color }: { radius: number; name: string; color?: string }) {
  // Create a dashed circle line
  const points = useMemo(() => {
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    }
    return pts;
  }, [radius]);

  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group>
      {/* @ts-ignore - R3F line element conflicts with React SVG line type */}
      <line geometry={lineGeo}>
        {/* @ts-ignore */}
        <lineDashedMaterial color="#1e293b" dashSize={2} gapSize={2} />
      </line>
      
      {/* Label and Planet Marker */}
      <mesh position={[Math.cos(-Math.PI/4) * radius, Math.sin(-Math.PI/4) * radius, 0]}>
         {color && <circleGeometry args={[color === '#3b82f6' ? 2 : 1.5, 16]} />}
         {color && <meshBasicMaterial color={color} />}
      </mesh>
      
      <Html position={[Math.cos(-Math.PI/4) * (radius + 6), Math.sin(-Math.PI/4) * (radius + 6), 0]} center>
        <div className="text-[9px] font-mono text-slate-500/50 uppercase select-none pointer-events-none">
          {name}
        </div>
      </Html>
    </group>
  );
}

// -----------------------------------------------------
// 2. CME Wedge Component (The Blast Wave)
// -----------------------------------------------------
function CMEWedge({ speed, detectedAt, startAngleDeg, angleLengthDeg, color }: { speed: number, detectedAt: number, startAngleDeg: number, angleLengthDeg: number, color: string }) {
  const meshRef1 = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);
  const htmlRef = useRef<HTMLDivElement>(null);

  const startRad = (startAngleDeg * Math.PI) / 180;
  const lengthRad = (angleLengthDeg * Math.PI) / 180;

  useFrame(() => {
    const simTime = useSimulationStore.getState().simulationTime;
    const hoursSinceDetection = (simTime - detectedAt) / 3600000;
    
    const unitsPerHour = speed * 0.00408;
    
    // Time it takes to reach radius 600 (past Mars)
    const maxHours = 600 / unitsPerHour;
    // Loop the animation so the screen always has active blast waves for demonstration
    const loopedHours = hoursSinceDetection > 0 ? (hoursSinceDetection % maxHours) : 0;
    
    let outerRadius = unitsPerHour * loopedHours;
    if (outerRadius < 0) outerRadius = 0; // Not detected yet
    
    // We only show it if it's erupted and hasn't gone way past Mars
    const isVisible = outerRadius > 0 && outerRadius < 600;
    
    if (meshRef1.current) meshRef1.current.visible = isVisible;
    if (meshRef2.current) meshRef2.current.visible = isVisible;
    if (htmlRef.current) htmlRef.current.style.display = isVisible ? 'block' : 'none';

    if (isVisible && meshRef1.current && meshRef2.current) {
      const innerRadius = Math.max(0.1, outerRadius - 30); // 30 units thick
      
      const newGeo = new THREE.RingGeometry(innerRadius, outerRadius, 32, 1, startRad, lengthRad);
      
      meshRef1.current.geometry.dispose();
      meshRef1.current.geometry = newGeo;
      
      meshRef2.current.geometry.dispose();
      meshRef2.current.geometry = newGeo;
      
      // We don't animate the HTML position in react-three-drei easily without a dedicated ref 
      // wrapper, but we can just let it sit at the outer edge approximately by updating state.
      // However, updating state in useFrame is bad. So we just accept the HTML might not perfectly
      // track the edge in real-time, or we can use a ref on a group and move the group!
    }
  });

  return (
    <group>
      <mesh ref={meshRef1}>
        <ringGeometry args={[0.1, 1, 32, 1, startRad, lengthRad]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={meshRef2}>
        <ringGeometry args={[0.1, 1, 32, 1, startRad, lengthRad]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} wireframe />
      </mesh>
      
      {/* We attach the label to the origin, and just let it be. For a truly dynamic label, 
          we'd need to update its position via a ref in useFrame. For simplicity, we just 
          show it in the tooltip panel on the right instead of floating, OR we can stick it near earth. */}
    </group>
  );
}

// -----------------------------------------------------
// 3. Sun Component with Glow
// -----------------------------------------------------
function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group>
      {/* Sun Core */}
      <mesh ref={sunRef}>
        <circleGeometry args={[12, 32]} />
        <meshBasicMaterial color="#fef3c7" />
      </mesh>
      
      {/* Sun Glow / Halo */}
      <mesh position={[0,0,-1]}>
        <circleGeometry args={[40, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} />
      </mesh>
      
      <Html position={[18, 0, 0]} center>
         <div className="text-[11px] font-mono font-bold text-amber-400 select-none pointer-events-none tracking-widest">SUN</div>
      </Html>
    </group>
  );
}

// -----------------------------------------------------
// 4. Main Scene Setup
// -----------------------------------------------------
function RadarScene({ events }: { events: CMEEvent[] }) {
  const tick = useSimulationStore(s => s.tick);
  
  // Physics tick loop
  useFrame((state, delta) => {
    tick(delta);
    
    // Fix dashed lines rendering
    state.scene.traverse((child) => {
      if (child instanceof THREE.Line) {
        child.computeLineDistances();
      }
    });
  });
  
  return (
    <>
      <color attach="background" args={['#050B14']} />
      
      <OrbitControls 
        enableRotate={false} 
        enablePan={true} 
        enableZoom={true} 
        zoomSpeed={0.8}
        minDistance={100}
        maxDistance={800}
      />
      
      <Stars radius={300} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      <group rotation={[0, 0, 0]}>
        {/* Orbits */}
        <OrbitRing radius={60} name="MERCURY" />
        <OrbitRing radius={110} name="VENUS" />
        <OrbitRing radius={170} name="EARTH" color="#3b82f6" />
        <OrbitRing radius={240} name="MARS" color="#ef4444" />
        
        {/* Dynamic CMEs mapped from real backend data */}
        {events
          .filter(e => e.status === "active" || e.status === "incoming" || e.status === "passed")
          .map((event) => {
            const detectedAtMs = new Date(event.detectedAt).getTime();
            // Fallbacks for data missing from some test entries
            const speed = event.speed || 450;
            const angularWidth = event.angularWidth || 45;
            // Generate a random start angle based on ID to spread them out, 
            // since true latitude/longitude isn't in our base data model yet
            const startAngle = (parseInt(event.id.replace(/\D/g, ''), 10) % 360) - 180;
            const color = event.severity === 'critical' ? '#ef4444' : event.severity === 'high' ? '#f59e0b' : '#3b82f6';
            
            return (
              <CMEWedge 
                key={event.id}
                speed={speed} 
                detectedAt={detectedAtMs} 
                startAngleDeg={startAngle} 
                angleLengthDeg={angularWidth} 
                color={color} 
              />
            );
          })}
          
        {/* Simulated Background Flares (to keep the visualizer active and interesting) */}
        <CMEWedge speed={418} detectedAt={Date.now() - (4 * 24 * 3600000)} startAngleDeg={15} angleLengthDeg={45} color="#fcd34d" />
        <CMEWedge speed={482} detectedAt={Date.now() - (2 * 24 * 3600000)} startAngleDeg={30} angleLengthDeg={15} color="#fb923c" />
        <CMEWedge speed={260} detectedAt={Date.now() - (5 * 24 * 3600000)} startAngleDeg={-40} angleLengthDeg={50} color="#2dd4bf" />

        <Sun />
      </group>
    </>
  );
}

// -----------------------------------------------------
// 5. Canvas Wrapper
// -----------------------------------------------------
export default function ThreeJSRadarVisualizer({ events }: Props) {
  const simulationTime = useSimulationStore(s => s.simulationTime);
  
  return (
    <div className="flex-1 bg-[#050B14] relative overflow-hidden flex items-center justify-center">
      {/* Top Left Tool/Time Overlay */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded border border-slate-700 text-xs font-mono text-slate-200 shadow-md">
          {new Date(simulationTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UT
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
        <div className="text-[10px] font-mono text-slate-500 flex flex-col gap-1">
          <span>WebGL Engine Active</span>
          <span>Pan: Click + Drag | Zoom: Scroll</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 350], fov: 60 }}>
        <RadarScene events={events} />
      </Canvas>
    </div>
  );
}
