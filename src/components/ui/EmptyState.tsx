import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-900 tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/70",
        className
      )}
      {...props}
    />
  );
}

export interface StatusIndicatorProps {
  status: "online" | "review" | "offline" | "blocked" | "processing";
  label?: string;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  className,
}: StatusIndicatorProps) {
  const dotColor = {
    online: "bg-emerald-500",
    review: "bg-amber-500",
    offline: "bg-slate-400",
    blocked: "bg-rose-500",
    processing: "bg-blue-500 animate-pulse",
  }[status];

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs", className)}>
      <span className="relative flex h-2 w-2">
        {status === "online" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)} />
      </span>
      {label && <span className="font-medium text-slate-700">{label}</span>}
    </div>
  );
}
