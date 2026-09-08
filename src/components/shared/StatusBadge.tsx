import React from "react";
import { ContentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, FileEdit, Send, XCircle, RefreshCw } from "lucide-react";

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const configMap: Record<ContentStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    DRAFT: {
      label: "Draft",
      bg: "bg-slate-800/60",
      text: "text-slate-400",
      border: "border-slate-700",
      icon: <FileEdit className="w-3 h-3" />
    },
    GENERATING: {
      label: "Generating",
      bg: "bg-indigo-950/60",
      text: "text-indigo-400",
      border: "border-indigo-800/60",
      icon: <RefreshCw className="w-3 h-3 animate-spin" />
    },
    GENERATED: {
      label: "Generated",
      bg: "bg-cyan-950/60",
      text: "text-cyan-400",
      border: "border-cyan-800/60",
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    VALIDATION_FAILED: {
      label: "Validation Failed",
      bg: "bg-rose-950/60",
      text: "text-rose-400",
      border: "border-rose-800/60",
      icon: <AlertTriangle className="w-3 h-3" />
    },
    SECURITY_REVIEW: {
      label: "Security Review",
      bg: "bg-purple-950/60",
      text: "text-purple-400",
      border: "border-purple-800/60",
      icon: <ShieldCheck className="w-3 h-3" />
    },
    AWAITING_APPROVAL: {
      label: "Awaiting Approval",
      bg: "bg-amber-950/60",
      text: "text-amber-400",
      border: "border-amber-800/60",
      icon: <Clock className="w-3 h-3" />
    },
    APPROVED: {
      label: "Approved",
      bg: "bg-emerald-950/60",
      text: "text-emerald-400",
      border: "border-emerald-800/60",
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    SCHEDULED: {
      label: "Scheduled",
      bg: "bg-blue-950/60",
      text: "text-blue-400",
      border: "border-blue-800/60",
      icon: <Clock className="w-3 h-3" />
    },
    PUBLISHING: {
      label: "Publishing",
      bg: "bg-sky-950/60",
      text: "text-sky-400",
      border: "border-sky-800/60",
      icon: <RefreshCw className="w-3 h-3 animate-spin" />
    },
    PUBLISHED: {
      label: "Published",
      bg: "bg-teal-950/60",
      text: "text-teal-300",
      border: "border-teal-800/60",
      icon: <Send className="w-3 h-3" />
    },
    FAILED: {
      label: "Failed",
      bg: "bg-rose-950/60",
      text: "text-rose-400",
      border: "border-rose-800/60",
      icon: <AlertTriangle className="w-3 h-3" />
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-red-950/60",
      text: "text-red-400",
      border: "border-red-800/60",
      icon: <XCircle className="w-3 h-3" />
    }
  };

  const config = configMap[status] || configMap.DRAFT;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
