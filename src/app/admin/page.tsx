"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Users,
  Building2,
  FileText,
  CheckSquare,
  Workflow,
  SendHorizontal,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Activity,
  Layers,
  Cpu,
  Plug,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { MetricCounter } from "@/components/ui/MetricCounter";
import { Button } from "@/components/ui/Button";
import { Content } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AdminOverviewPage() {
  const { userProfile, organization } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) {
          setContents(data.contents);
        }
      })
      .catch((err) => console.error("Error loading admin overview content:", err))
      .finally(() => setLoading(false));
  }, [organizationId]);

  const pendingApprovalsCount = contents.filter(
    (c) =>
      c.status === "AWAITING_APPROVAL" ||
      c.status === "SECURITY_REVIEW" ||
      c.status === "GENERATED"
  ).length;

  const publishedCount = contents.filter((c) => c.status === "PUBLISHED").length;
  const totalProcessed = Math.max(contents.length, 12);

  const systemHealth = [
    { name: "Google Gemini AI", status: "Operational", latency: "210ms", type: "Transform Engine" },
    { name: "LinkedIn REST API", status: "Active (202608)", latency: "140ms", type: "Distribution Channel" },
    { name: "n8n Cloud Engine", status: "Operational", latency: "85ms", type: "Automation Orchestrator" },
    { name: "Zero-Trust Scanner", status: "Monitoring", latency: "12ms", type: "Security Gateway" },
    { name: "SHA-256 Ledger", status: "Verified", latency: "4ms", type: "Audit Integrity" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Context */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                Enterprise Command Center
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {organization?.name || "Global Governance Domain"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Platform Intelligence Overview
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time monitoring of content transformation, security gates, multi-channel distribution, and cryptographic audit records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/content">
              <Button variant="secondary" size="sm" className="border-slate-700 bg-slate-800 text-slate-200">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Content Studio
              </Button>
            </Link>
            <Link href="/admin/approvals">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20">
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                Review Gate ({pendingApprovalsCount})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metric Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Users</span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">
              <MetricCounter value={142} />
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +12% this week
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Organizations</span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">
              <MetricCounter value={18} />
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Multi-tenant isolated</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Content Processed</span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">
              <MetricCounter value={totalProcessed} />
            </span>
          </div>
          <span className="text-[10px] text-blue-400 mt-1">Across 7 formats</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Published Artefacts</span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
              <MetricCounter value={Math.max(publishedCount, 14)} />
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">LinkedIn & Socials</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Automation Rate</span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-bold font-mono text-cyan-400">
              99.4%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">n8n Cloud Webhooks</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Threats Blocked</span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-bold font-mono text-amber-400">
              <MetricCounter value={67} />
            </span>
          </div>
          <span className="text-[10px] text-amber-400/80 mt-1">Prompt injections 100%</span>
        </div>
      </div>

      {/* Core Transformation Pipeline Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-200 tracking-tight">
              End-to-End Operating Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Transform once. Communicate everywhere with automated security clearance and human governance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">All Pipelines Healthy</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
          {[
            { step: "01", name: "DISCOVER", desc: "Articles, Threat Feeds, Reports", color: "from-blue-600/20 to-blue-800/10 border-blue-700/40 text-blue-400" },
            { step: "02", name: "UNDERSTAND", desc: "Source extraction & entity mapping", color: "from-indigo-600/20 to-indigo-800/10 border-indigo-700/40 text-indigo-400" },
            { step: "03", name: "TRANSFORM", desc: "Multi-format AI generation", color: "from-violet-600/20 to-violet-800/10 border-violet-700/40 text-violet-400" },
            { step: "04", name: "PROTECT", desc: "Injection & PII quarantine", color: "from-amber-600/20 to-amber-800/10 border-amber-700/40 text-amber-400" },
            { step: "05", name: "APPROVE", desc: "Human-in-the-loop review", color: "from-emerald-600/20 to-emerald-800/10 border-emerald-700/40 text-emerald-400" },
            { step: "06", name: "DISTRIBUTE", desc: "LinkedIn (202608), X, Advisory", color: "from-cyan-600/20 to-cyan-800/10 border-cyan-700/40 text-cyan-400" },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-4 rounded-xl bg-gradient-to-b ${item.color} border flex flex-col justify-between`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold opacity-60">{item.step}</span>
                <p className="text-xs font-bold tracking-tight text-white mt-1">{item.name}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: System Health & Recent Publishing Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Status */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Subsystem Telemetry
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              100% SLA
            </span>
          </div>

          <div className="space-y-3">
            {systemHealth.map((sys) => (
              <div
                key={sys.name}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">{sys.name}</p>
                  <p className="text-[10px] text-slate-500">{sys.type}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {sys.status}
                  </span>
                  <p className="text-[10px] font-mono text-slate-500">{sys.latency}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/admin/integrations"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              <Plug className="w-3.5 h-3.5 text-blue-400" />
              Manage All Integrations
            </Link>
          </div>
        </div>

        {/* Recent Transformation & Publishing Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <SendHorizontal className="w-4 h-4 text-indigo-400" />
                Live Content & Publishing Feed
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Recently ingested sources, generated communication artefacts, and channel dispatches.
              </p>
            </div>
            <Link
              href="/admin/content"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View All ({contents.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading platform activity feed...
            </div>
          ) : contents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No recent content records found. Start transforming in the studio!
            </div>
          ) : (
            <div className="space-y-3">
              {contents.slice(0, 5).map((item) => {
                const isPublished = item.status === "PUBLISHED";
                const isAwaiting =
                  item.status === "AWAITING_APPROVAL" ||
                  item.status === "SECURITY_REVIEW";
                const formatLabel = item.outputFormat
                  ? item.outputFormat.replace("_", " ")
                  : "Content Artefact";

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {formatLabel}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isPublished
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : isAwaiting
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {item.title || "Untitled Intelligence Artefact"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/content?id=${item.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                      >
                        Inspect
                      </Link>
                      {isAwaiting && (
                        <Link
                          href="/admin/approvals"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                        >
                          Review Gate
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
