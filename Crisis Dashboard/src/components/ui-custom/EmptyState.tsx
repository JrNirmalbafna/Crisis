import React from "react";
import { cn } from "../../utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center w-full min-h-[240px]",
        "rounded-[18px] border border-dashed border-white/[0.1] bg-white/[0.01]",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white/30" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      {description && <p className="text-xs text-white/50 mt-1 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { EmptyState } from "@/components/ui-custom/EmptyState";
// import { FolderSearch } from "lucide-react";
// <EmptyState icon={FolderSearch} title="No events found" description="Adjust your filters." />
