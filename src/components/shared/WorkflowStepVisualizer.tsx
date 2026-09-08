import React from "react";
import { cn } from "@/lib/utils";
import { FileText, Cpu, Sparkles, ShieldCheck, UserCheck, SendHorizontal } from "lucide-react";

export type PipelineStep = "SOURCE" | "ANALYZE" | "TRANSFORM" | "SECURITY_CHECK" | "APPROVAL" | "PUBLISH";

interface WorkflowStepVisualizerProps {
  currentStep?: PipelineStep;
  className?: string;
}

export function WorkflowStepVisualizer({ currentStep = "SECURITY_CHECK", className }: WorkflowStepVisualizerProps) {
  const steps: Array<{ id: PipelineStep; label: string; icon: React.ReactNode; desc: string }> = [
    { id: "SOURCE", label: "Source Ingestion", icon: <FileText className="w-4 h-4" />, desc: "Docs, URLs, Media" },
    { id: "ANALYZE", label: "Semantic Analysis", icon: <Cpu className="w-4 h-4" />, desc: "Extract key points" },
    { id: "TRANSFORM", label: "AI Transformation", icon: <Sparkles className="w-4 h-4" />, desc: "Output synthesis" },
    { id: "SECURITY_CHECK", label: "Security & PII Check", icon: <ShieldCheck className="w-4 h-4" />, desc: "Injection & leak guard" },
    { id: "APPROVAL", label: "Human Approval", icon: <UserCheck className="w-4 h-4" />, desc: "Mandatory gate" },
    { id: "PUBLISH", label: "Multi-Channel Publish", icon: <SendHorizontal className="w-4 h-4" />, desc: "OAuth delivery" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("glass-panel rounded-xl p-5 border border-slate-800/80", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">AI Content Pipeline Guardrail</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Automated security checkpoints & human authorization before publishing</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700/60 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Policy: <strong className="text-slate-200">Strict Human-in-the-Loop</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const isPassed = idx < stepIndex;
          const isCurrent = idx === stepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col p-3 rounded-lg border transition-all duration-200 relative overflow-hidden",
                isPassed && "bg-slate-900/40 border-emerald-900/40 text-slate-300",
                isCurrent && "bg-cyan-950/30 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
                idx > stepIndex && "bg-slate-950/20 border-slate-800/40 text-slate-500"
              )}
            >
              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500" />
              )}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "p-1.5 rounded-md",
                    isPassed && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50",
                    isCurrent && "bg-cyan-900/60 text-cyan-300 border border-cyan-700/60",
                    idx > stepIndex && "bg-slate-900 text-slate-600 border border-slate-800"
                  )}
                >
                  {step.icon}
                </span>
                <span className="text-[10px] font-mono text-slate-500">0{idx + 1}</span>
              </div>
              <span className="text-xs font-semibold leading-tight mb-0.5">{step.label}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
