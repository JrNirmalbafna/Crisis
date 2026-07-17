import * as React from "react";
import { Loader2, SearchX, AlertCircle } from "lucide-react";
import { cn } from "../../utils";

interface StateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function LoadingState({ title = "Loading...", description, className, ...props }: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] w-full",
        className
      )}
      {...props}
    >
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
      <h3 className="text-lg font-medium text-white/90">{title}</h3>
      {description && <p className="text-sm text-white/50 mt-1">{description}</p>}
    </div>
  );
}

export function EmptyState({ title = "No data found", description, className, ...props }: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] w-full",
        "rounded-[18px] border border-dashed border-white/[0.1] bg-white/[0.01]",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        <SearchX className="w-6 h-6 text-white/30" />
      </div>
      <h3 className="text-lg font-medium text-white/90">{title}</h3>
      {description && <p className="text-sm text-white/50 mt-1">{description}</p>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, className, ...props }: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] w-full",
        "rounded-[18px] border border-rose-500/20 bg-rose-500/[0.02]",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-rose-400" />
      </div>
      <h3 className="text-lg font-medium text-rose-400">{title}</h3>
      {description && <p className="text-sm text-rose-400/60 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
