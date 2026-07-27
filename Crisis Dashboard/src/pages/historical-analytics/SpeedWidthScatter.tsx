import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import type { HistoricalCME } from "./mockData";

interface Props {
  events: HistoricalCME[];
}

export default function SpeedWidthScatter({ events }: Props) {
  // Color scale based on severity
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case "critical": return "#ef4444"; // red
      case "high": return "#f97316"; // orange
      case "medium": return "#eab308"; // yellow
      default: return "#3b82f6"; // blue
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg">
          <p className="text-slate-200 font-bold mb-1">{data.type}</p>
          <p className="text-slate-400 text-xs mb-2">{new Date(data.date).toLocaleDateString()}</p>
          <p className="text-sm"><span className="text-slate-500">Speed:</span> <span className="text-cyan-400">{data.speed} km/s</span></p>
          <p className="text-sm"><span className="text-slate-500">Width:</span> <span className="text-amber-400">{data.angularWidth}°</span></p>
          <p className="text-sm"><span className="text-slate-500">Kp Index:</span> <span className="text-red-400">{data.kpIndex}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg flex-1">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-200">Kinematics Correlation</h2>
        <p className="text-slate-400 text-sm">CME Speed vs. Angular Width distribution</p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            
            <XAxis 
              type="number" 
              dataKey="angularWidth" 
              name="Angular Width" 
              unit="°" 
              stroke="#475569" 
              tick={{ fontSize: 11 }}
              label={{ value: 'Angular Width (°)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
            />
            
            <YAxis 
              type="number" 
              dataKey="speed" 
              name="Speed" 
              unit=" km/s" 
              stroke="#475569" 
              tick={{ fontSize: 11 }}
              label={{ value: 'Speed (km/s)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            <Scatter name="CMEs" data={events} fill="#8884d8">
              {events.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} opacity={0.6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
