import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../utils";

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "fullscreen";
  trigger?: React.ReactNode;
}

export function AppDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  size = "md",
  trigger
}: AppDialogProps) {
  
  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-3xl",
    fullscreen: "max-w-[95vw] h-[95vh]",
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-2xl duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "rounded-[18px] border border-white/[0.08] text-slate-50",
            "bg-gradient-to-b from-[#0B1728]/98 to-[#050A15]/98 backdrop-blur-[32px]",
            sizeStyles[size],
            size === "fullscreen" && "flex flex-col" // ensures children can flex-1
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left shrink-0 pr-8">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight text-white/90">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-sm text-white/50 mt-1 font-mono">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          
          <div className={cn("relative", size === "fullscreen" ? "flex-1 min-h-0 overflow-auto" : "")}>
            {children}
          </div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 opacity-60 transition-all hover:opacity-100 hover:bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { AppDialog } from "@/components/ui-custom/AppDialog";
// <AppDialog open={open} onOpenChange={setOpen} title="Details" size="lg">
//   Content here
// </AppDialog>
