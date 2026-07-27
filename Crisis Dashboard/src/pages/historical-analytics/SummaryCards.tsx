import { Activity, AlertTriangle, Wind, Zap } from "lucide-react";

interface Props {
  kpis: {
    totalCMEs: number;
    severeStorms: number;
    avgSpeed: number;
    maxKp: number;
  };
}

export default function SummaryCards({ kpis }: Props) {
  const cards = [
    { label: "Total CME Events (15 Yrs)", value: kpis.totalCMEs.toLocaleString(), icon: Activity, color: "text-blue-400" },
    { label: "Severe Storms (Kp > 7)", value: kpis.severeStorms.toLocaleString(), icon: AlertTriangle, color: "text-red-400" },
    { label: "Average CME Speed", value: `${kpis.avgSpeed} km/s`, icon: Wind, color: "text-cyan-400" },
    { label: "Max Recorded Kp Index", value: kpis.maxKp, icon: Zap, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-3xl font-bold font-mono ${card.color}`}>{card.value}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
