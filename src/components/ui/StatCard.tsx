import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  className?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  subtitle,
  className,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-600",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all duration-150 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 tracking-tight uppercase">
          {title}
        </span>
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            iconBgColor
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>

        {(change || subtitle) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            {change && (
              <span
                className={cn(
                  "font-medium px-1.5 py-0.5 rounded text-[11px]",
                  changeType === "positive" && "bg-emerald-50 text-emerald-700 font-semibold",
                  changeType === "negative" && "bg-rose-50 text-rose-700 font-semibold",
                  changeType === "neutral" && "bg-slate-100 text-slate-600"
                )}
              >
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400 truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
