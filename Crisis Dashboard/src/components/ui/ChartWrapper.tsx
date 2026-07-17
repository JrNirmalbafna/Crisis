import * as React from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "../../utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

interface ChartWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactElement;
  height?: number | string;
  minHeight?: number | string;
}

export function ChartWrapper({
  title,
  description,
  headerAction,
  children,
  className,
  height = "100%",
  minHeight = 300,
  ...props
}: ChartWrapperProps) {
  return (
    <Card className={cn("flex flex-col h-full", className)} {...props}>
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div className="flex flex-col space-y-1.5">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className="flex-1 p-0 m-0 relative">
        <div className="absolute inset-0 p-4" style={{ minHeight }}>
          <ResponsiveContainer width="100%" height={height}>
            {children}
          </ResponsiveContainer>
        </div>
        {/* Placeholder div to push content and give intrinsic height if needed, 
            since ResponsiveContainer relies on absolute positioning when bounded */}
        <div style={{ minHeight, visibility: "hidden" }} aria-hidden />
      </CardContent>
    </Card>
  );
}
