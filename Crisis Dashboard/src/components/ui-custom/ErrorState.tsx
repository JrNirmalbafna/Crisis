import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../utils";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description, 
  onRetry,
  className, 
  ...props 
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center w-full min-h-[240px]",
        "rounded-[18px] border border-rose-500/20 bg-rose-500/[0.03]",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-rose-400">{title}</h3>
      {description && <p className="text-xs text-rose-400/60 mt-1 max-w-sm leading-relaxed">{description}</p>}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { ErrorState } from "@/components/ui-custom/ErrorState";
// <ErrorState title="Failed to load telemetry" onRetry={() => refetch()} />
