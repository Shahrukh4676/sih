"use client";

import React, { useState, useEffect } from "react";
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
  Trash2,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WorkflowCanvas } from "@/components/ui/WorkflowCanvas";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";

interface AutomationRule {
  id: string;
  name: string;
  triggerTopic: string;
  outputFormat: string;
  requiresApproval: boolean;
  status: "ACTIVE" | "PAUSED";
  lastRunAt?: string;
  runsCount: number;
}

export default function UserAutomationsPage() {
  const { userProfile } = useAuth();
  const { success, info } = useToast();

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "rule_cve_alert",
      name: "Critical Zero-Day Advisory Broadcast",
      triggerTopic: "Cybersecurity Advisories & High-Severity CVEs",
      outputFormat: "LinkedIn Post + X Thread",
      requiresApproval: true,
      status: "ACTIVE",
      lastRunAt: "2 hours ago",
      runsCount: 14,
    },
    {
      id: "rule_ai_brief",
      name: "Daily AI Compute & Policy Digest",
      triggerTopic: "AI Infrastructure & Regulatory Announcements",
      outputFormat: "Executive Summary",
      requiresApproval: true,
      status: "ACTIVE",
      lastRunAt: "Yesterday",
      runsCount: 28,
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTopic, setNewTopic] = useState("Critical Vulnerabilities & Cloud Security");
  const [newFormat, setNewFormat] = useState("LINKEDIN_POST");
  const [requireApproval, setRequireApproval] = useState(true);

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          if (nextStatus === "ACTIVE") {
            success(`Automation resumed`, `"${r.name}" is now monitoring active event streams.`);
          } else {
            info(`Automation paused`, `"${r.name}" has been placed on hold.`);
          }
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: `Autonomous Pipeline for ${newTopic.slice(0, 24)}`,
      triggerTopic: newTopic,
      outputFormat: newFormat === "LINKEDIN_POST" ? "LinkedIn Post" : "X Thread",
      requiresApproval: requireApproval,
      status: "ACTIVE",
      runsCount: 0,
    };
    setRules((prev) => [newRule, ...prev]);
    setIsCreating(false);
    success("Automation created", "Visual workflow active and waiting for incoming triggers.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Autonomous Intelligence
            </span>
            <span className="text-xs text-slate-400 font-medium">• Visual Event-Driven Pipelines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Automations Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tell NEXUS what to listen for and what communication assets to synthesize automatically upon human review.
          </p>
        </div>

        <Button
          variant="brand"
          size="sm"
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Automation
        </Button>
      </div>

      {/* Visual Canvas Highlight */}
      <WorkflowCanvas />

      {/* Builder Modal / Expandable Creator */}
      {isCreating && (
        <div className="bg-white border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Configure Autonomous Pipeline</h3>
            <p className="text-xs text-slate-500">Describe the trigger condition and desired synthesis format.</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Plain English Sentence Builder */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <p className="font-semibold text-slate-800 text-sm">What should NEXUS do automatically?</p>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-blue-600 shrink-0">WHEN I RECEIVE:</span>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Critical CVEs, AI Regulatory Updates, Cloud Breaches"
                    className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-indigo-600 shrink-0">THEN GENERATE:</span>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                  >
                    <option value="LINKEDIN_POST">LinkedIn Post (API 202608)</option>
                    <option value="X_THREAD">X Thread (280 characters)</option>
                    <option value="EXECUTIVE_SUMMARY">Executive Advisory Brief</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="font-bold text-emerald-600">COMPLIANCE GATE:</span>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require explicit human compliance approval before publishing</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button variant="brand" size="sm" type="submit" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Activate Automation
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Rules List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Automation Pipelines</h3>

        <div className="grid grid-cols-1 gap-4">
          {rules.map((rule) => {
            const isActive = rule.status === "ACTIVE";
            return (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {rule.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">• {rule.runsCount} executions</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 truncate">{rule.name}</h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {rule.triggerTopic}
                    </span>
                    <span>➔</span>
                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      {rule.outputFormat}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleToggle(rule.id)}
                    leftIcon={isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  >
                    {isActive ? "Pause" : "Resume"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
