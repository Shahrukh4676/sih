"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  SendHorizontal,
  Layers,
  ArrowRight,
  CheckSquare,
  Eye,
  Activity,
  Terminal,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SlideOver } from "@/components/ui/SlideOver";
import { useToast } from "@/components/ui/ToastProvider";

interface ExecutionRun {
  id: string;
  automationId: string;
  automationName: string;
  triggerEvent: string;
  owner: string;
  organization: string;
  status: "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED";
  startedAt: string;
  completedAt?: string;
  duration: string;
  channel: string;
  riskScore: number;
  steps: {
    name: string;
    status: "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED";
    duration: string;
    details: string;
  }[];
  rawPayload?: Record<string, any>;
}

const initialRuns: ExecutionRun[] = [
  {
    id: "run_9824_cve",
    automationId: "auto_cve_01",
    automationName: "Zero-Day Threat Advisory Pipeline",
    triggerEvent: "CVE-2026-8812 Linux eBPF Privilege Escalation Disclosed",
    owner: "SecOps Intelligence Feed",
    organization: "Enterprise Security Org",
    status: "COMPLETED",
    startedAt: "10 mins ago",
    completedAt: "10 mins ago",
    duration: "1.42s",
    channel: "LinkedIn (202608) + Advisory",
    riskScore: 0.0,
    steps: [
      { name: "01 Source Ingestion", status: "COMPLETED", duration: "120ms", details: "Ingested CVE-2026-8812 bulletin via RSS webhook payload." },
      { name: "02 Zero-Trust Security Gate", status: "COMPLETED", duration: "180ms", details: "Prompt injection: 0.0 • PII scan: CLEAN • Threat level: HIGH." },
      { name: "03 AI Synthesis (Gemini 1.5 Pro)", status: "COMPLETED", duration: "680ms", details: "Generated Executive Advisory and structured LinkedIn social post." },
      { name: "04 Compliance Governance Gate", status: "COMPLETED", duration: "210ms", details: "Auto-cleared: Passed 0.0 risk threshold and verified CVE references." },
      { name: "05 n8n Cloud Social Publishing", status: "COMPLETED", duration: "230ms", details: "Dispatched via n8n Cloud to LinkedIn API 202608. Post URN generated." },
    ],
    rawPayload: {
      cve: "CVE-2026-8812",
      severity: "CRITICAL",
      cvss: 8.8,
      source: "kernel.org/bpf/verifier.c",
      destination: "linkedin:202608",
      orchestrator: "n8n_cloud_webhook_v1",
    },
  },
  {
    id: "run_9823_wa",
    automationId: "auto_wa_03",
    automationName: "WhatsApp Ingestion Webhook Pipeline",
    triggerEvent: "https://techcrunch.com/2026/09/ai-compute-efficiency",
    owner: "Executive Communications",
    organization: "nexoura-prod",
    status: "COMPLETED",
    startedAt: "38 mins ago",
    completedAt: "38 mins ago",
    duration: "2.10s",
    channel: "LinkedIn (202608)",
    riskScore: 0.0,
    steps: [
      { name: "01 Source Ingestion", status: "COMPLETED", duration: "240ms", details: "Ingested URL via WhatsApp Cloud Webhook handshake." },
      { name: "02 Zero-Trust Security Gate", status: "COMPLETED", duration: "190ms", details: "URL verified reachable. Domain clean. Zero-Trust score: 0.0." },
      { name: "03 AI Synthesis (Gemini 1.5 Flash)", status: "COMPLETED", duration: "920ms", details: "Distilled technical report into key takeaways for executive audience." },
      { name: "04 Compliance Governance Gate", status: "COMPLETED", duration: "410ms", details: "Routed to Human-in-the-Loop review queue. Approved by SecOps." },
      { name: "05 Multi-Channel Distribution", status: "COMPLETED", duration: "340ms", details: "Published to LinkedIn Member URN: urn:li:share:74378912891." },
    ],
  },
  {
    id: "run_9822_res",
    automationId: "auto_res_02",
    automationName: "Research PDF to Board Executive Summary",
    triggerEvent: "ArXiv:2609.0418 AI Alignment Ingested",
    owner: "Research Strategy Team",
    organization: "Enterprise Research",
    status: "COMPLETED",
    startedAt: "2 hours ago",
    completedAt: "2 hours ago",
    duration: "3.48s",
    channel: "Executive Portal",
    riskScore: 0.0,
    steps: [
      { name: "01 Source Ingestion", status: "COMPLETED", duration: "410ms", details: "Parsed 14-page PDF document text into semantic chunks." },
      { name: "02 Zero-Trust Security Gate", status: "COMPLETED", duration: "220ms", details: "Passed zero-trust policy. No prompt injection or data leakage detected." },
      { name: "03 AI Synthesis (Gemini 1.5 Pro)", status: "COMPLETED", duration: "1850ms", details: "Generated 1-page Executive Summary and slide bullet deck." },
      { name: "04 Compliance Governance Gate", status: "COMPLETED", duration: "620ms", details: "Approved by Policy Director." },
      { name: "05 Multi-Channel Distribution", status: "COMPLETED", duration: "380ms", details: "Delivered to Executive Knowledgebase." },
    ],
  },
  {
    id: "run_9821_live",
    automationId: "auto_cve_01",
    automationName: "Zero-Day Threat Advisory Pipeline",
    triggerEvent: "Feed Polling: NIST NVD Threat Feed",
    owner: "System Daemon",
    organization: "nexoura-prod",
    status: "COMPLETED",
    startedAt: "4 hours ago",
    completedAt: "4 hours ago",
    duration: "0.89s",
    channel: "Internal Stream",
    riskScore: 0.0,
    steps: [
      { name: "01 Feed Query", status: "COMPLETED", duration: "510ms", details: "Checked NIST NVD API for delta CVEs." },
      { name: "02 Ingestion Filter", status: "COMPLETED", duration: "180ms", details: "Filtered 4 routine updates, 0 critical zero-days." },
      { name: "03 Status Check", status: "COMPLETED", duration: "200ms", details: "Idle cycle recorded in audit ledger." },
    ],
  },
];

