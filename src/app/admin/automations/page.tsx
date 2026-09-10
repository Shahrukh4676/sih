"use client";

import React, { useState } from "react";
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  SendHorizontal,
  ChevronRight,
  RefreshCw,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkflowCanvas } from "@/components/ui/WorkflowCanvas";
import { useToast } from "@/components/ui/ToastProvider";

interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  output: string;
  channels: string[];
  active: boolean;
  totalRuns: number;
  successRate: string;
  lastRun: string;
}

const initialFlows: AutomationFlow[] = [
  {
    id: "auto_cve_01",
    name: "Zero-Day Threat Advisory Flow",
    trigger: "New CVE or Threat Advisory Ingested",
    output: "Cybersecurity Advisory & LinkedIn Brief",
    channels: ["LinkedIn (202608)", "X Thread", "Email Alert"],
    active: true,
    totalRuns: 142,
    successRate: "99.3%",
    lastRun: "45 mins ago",
  },
  {
    id: "auto_res_02",
    name: "Enterprise Research to Executive Brief",
    trigger: "Research PDF or Whitepaper Uploaded",
    output: "1-Page Executive Summary & Slide Bullets",
    channels: ["Executive Portal", "Slack Digest"],
    active: true,
    totalRuns: 88,
    successRate: "100%",
    lastRun: "3 hours ago",
  },
  {
    id: "auto_wa_03",
    name: "WhatsApp Incoming Source Dispatch",
    trigger: "URL received via WhatsApp Cloud Webhook",
    output: "LinkedIn Post + Compliance Gate",
    channels: ["LinkedIn (202608)", "WhatsApp Confirmation"],
    active: true,
    totalRuns: 56,
    successRate: "98.2%",
    lastRun: "5 hours ago",
  },
];

interface ExecutionLog {
  id: string;
  flowName: string;
  triggerEvent: string;
  status: "SUCCESS" | "FAILED" | "PROCESSING";
  duration: string;
  timestamp: string;
}

const initialLogs: ExecutionLog[] = [
  {
    id: "exec_9812",
    flowName: "Zero-Day Threat Advisory Flow",
    triggerEvent: "CVE-2026-3829 Ingested via Threat Feed",
    status: "SUCCESS",
    duration: "1.4s",
    timestamp: "12 mins ago",
  },
  {
    id: "exec_9811",
    flowName: "WhatsApp Incoming Source Dispatch",
    triggerEvent: "https://techcrunch.com/article received",
    status: "SUCCESS",
    duration: "2.1s",
    timestamp: "45 mins ago",
  },
  {
    id: "exec_9810",
    flowName: "Enterprise Research to Executive Brief",
    triggerEvent: "ArXiv:2609.0418 AI Alignment Ingested",
    status: "SUCCESS",
    duration: "3.2s",
    timestamp: "3 hours ago",
  },
  {
    id: "exec_9809",
    flowName: "Zero-Day Threat Advisory Flow",
    triggerEvent: "NVD Security Advisory Ingested",
    status: "SUCCESS",
    duration: "1.6s",
    timestamp: "6 hours ago",
  },
];

export default function AdminAutomationsPage() {
  const { success, info } = useToast();
  const [flows, setFlows] = useState<AutomationFlow[]>(initialFlows);
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const handleToggleFlow = (id: string) => {
    setFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
    const flow = flows.find((f) => f.id === id);
    if (flow) {
      success(
        "Automation Updated",
        `"${flow.name}" is now ${!flow.active ? "ACTIVATED" : "PAUSED"}`
      );
    }
  };

  const handleTestTrigger = (flow: AutomationFlow) => {
    setDispatching(flow.id);
    setTimeout(() => {
      const newLog: ExecutionLog = {
        id: `exec_${Math.floor(1000 + Math.random() * 9000)}`,
        flowName: flow.name,
        triggerEvent: "Manual Enterprise Test Trigger Dispatched",
        status: "SUCCESS",
        duration: "1.2s",
        timestamp: "Just now",
      };
      setLogs([newLog, ...logs]);
      setDispatching(null);
      success("Automation Dispatched", `Dispatched flow "${flow.name}" via n8n Cloud Webhook.`);
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Workflow className="w-6 h-6 text-cyan-500" />
              Autonomous Enterprise Workflows
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              n8n Cloud Orchestration
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Orchestrate end-to-end ingestion, AI transformation, zero-trust security clearance, and multi-channel publication without human toil.
          </p>
        </div>

        <Button
          onClick={() => info("Custom Workflow", "Enterprise n8n webhook nodes can be provisioned in Settings.")}
          variant="primary"
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Workflow Node
        </Button>
      </div>

      {/* Visual Pipeline Showcase */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Active Pipeline Topology</h3>
            <p className="text-xs text-slate-400">Zero-data loss architecture with asynchronous queue worker</p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            HEALTHY
          </span>
        </div>
        <WorkflowCanvas />
      </div>

      {/* Active Workflows Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Configured Workflow Pipelines
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      flow.active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {flow.active ? "ACTIVE" : "PAUSED"}
                  </span>
                  <button
                    onClick={() => handleToggleFlow(flow.id)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {flow.active ? "Pause" : "Resume"}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white">{flow.name}</h3>

                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  <p>
                    <strong className="text-slate-300">Trigger:</strong> {flow.trigger}
                  </p>
                  <p>
                    <strong className="text-slate-300">Target Output:</strong> {flow.output}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Success: <strong className="text-emerald-400">{flow.successRate}</strong></span>
                  <span>{flow.totalRuns} runs</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={dispatching === flow.id}
                  onClick={() => handleTestTrigger(flow)}
                  className="w-full text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200"
                >
                  <Play className="w-3 h-3 mr-1.5 text-cyan-400 fill-cyan-400" />
                  Test Trigger Pipeline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Stream Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Automation Execution Stream
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time audit log of triggered orchestrations, execution durations, and output statuses.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{logs.length} Recent Invocations</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {logs.map((log) => (
            <div
              key={log.id}
              className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-semibold text-slate-200">{log.flowName}</p>
                  <p className="text-[11px] text-slate-500">{log.triggerEvent}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {log.status}
                </span>
                <span>{log.duration}</span>
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
