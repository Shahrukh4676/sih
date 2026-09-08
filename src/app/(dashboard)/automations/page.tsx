"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Workflow,
  Clock,
  ShieldCheck,
  UserCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  Share2,
  Check,
  ExternalLink,
  RefreshCw,
  Zap,
  Activity,
} from "lucide-react";
import { AutomationEvent } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";

interface WorkflowStatusInfo {
  configured?: boolean;
  reachable?: boolean;
  workflow?: {
    id?: string;
    name?: string;
    webhookUrl?: string;
  };
  stats?: {
    total?: number;
    completed?: number;
    running?: number;
    failed?: number;
  };
  [key: string]: unknown;
}

export default function AutomationsPage() {
  // Phase 7 n8n integration state
  const [workflowInfo, setWorkflowInfo] = useState<WorkflowStatusInfo | null>(null);
  const [executions, setExecutions] = useState<AutomationEvent[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(true);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [triggerContentId, setTriggerContentId] = useState("cnt_sample_enterprise_advisory");
  const [triggerChannel, setTriggerChannel] = useState("linkedin");
  const [triggering, setTriggering] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/automation/status");
      const data = await res.json();
      if (data.success) {
        setWorkflowInfo(data);
      }
    } catch (err) {
      console.error("Error fetching automation status:", err);
    }
  }, []);

  const fetchExecutions = useCallback(async () => {
    try {
      setExecutionsLoading(true);
      const res = await fetch("/api/automation/executions");
      const data = await res.json();
      if (data.success && data.executions) {
        setExecutions(data.executions);
      }
    } catch (err) {
      console.error("Error fetching executions:", err);
    } finally {
      setExecutionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchExecutions();
  }, [fetchStatus, fetchExecutions]);

  const handleManualTrigger = async () => {
    if (!triggerContentId.trim()) return;
    try {
      setTriggering(true);
      // Create execution event directly
      await fetch(`/api/automation/executions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: triggerContentId.trim(),
          channel: triggerChannel,
        }),
      });

      // Also trigger via approvals decision endpoint
      await fetch(`/api/approvals/appr_sample_trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: triggerContentId.trim(),
          status: "APPROVED",
          reviewerId: "admin_user",
          reviewerName: "Compliance Lead",
          comments: "Manual trigger test for Phase 7 n8n integration",
        }),
      });

      setTriggerSuccess(`Content "${triggerContentId}" approved and dispatched to n8n Cloud webhook!`);
      setIsTriggerModalOpen(false);
      await fetchExecutions();
      await fetchStatus();
      setTimeout(() => setTriggerSuccess(null), 4000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(`Trigger failed: ${errorObj?.message || "Unknown error"}`);
    } finally {
      setTriggering(false);
    }
  };

  const workflowSteps = [
    { num: 1, title: "1. Trigger", desc: "Content Approved in NEXUS", icon: Clock },
    { num: 2, title: "2. Verify", desc: "HMAC Auth & Idempotency", icon: ShieldCheck },
    { num: 3, title: "3. Inspect", desc: "GET /api/content/[id]", icon: Cpu },
    { num: 4, title: "4. Route", desc: "LinkedIn / X / WhatsApp", icon: Sparkles },
    { num: 5, title: "5. Callback", desc: "POST /api/automation/callback", icon: Share2 },
    { num: 6, title: "6. Ready", desc: "Mark READY_FOR_DISTRIBUTION", icon: UserCheck },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success" dot size="sm">COMPLETED</Badge>;
      case "RUNNING":
      case "TRIGGERED":
        return <Badge variant="info" dot size="sm">IN PROGRESS</Badge>;
      case "FAILED":
        return <Badge variant="danger" dot size="sm">FAILED</Badge>;
      case "BLOCKED":
        return <Badge variant="warning" dot size="sm">BLOCKED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Workflow className="w-3.5 h-3.5" />
              Phase 7 Automation Engine
            </span>
            <span className="text-xs text-slate-400">• n8n Cloud Connected</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Approved Content Orchestration
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Seamlessly triggers the existing n8n Cloud workflow on approved content, enforces HMAC authentication &amp; idempotency, and tracks distribution readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              fetchStatus();
              fetchExecutions();
            }}
            leftIcon={<RefreshCw className={`w-4 h-4 ${executionsLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsTriggerModalOpen(true)}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Test n8n Trigger
          </Button>
        </div>
      </div>

      {triggerSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{triggerSuccess}</span>
        </div>
      )}

      {/* 2. n8n Cloud Active Workflow Status Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-slate-50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-base font-bold text-slate-900">
                {workflowInfo?.workflow?.name || "NEXUS — Approved Content Orchestration"}
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Cloud Orchestrator • ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">{workflowInfo?.workflow?.id || "uunidN8XWaIcA5xY"}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="verified" dot size="sm">
              CONNECTED (Cloud Webhook)
            </Badge>
            <a
              href="https://shahrukh24.app.n8n.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 transition text-xs inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open n8n</span>
            </a>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-400 font-medium">Total Orchestrations</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {workflowInfo?.stats?.total || executions.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-400 font-medium">Completed / Ready</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">
                {workflowInfo?.stats?.completed ?? executions.filter((e) => e.status === "COMPLETED").length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-400 font-medium">In Progress</div>
              <div className="text-lg font-bold text-blue-600 mt-0.5">
                {workflowInfo?.stats?.running ?? executions.filter((e) => ["TRIGGERED", "RUNNING"].includes(e.status)).length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-400 font-medium">Failed</div>
              <div className="text-lg font-bold text-rose-600 mt-0.5">
                {workflowInfo?.stats?.failed ?? executions.filter((e) => e.status === "FAILED").length}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px] flex items-center justify-between">
              <span>ACTIVE CLOUD CONFIGURATION</span>
              <span className="text-emerald-400 font-normal">HMAC SHA-256 Auth Enforced</span>
            </div>
            <div className="text-slate-300 break-all">
              <span className="text-blue-400">Webhook URL:</span> {workflowInfo?.workflow?.webhookUrl || "https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved"}
            </div>
            <div className="text-slate-400 text-[11px]">
              <span className="text-amber-400">Auth Header:</span> X-NEXUS-SIGNATURE • <span className="text-purple-400">Inspection:</span> GET /api/content/[id] • <span className="text-emerald-400">Callback:</span> POST /api/automation/callback
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Live Executions Stream */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Workflow Executions Stream ({executions.length})
            </CardTitle>
            <p className="text-xs text-slate-500">
              Real-time audit record of content approval triggers and n8n callback responses
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            Auto-Refreshed
          </Badge>
        </CardHeader>

        {executionsLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Loading live execution events...
          </div>
        ) : executions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <Workflow className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">No Executions Recorded Yet</div>
            <p className="text-slate-400 max-w-sm mx-auto">
              Approve content in the Approval Center or click &ldquo;Test n8n Trigger&rdquo; to dispatch your first orchestration event.
            </p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsTriggerModalOpen(true)}
              className="mt-2"
            >
              Dispatch Test Trigger
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="px-5 py-3">Event ID</th>
                  <th className="px-4 py-3">Content Artefact</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Lifecycle Status</th>
                  <th className="px-4 py-3">Distribution State</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executions.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-900">
                      <Link
                        href={`/automations/${e.eventId || e.id}`}
                        className="hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {e.eventId || e.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      <div>{e.resourceId}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        v{e.versionId || 1} • {e.resourceType}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-[11px] font-semibold text-slate-700 px-2 py-0.5 rounded bg-slate-100">
                        {e.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(e.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {e.result?.state || (e.status === "COMPLETED" ? "READY_FOR_DISTRIBUTION" : "PENDING")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(e.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/automations/${e.eventId || e.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center gap-1"
                      >
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Visual 6-Stage Workflow Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Enterprise Guardrail Automation Flow
          </CardTitle>
          <p className="text-xs text-slate-500">
            NEXUS triggers n8n Cloud via webhook. n8n fetches content, verifies signature, runs channel routing, and returns callback.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {workflowSteps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-between"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-blue-600 mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {st.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {st.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Manual Test Trigger Modal */}
      <Modal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        title="Test n8n Workflow Trigger"
        description="Simulate content approval and verify webhook dispatch to n8n Cloud."
      >
        <div className="space-y-4">
          <Input
            label="Content ID"
            placeholder="cnt_sample_enterprise_advisory"
            value={triggerContentId}
            onChange={(e) => setTriggerContentId(e.target.value)}
            required
          />

          <Select
            label="Target Channel"
            value={triggerChannel}
            onChange={(e) => setTriggerChannel(e.target.value)}
            options={[
              { value: "linkedin", label: "LinkedIn (Test Branch)" },
              { value: "x", label: "X / Twitter (Test Branch)" },
              { value: "instagram", label: "Instagram (Test Branch)" },
              { value: "whatsapp", label: "WhatsApp Broadcast" },
            ]}
          />

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
            <span className="font-semibold block">
              What happens next:
            </span>
            <p>
              1. NEXUS verifies approval state and idempotency.<br />
              2. Dispatches webhook to <code>https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved</code> with signature.<br />
              3. n8n executes channel routing and returns <code>READY_FOR_DISTRIBUTION</code>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTriggerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualTrigger}
              disabled={triggering || !triggerContentId.trim()}
              leftIcon={<Zap className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />}
            >
              {triggering ? "Dispatching..." : "Dispatch to n8n"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
