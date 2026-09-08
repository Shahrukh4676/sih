import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "verified"
    | "success"
    | "warning"
    | "danger"
    | "alert"
    | "brand"
    | "neutral"
    | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    alert: "bg-rose-50 text-rose-700 border-rose-200",
    brand: "bg-blue-50 text-blue-700 border-blue-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const dotColors: Record<string, string> = {
    verified: "bg-emerald-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    alert: "bg-rose-500",
    brand: "bg-blue-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
  };

  const sizeStyles: Record<string, string> = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5 font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border tracking-tight leading-none whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
