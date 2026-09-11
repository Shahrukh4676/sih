"use client";

import React from "react";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Layers, Sparkles, Send } from "lucide-react";

export type WorkflowNodeType = "WHEN" | "TRANSFORM" | "PROTECT" | "APPROVE" | "DISTRIBUTE";

interface WorkflowNodeProps {
  type: WorkflowNodeType;
  title: string;
  description: string;
  status?: "ACTIVE" | "PENDING" | "COMPLETED" | "PAUSED";
  icon?: React.ComponentType<{ className?: string }>;
  isLast?: boolean;
  onClick?: () => void;
  className?: string;
}

const typeStyles: Record<WorkflowNodeType, { label: string; bg: string; text: string; border: string }> = {
  WHEN: { label: "WHEN", bg: "bg-blue-500/10", text: "text-blue-500 dark:text-blue-400", border: "border-blue-500/20" },
  TRANSFORM: { label: "TRANSFORM", bg: "bg-indigo-500/10", text: "text-indigo-500 dark:text-indigo-400", border: "border-indigo-500/20" },
  PROTECT: { label: "PROTECT", bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400", border: "border-amber-500/20" },
  APPROVE: { label: "APPROVE", bg: "bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400", border: "border-emerald-500/20" },
  DISTRIBUTE: { label: "DISTRIBUTE", bg: "bg-cyan-500/10", text: "text-cyan-500 dark:text-cyan-400", border: "border-cyan-500/20" },
};

export function WorkflowNode({
  type,
  title,
  description,
  status = "ACTIVE",
  icon: CustomIcon,
  isLast = false,
  onClick,
  className = "",
}: WorkflowNodeProps) {
  const meta = typeStyles[type];

  return (
    <div className={`flex flex-col md:flex-row items-center gap-3 ${className}`}>
      <div
        onClick={onClick}
        className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between w-full md:w-56 min-h-[120px] text-left ${
          onClick ? "cursor-pointer hover:shadow-md" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${meta.bg} ${meta.text} border ${meta.border}`}
          >
            {meta.label}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      {!isLast && (
        <div className="hidden md:flex items-center justify-center text-slate-400 dark:text-slate-600 shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
