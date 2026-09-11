"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from "lucide-react";

interface SecurityStatusProps {
  status?: "CLEAN" | "BLOCKED" | "QUARANTINED" | "SCANNING";
  riskScore?: number;
  threatCount?: number;
  className?: string;
}

export function SecurityStatus({
  status = "CLEAN",
  riskScore = 0.01,
  threatCount = 0,
  className = "",
}: SecurityStatusProps) {
  if (status === "BLOCKED" || threatCount > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 ${className}`}
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>THREAT BLOCKED ({threatCount})</span>
      </span>
    );
  }

  if (status === "QUARANTINED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>PII QUARANTINED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>ZERO-TRUST VERIFIED</span>
    </span>
  );
}
