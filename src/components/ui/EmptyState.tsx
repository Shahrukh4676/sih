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
  actionNode?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionNode,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionNode ? (
        actionNode
      ) : actionLabel && onAction ? (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
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
  const statusStyles = {
    online: "bg-emerald-500",
    review: "bg-amber-500",
    offline: "bg-slate-400",
    blocked: "bg-red-500",
    processing: "bg-blue-500 animate-pulse",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("w-2 h-2 rounded-full", statusStyles[status])} />
      {label && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      )}
    </div>
  );
}
