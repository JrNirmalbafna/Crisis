import React, { useState } from "react";
import { Maximize2, Download } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { AppDialog } from "./AppDialog";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer } from "recharts";

export interface ChartWrapperProps {
  title: string;
  description?: string;
  data?: any[]; // Accepts any array for Recharts
  isLoading?: boolean;
  isEmpty?: boolean;
  children: React.ReactElement; // The Recharts component (LineChart, etc.)
  height?: number | string;
  className?: string;
}

export function ChartWrapper({
  title,
  description,
  data = [],
  isLoading = false,
  isEmpty = false,
  children,
  height = 300,
  className,
}: ChartWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleExport = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val}"` : val
      ).join(",")
    ).join("\n");
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isActuallyEmpty = isEmpty || (!isLoading && data.length === 0);

  const renderContent = (currentHeight: number | string) => {
    if (isLoading) {
      return (
        <div className="flex-1 p-4 flex flex-col justify-end gap-2" style={{ height: currentHeight }}>
           <LoadingSkeleton variant="chart" className="h-full" />
        </div>
      );
    }
    
    if (isActuallyEmpty) {
      return (
        <div className="flex-1 flex items-center justify-center p-4" style={{ height: currentHeight }}>
          <EmptyState icon={BarChart3} title="No Data Available" description="There is no data to display for this chart." />
        </div>
      );
    }

    return (
      <div className="flex-1 relative w-full" style={{ height: currentHeight }}>
        {/* We wrap children in ResponsiveContainer. The child (e.g. LineChart) must not have its own width/height fixed to pixel values if we want it to respond. */}
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    );
  };

  const header = (
    <div className="flex items-start justify-between p-5 border-b border-white/[0.04] shrink-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-white/90 leading-none">{title}</h3>
        {description && (
          <p className="text-[11px] text-white/50 font-mono tracking-wide uppercase mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
          aria-label="Export Chart"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsFullscreen(true)}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <GlassCard padding="none" className={className}>
        <div className="flex flex-col h-full">
          {header}
          {renderContent(height)}
        </div>
      </GlassCard>

      <AppDialog
        open={isFullscreen}
        onOpenChange={setIsFullscreen}
        title={title}
        description={description}
        size="fullscreen"
      >
        <div className="w-full flex-1 min-h-[60vh] h-[60vh]">
          {renderContent("100%")}
        </div>
      </AppDialog>
    </>
  );
}

// ── Reusable Chart Tooltip Content ───────────────────────────────────────────
// Usage: <Tooltip content={<ChartTooltipContent />} /> inside a Recharts component

export function ChartTooltipContent({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a]/95 border border-white/10 px-3 py-2.5 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px]">
        {label && (
          <div className="text-[11px] text-white/50 font-mono mb-2 pb-1.5 border-b border-white/10">
            {label}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-xs text-white/70 capitalize">
                  {entry.name}
                </span>
              </div>
              <span className="text-xs font-semibold text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { ChartWrapper, ChartTooltipContent } from "@/components/ui-custom/ChartWrapper";
// import { LineChart, Line, Tooltip } from "recharts";
// 
// <ChartWrapper title="Solar Wind" data={data}>
//   <LineChart data={data}>
//     <Tooltip content={<ChartTooltipContent />} />
//     <Line dataKey="speed" stroke="#3b82f6" />
//   </LineChart>
// </ChartWrapper>
