"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Share2,
  Zap,
  ArrowRight,
  Copy,
  Edit2,
  ChevronRight,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkflowCanvas } from "@/components/ui/WorkflowCanvas";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  approval: string;
  destination: string;
  status: "ACTIVE" | "PAUSED";
  lastRun: string;
  runsCount: number;
}

const initialRules: AutomationRule[] = [
  {
    id: "rule_cve_alert",
    name: "Critical Zero-Day Advisory Broadcast",
    trigger: "New CVE or Threat Advisory Ingested",
    action: "Generate Technical Security Bulletin",
    approval: "Strict Human Approval Gate",
    destination: "LinkedIn (API 202608) + X Thread",
    status: "ACTIVE",
    lastRun: "45 mins ago",
    runsCount: 18,
  },
  {
    id: "rule_ai_digest",
    name: "Enterprise Research Paper Distillation",
    trigger: "Research PDF or Whitepaper Uploaded",
    action: "Create 1-Page Executive Briefing",
    approval: "Automated Zero-Trust Gate",
    destination: "Executive Portal + Slack Digest",
    status: "ACTIVE",
    lastRun: "3 hours ago",
    runsCount: 32,
  },
  {
    id: "rule_news_flow",
    name: "Industry News to LinkedIn Creator Post",
    trigger: "Tech & Market News URL Received",
    action: "Extract Key Takeaways & Hook",
    approval: "Ask me before publishing",
    destination: "LinkedIn (API 202608)",
    status: "PAUSED",
    lastRun: "2 days ago",
    runsCount: 11,
  },
];

export default function UserAutomationsPage() {
  const { userProfile } = useAuth();
  const { success, info } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);

  const handleToggleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = r.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          if (next === "ACTIVE") {
            success("Automation Resumed", `"${r.name}" is actively listening.`);
          } else {
            info("Automation Paused", `"${r.name}" has been placed on hold.`);
          }
          return { ...r, status: next };
        }
        return r;
      })
    );
  };

  const handleDuplicate = (rule: AutomationRule) => {
    const dup: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      status: "PAUSED",
      runsCount: 0,
      lastRun: "Never",
    };
    setRules([dup, ...rules]);
    success("Automation Duplicated", `Created a copy of "${rule.name}".`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/app" }, { label: "Automations" }]}
        title="Let NEXUS handle repetitive work."
        description="Configure natural language automation workflows that ingest sources, analyze key takeaways, screen for prompt injections, and route through human approval gates."
        primaryAction={
          <Link href="/app/automations/builder">
            <Button variant="brand" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create automation
            </Button>
          </Link>
        }
      />

      {/* Visual Workflow Canvas Topology Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900">Standard Autonomous Pipeline Topology</h3>
            <p className="text-xs text-slate-500">Every workflow follows the zero-loss 5-stage guarantee</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            n8n Cloud Active
          </span>
        </div>
        <WorkflowCanvas />
      </div>

      {/* Existing Automations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Your Active Workflows ({rules.length})
          </h2>
          <Link href="/app/automations/builder" className="text-xs font-semibold text-blue-600 hover:underline">
            Open Flow Builder →
          </Link>
        </div>

        {rules.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="No automations yet."
            description="Automate your first repetitive workflow. Ingest sources and generate social content autonomously."
            actionLabel="Create automation"
            onAction={() => (window.location.href = "/app/automations/builder")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const isActive = rule.status === "ACTIVE";
              return (
                <div
                  key={rule.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant={isActive ? "success" : "neutral"} size="sm">
                        {rule.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {rule.runsCount} runs
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{rule.name}</h3>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="leading-snug">
                        <strong className="text-slate-800">When:</strong> {rule.trigger}
                      </p>
                      <p className="leading-snug">
                        <strong className="text-slate-800">Then:</strong> {rule.action}
                      </p>
                      <p className="leading-snug">
                        <strong className="text-slate-800">Gate:</strong> {rule.approval}
                      </p>
                      <p className="leading-snug">
                        <strong className="text-slate-800">Channel:</strong> {rule.destination}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rule.id)}
                      className={`font-semibold transition-colors ${
                        isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      {isActive ? "Pause" : "Resume"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(rule)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-50"
                        title="Duplicate rule"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <Link href="/app/automations/builder" className="text-blue-600 hover:text-blue-700 font-medium">
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
