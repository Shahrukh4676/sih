"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Workflow,
  Clock,
  AlertCircle,
  RotateCw,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { AutomationEvent } from "@/types";

export default function AutomationExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<AutomationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecution = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/automation/executions/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEvent(data.execution || data);
      } else {
        setError(data.error || "Execution not found");
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj?.message || "Failed to load execution");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExecution();
  }, [fetchExecution]);

  const handleRetry = async () => {
    if (!id || retrying) return;
    try {
      setRetrying(true);
      const res = await fetch(`/api/automation/executions/${id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: event?.organizationId || "org_nexus_default",
          userId: event?.userId || "user_admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchExecution();
      } else {
        alert(`Retry failed: ${data.error}`);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(`Retry failed: ${errorObj?.message || "Unknown error"}`);
    } finally {
      setRetrying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Loading automation execution details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <Link
          href="/automations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Automations
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Execution Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">{error || `No record found for ID ${id}`}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/automations")}
            >
              Return to Workflows
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/automations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Automations
        </Link>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5" />
                n8n Cloud Orchestration
              </span>
              {getStatusBadge(event.status)}
              <span className="text-xs text-slate-400">
                • {formatRelativeTime(event.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {event.eventId}
              </h1>
              <button
                onClick={() => copyToClipboard(event.eventId)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Copy Event ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Workflow: <strong className="text-slate-700">{event.workflowName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExecution}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            {event.status === "FAILED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetry}
                disabled={retrying}
                leftIcon={<RotateCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />}
              >
                {retrying ? "Retrying..." : "Retry Execution"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500 font-medium">Target Resource</div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-1">
            {event.resourceId}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Version v{event.versionId || 1} • {event.resourceType}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 font-medium">Target Channel</div>
          <div className="text-sm font-bold text-slate-900 uppercase mt-1">
            {event.channel}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Phase 8 Social Integration Ready
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 font-medium">Retry Attempts</div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {event.retryCount || 0} / 3 Max
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Exponential backoff handled
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 font-medium">Result State</div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {event.result?.state || (event.status === "COMPLETED" ? "READY_FOR_DISTRIBUTION" : "PROCESSING")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Phase 7 Distribution Boundary
          </div>
        </Card>
      </div>

      {/* 3. Orchestration Pipeline Flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Execution Lifecycle &amp; Security Boundary
          </CardTitle>
          <p className="text-xs text-slate-500">
            NEXUS AI authenticates via shared HMAC secret and receives asynchronous distribution results
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-700" />
              </div>
              <div className="text-xs font-bold text-slate-900">1. Content Approved in NEXUS</div>
              <p className="text-xs text-slate-500 mt-0.5">
                Content {event.resourceId} (v{event.versionId}) signed off by human reviewer. Idempotency check verified.
              </p>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Triggered: {formatDate(event.createdAt)}
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-blue-700" />
              </div>
              <div className="text-xs font-bold text-slate-900">2. Webhook Dispatched to n8n Cloud</div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sent to <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{event.webhookUrl}</code> with <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">X-NEXUS-SIGNATURE</code> authentication header.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                event.status === "COMPLETED"
                  ? "bg-emerald-100 border-emerald-500"
                  : event.status === "FAILED"
                  ? "bg-red-100 border-red-500"
                  : "bg-blue-100 border-blue-500"
              }`}>
                {event.status === "COMPLETED" ? (
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                ) : event.status === "FAILED" ? (
                  <AlertCircle className="w-2.5 h-2.5 text-red-700" />
                ) : (
                  <Clock className="w-2.5 h-2.5 text-blue-700" />
                )}
              </div>
              <div className="text-xs font-bold text-slate-900">
                3. n8n Routing &amp; Asynchronous Callback
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {event.status === "COMPLETED"
                  ? "Workflow completed channel routing. Content verified and marked READY_FOR_DISTRIBUTION."
                  : event.status === "FAILED"
                  ? `Execution failed: ${event.error || "Unknown error"}`
                  : "Workflow currently executing on n8n Cloud instance."}
              </p>
              {event.completedAt && (
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Completed: {formatDate(event.completedAt)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Execution Data Payload Viewers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Trigger Payload (NEXUS -&gt; n8n)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
              {JSON.stringify(
                {
                  event: "CONTENT_APPROVED",
                  eventId: event.eventId,
                  organizationId: event.organizationId,
                  userId: event.userId,
                  contentId: event.resourceId,
                  versionId: event.versionId,
                  channel: event.channel,
                  timestamp: event.createdAt,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Callback Result (n8n -&gt; NEXUS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
              {JSON.stringify(
                event.result || {
                  state: event.status === "COMPLETED" ? "READY_FOR_DISTRIBUTION" : "PENDING",
                  status: event.status,
                  error: event.error || null,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
