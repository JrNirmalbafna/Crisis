import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { MonthlyData } from "./mockData";

interface Props {
  data: MonthlyData[];
}

export default function SolarCycleChart({ data }: Props) {
  // Format the month for X-axis (e.g. '2014-01' -> 'Jan 2014')
  const formatXAxis = (tickItem: string) => {
    const [year, month] = tickItem.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-200">Solar Cycle Progression (15 Years)</h2>
        <p className="text-slate-400 text-sm">Longitudinal analysis of CME frequency versus Geomagnetic Storm Severity (Kp Index)</p>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#475569" 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 11 }}
              minTickGap={30}
            />
            
            {/* Left Y-Axis for CME Count */}
            <YAxis 
              yAxisId="left"
              stroke="#475569"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Right Y-Axis for Kp Index */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#475569"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 9]}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#cbd5e1' }}
              labelFormatter={(label) => formatXAxis(label as string)}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Bar 
              yAxisId="left" 
              dataKey="cmeCount" 
              name="Detected CMEs" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]} 
              opacity={0.6}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="avgKpIndex" 
              name="Avg Kp Index" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
