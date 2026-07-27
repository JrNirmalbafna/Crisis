import { Download } from "lucide-react";
import type { HistoricalCME } from "./mockData";

interface Props {
  events: HistoricalCME[];
}

export default function HistoricalEventsGrid({ events }: Props) {
  // Take top 50 for the table to avoid massive DOM
  const tableData = events.slice(0, 50);

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case "critical": return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-900/50 text-red-400 border border-red-800">Critical</span>;
      case "high": return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-orange-900/50 text-orange-400 border border-orange-800">High</span>;
      case "medium": return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-yellow-900/50 text-yellow-400 border border-yellow-800">Medium</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-900/50 text-blue-400 border border-blue-800">Low</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg flex-[2] flex flex-col h-full min-h-[300px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Historical Event Database</h2>
          <p className="text-slate-400 text-sm">Most severe events recorded (Top 50)</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded border border-slate-700 transition-colors">
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>
      
      <div className="flex-1 overflow-auto rounded border border-slate-800 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-slate-950 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-xs font-mono text-slate-400 font-normal border-b border-slate-800">Date (UT)</th>
              <th className="p-3 text-xs font-mono text-slate-400 font-normal border-b border-slate-800">Type</th>
              <th className="p-3 text-xs font-mono text-slate-400 font-normal border-b border-slate-800">Speed</th>
              <th className="p-3 text-xs font-mono text-slate-400 font-normal border-b border-slate-800">Width</th>
              <th className="p-3 text-xs font-mono text-slate-400 font-normal border-b border-slate-800">Kp Max</th>
              <th className="p-3 text-xs font-mono text-slate-400 font-normal border-b border-slate-800">Severity</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((evt) => (
              <tr key={evt.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                <td className="p-3 text-sm text-slate-300 font-mono whitespace-nowrap">
                  {new Date(evt.date).toISOString().substring(0, 10)}
                </td>
                <td className="p-3 text-sm text-slate-300">{evt.type}</td>
                <td className="p-3 text-sm font-mono text-cyan-400">{evt.speed} <span className="text-slate-500 text-xs">km/s</span></td>
                <td className="p-3 text-sm font-mono text-amber-400">{evt.angularWidth}°</td>
                <td className="p-3 text-sm font-mono text-red-400">{evt.kpIndex}</td>
                <td className="p-3">{getSeverityBadge(evt.severity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
