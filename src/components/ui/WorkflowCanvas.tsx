"use client";

import React from "react";
import {
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ArrowRight,
  Lock,
  Workflow,
} from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
  subtitle: string;
  status: "idle" | "active" | "completed" | "error";
  icon: any;
  color: string;
}

interface WorkflowCanvasProps {
  steps?: WorkflowStep[];
  interactive?: boolean;
  className?: string;
  currentActiveIndex?: number;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: "trigger",
    label: "Trigger Event",
    subtitle: "New Article / CVE Alert",
    status: "completed",
    icon: Zap,
    color: "bg-amber-500 text-white",
  },
  {
    id: "transform",
    label: "AI Transform",
    subtitle: "Multi-Format Synthesis",
    status: "completed",
    icon: Sparkles,
    color: "bg-blue-600 text-white",
  },
  {
    id: "security",
    label: "Security Scan",
    subtitle: "Prompt Injection & Secret Screen",
    status: "active",
    icon: ShieldCheck,
    color: "bg-indigo-600 text-white",
  },
  {
    id: "approval",
    label: "Human Approval",
    subtitle: "Dual Sign-off or WhatsApp",
    status: "idle",
    icon: CheckCircle2,
    color: "bg-emerald-600 text-white",
  },
  {
    id: "publish",
    label: "Publish Everywhere",
    subtitle: "LinkedIn API 202608 / X / n8n",
    status: "idle",
    icon: Share2,
    color: "bg-slate-900 text-white",
  },
];

export function WorkflowCanvas({
  steps = DEFAULT_STEPS,
  interactive = false,
  className = "",
  currentActiveIndex,
}: WorkflowCanvasProps) {
  return (
    <div className={`relative bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 overflow-hidden text-slate-100 ${className}`}>
      {/* Background subtle mesh grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Autonomous Orchestration Pipeline</h4>
            <p className="text-xs text-slate-400">Zero-Trust Event Stream ➔ Multi-Channel Broadcast</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono font-medium text-emerald-400">PIPELINE ACTIVE</span>
        </div>
      </div>

      {/* Pipeline Steps Grid with Animated Connectors */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentActiveIndex !== undefined ? idx === currentActiveIndex : step.status === "active";
          const isDone = currentActiveIndex !== undefined ? idx < currentActiveIndex : step.status === "completed";

          return (
            <div key={step.id} className="relative flex flex-col items-center text-center">
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[50%] w-full h-0.5 z-0">
                  <svg className="w-full h-2 overflow-visible" preserveAspectRatio="none">
                    <line
                      x1="0"
                      y1="1"
                      x2="100%"
                      y2="1"
                      stroke={isDone ? "#2563eb" : "#334155"}
                      strokeWidth="2"
                      className={isDone ? "animate-flow-line" : ""}
                    />
                  </svg>
                </div>
              )}

              {/* Node Icon Box */}
              <div
                className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isCurrent
                    ? `${step.color} ring-4 ring-blue-500/30 scale-110 shadow-blue-500/30`
                    : isDone
                    ? "bg-slate-800 text-blue-400 border border-blue-500/40"
                    : "bg-slate-800/80 text-slate-500 border border-slate-700/60"
                }`}
              >
                <Icon className="w-5 h-5" />
                {isCurrent && (
                  <div className="absolute inset-0 rounded-xl bg-blue-400/20 animate-pulse-ring pointer-events-none" />
                )}
              </div>

              {/* Node Labels */}
              <div className="mt-3 space-y-0.5">
                <p className="text-xs font-bold text-white tracking-tight">{step.label}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{step.subtitle}</p>
              </div>

              {/* Status Badge */}
              <div className="mt-2">
                {isDone ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    COMPLETED
                  </span>
                ) : isCurrent ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                    RUNNING
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                    QUEUED
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