export default function AdminRunsPage() {
  const { success, info } = useToast();
  const [runs, setRuns] = useState<ExecutionRun[]>(initialRuns);
  const [selectedRun, setSelectedRun] = useState<ExecutionRun | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isTriggeringTest, setIsTriggeringTest] = useState(false);

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.automationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.triggerEvent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenRun = (run: ExecutionRun) => {
    setSelectedRun(run);
    setDrawerOpen(true);
  };

  const handleTriggerTestRun = () => {
    setIsTriggeringTest(true);
    const newRunId = `run_${Math.floor(1000 + Math.random() * 9000)}_test`;
    
    // Create new running entry
    const newRun: ExecutionRun = {
      id: newRunId,
      automationId: "auto_cve_01",
      automationName: "Zero-Day Threat Advisory Pipeline",
      triggerEvent: "Simulated Vulnerability Ingestion Event",
      owner: "SecOps Admin (Manual Trigger)",
      organization: "nexoura-prod",
      status: "RUNNING",
      startedAt: "Just now",
      duration: "0.4s",
      channel: "LinkedIn (202608)",
      riskScore: 0.0,
      steps: [
        { name: "01 Source Ingestion", status: "COMPLETED", duration: "80ms", details: "Ingested synthetic test event payload." },
        { name: "02 Zero-Trust Security Gate", status: "RUNNING", duration: "--", details: "Scanning for adversarial injections..." },
        { name: "03 AI Synthesis", status: "QUEUED", duration: "--", details: "Gemini 1.5 Pro reasoning pipeline." },
        { name: "04 Compliance Gate", status: "QUEUED", duration: "--", details: "Awaiting security evaluation." },
        { name: "05 Distribution", status: "QUEUED", duration: "--", details: "Awaiting publishing trigger." },
      ],
    };

    setRuns([newRun, ...runs]);
    info("Execution Dispatched", `Test run ${newRunId} initialized in background.`);

    setTimeout(() => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === newRunId
            ? {
                ...r,
                status: "COMPLETED",
                completedAt: "Just now",
                duration: "1.28s",
                steps: [
                  { name: "01 Source Ingestion", status: "COMPLETED", duration: "80ms", details: "Ingested synthetic test event payload." },
                  { name: "02 Zero-Trust Security Gate", status: "COMPLETED", duration: "160ms", details: "Cleared. Threat Score: 0.0." },
                  { name: "03 AI Synthesis (Gemini 1.5 Pro)", status: "COMPLETED", duration: "640ms", details: "Synthesized executive threat advisory." },
                  { name: "04 Compliance Gate", status: "COMPLETED", duration: "180ms", details: "Auto-approved under zero-risk rule." },
                  { name: "05 Distribution", status: "COMPLETED", duration: "220ms", details: "Dispatched to mock publish channel." },
                ],
              }
            : r
        )
      );
      setIsTriggeringTest(false);
      success("Run Completed", `Execution ${newRunId} finished successfully in 1.28s.`);
    }, 1400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Automation", href: "/admin/automations" },
          { label: "Execution Runs" },
        ]}
        title="Automation Execution Runs"
        description="Audited execution trace for corporate automated ingestion, AI reasoning transformations, zero-trust security checks, and multi-channel publication."
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            Live Telemetry
          </span>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            className="bg-blue-600 hover:bg-blue-500"
            onClick={handleTriggerTestRun}
            isLoading={isTriggeringTest}
          >
            <Play className="w-4 h-4 mr-1.5" />
            Trigger Test Run
          </Button>
        }
        secondaryActions={
          <Link href="/admin/automations">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white">
              <Workflow className="w-4 h-4 mr-1.5" />
              Workflow Topology
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Runs (24h)</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">286</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-0.5 inline-block">
            ↑ 14% vs yesterday
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">99.4%</p>
          <span className="text-[11px] text-slate-400 mt-0.5 inline-block">1 retry handled</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Mean Execution Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">1.82s</p>
          <span className="text-[11px] text-cyan-400 font-mono mt-0.5 inline-block">p95: 3.48s</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Zero-Trust Intercepts</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">0</p>
          <span className="text-[11px] text-slate-500 mt-0.5 inline-block">All payloads clean</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Run ID, event name, or trigger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RUNNING">Running</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Run ID &amp; Pipeline</th>
                <th className="px-4 py-3.5">Trigger Event</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Distribution Channel</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRuns.map((run) => (
                <tr
                  key={run.id}
                  onClick={() => handleOpenRun(run)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-blue-400 group-hover:underline">
                        {run.id}
                      </span>
                      <span className="text-slate-300 font-semibold text-xs mt-0.5">
                        {run.automationName}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 max-w-xs">
                    <p className="text-slate-300 truncate font-medium">{run.triggerEvent}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{run.owner}</p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                        run.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : run.status === "RUNNING"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {run.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                      {run.status === "RUNNING" && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {run.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-300">
                    {run.duration}
                  </td>

                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                      {run.channel}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                    {run.startedAt}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRun(run);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      Inspect
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Trace SlideOver Drawer */}
      <SlideOver
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Run Execution Trace: ${selectedRun?.id || ""}`}
      >
        {selectedRun && (
          <div className="space-y-6 text-xs">
            {/* Run Overview Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-400 font-bold text-sm">{selectedRun.id}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedRun.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {selectedRun.status}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">{selectedRun.automationName}</h4>
                <p className="text-slate-400 text-xs">{selectedRun.triggerEvent}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Duration:</span>{" "}
                  <span className="text-slate-200">{selectedRun.duration}</span>
                </div>
                <div>
                  <span className="text-slate-500">Zero-Trust:</span>{" "}
                  <span className="text-emerald-400">{selectedRun.riskScore} (Clean)</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Topology Trace */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                Execution Pipeline Trace
              </h5>

              <div className="space-y-2">
                {selectedRun.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-white">{step.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{step.duration}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-5.5 leading-relaxed">{step.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Event Context */}
            {selectedRun.rawPayload && (
              <div className="space-y-2">
                <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  Raw Ingested Event Payload
                </h5>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedRun.rawPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
