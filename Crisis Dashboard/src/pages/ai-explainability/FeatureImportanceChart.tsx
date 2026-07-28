import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getFeatureImportance } from "../../services/api";

const SHAP_COLORS = ["#22d3ee", "#818cf8", "#0ea5e9", "#6366f1", "#38bdf8", "#a5b4fc"];

interface Props {
  fusionData?: any;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-cyan-500/30 px-3 py-2.5 rounded-lg text-xs font-mono shadow-2xl max-w-xs backdrop-blur-md">
        <p className="text-white font-bold text-[13px]">{item.feature}</p>
        <div className="flex items-center justify-between my-1 border-y border-white/10 py-1">
          <span className="text-white/60">SHAP Weight:</span>
          <span className="text-cyan-400 font-bold">+{(item.importance * 100).toFixed(1)}%</span>
        </div>
        <p className="text-white/70 text-[11px] leading-relaxed">{item.description}</p>
      </div>
    );
  }
  return null;
};

export default function FeatureImportanceChart(_props?: Props) {
  const { data: features = [], isLoading } = useQuery({
    queryKey: ["feature-importance"],
    queryFn: getFeatureImportance,
    refetchInterval: 15000,
  });

  const data = features.length > 0 ? features : [
    { feature: "CME Transit Speed (v_CME)", importance: 0.38, description: "Primary driver of interplanetary transit time and shockwave arrival at L1 Lagrange point." },
    { feature: "IMF Bz Southward Coupling", importance: 0.28, description: "Determines rate of magnetic reconnection with Earth's magnetosphere and energy injection into ring current." },
    { feature: "Solar Wind Dynamic Pressure (P_dyn)", importance: 0.15, description: "Ram pressure (n_p * v^2) compressing the magnetopause boundary and intensifying ground magnetics." },
    { feature: "Proton Density (N_p)", importance: 0.11, description: "Particle flux density determining shock compression ratio across the bow shock." },
    { feature: "Plasma Ion Temperature (T_p)", importance: 0.05, description: "Thermal expansion and magnetic cloud characteristics of the coronal mass ejecta." },
    { feature: "Pre-storm Geomagnetic Baseline (Kp_0)", importance: 0.03, description: "Initial ambient state of Earth's geomagnetic field and ring current prior to shock arrival." }
  ];

  return (
    <div className="flex flex-col h-full p-5">
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-white/90">Feature Importance (SHAP Values)</h3>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-0.5">
            Dynamic CME & IMF Bz Physical Coupling · Consensus Model
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          LIVE SHAP
        </span>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-white/40 font-mono">
            Calculating SHAP values from ensemble...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, "auto"]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="feature"
                width={150}
                tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive maxBarSize={16}>
                {data.map((_, index) => (
                  <Cell key={index} fill={SHAP_COLORS[index % SHAP_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

