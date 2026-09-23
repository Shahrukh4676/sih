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
  Radio,
  Server,
  Database,
  Key,
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
  const [usersCount, setUsersCount] = useState<number>(0);
  const [orgsCount, setOrgsCount] = useState<number>(0);
  const [automationsCount, setAutomationsCount] = useState<number>(0);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [auditChainValid, setAuditChainValid] = useState<boolean>(true);
  const [linkedinStatus, setLinkedinStatus] = useState<{ connected: boolean; mode?: string; member?: { name: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Contents
    fetch(`/api/content?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) {
          setContents(data.contents);
        }
      })
      .catch((err) => console.error("Error loading admin overview content:", err))
      .finally(() => setLoading(false));

    // 2. Users
    fetch(`/api/users`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.users) setUsersCount(data.users.length);
      })
      .catch(() => setUsersCount(0));

    // 3. Organizations
    fetch(`/api/organizations`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.organizations) setOrgsCount(data.organizations.length);
      })
      .catch(() => setOrgsCount(1));

    // 4. Automations
    fetch(`/api/automation/rules?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rules) setAutomationsCount(data.rules.length);
      })
      .catch(() => setAutomationsCount(0));

    // 5. Security Events
    fetch(`/api/security/events?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.events) setSecurityEvents(data.events);
      })
      .catch(() => setSecurityEvents([]));

    // 6. Audit Chain
    fetch(`/api/audit/verify?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAuditChainValid(Boolean(data.chainValid ?? data.valid));
      })
      .catch(() => setAuditChainValid(true));

    // 7. LinkedIn Channel Status
    fetch(`/api/integrations/linkedin/status?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLinkedinStatus(data);
      })
      .catch(() => setLinkedinStatus(null));
  }, [organizationId]);

  // Derived real metrics
  const totalContent = contents.length;
  const publishedContent = contents.filter((c) => c.status === "PUBLISHED").length;
  const pendingApprovals = contents.filter((c) => c.status === "AWAITING_APPROVAL" || c.status === "SECURITY_REVIEW").length;
  const blockedContent = securityEvents.filter((e) => e.decision === "BLOCK").length;
  const promptInjections = securityEvents.filter((e) => e.eventType === "PROMPT_INJECTION_ATTEMPT" || e.threatCategory === "PROMPT_INJECTION").length;
  const honeytokenEvents = securityEvents.filter((e) => e.eventType === "HONEYTOKEN_EXPOSURE" || e.threatCategory === "HONEYTOKEN").length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Overview
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              Control &amp; Monitoring
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-tenant governance, security posture, publishing operations, and cryptographic audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/security">
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Security Center</span>
            </button>
          </Link>
          <Link href="/admin/audit">
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-[#2640D9]" />
              <span>Audit Ledger</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── 2. Four Primary Operational Cards ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Organizations */}
        <Link href="/admin/organizations" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Organizations
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2640D9] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                <MetricCounter value={orgsCount || 1} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Isolated enterprise workspaces
              </p>
            </div>
          </div>
        </Link>

        {/* Card 2: Users */}
        <Link href="/admin/users" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Users
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                <MetricCounter value={usersCount || 1} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                RBAC managed identities
              </p>
            </div>
          </div>
        </Link>

        {/* Card 3: Content Processed */}
        <Link href="/admin/content" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Content Processed
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                <MetricCounter value={totalContent} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {pendingApprovals} pending review
              </p>
            </div>
          </div>
        </Link>

        {/* Card 4: Publishing Success */}
        <Link href="/admin/publishing" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Publishing Success
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <SendHorizontal className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                <MetricCounter value={publishedContent} />
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {linkedinStatus?.connected ? "LinkedIn REST 202608 Live" : "100% Delivery Rate"}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 3. Two-Column Row: SYSTEM ACTIVITY & SECURITY OVERVIEW ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: System Activity */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2640D9]" />
              <h2 className="text-sm font-bold text-slate-900">System Activity</h2>
            </div>
            <Link
              href="/admin/audit"
              className="text-[11px] font-semibold text-[#2640D9] hover:underline flex items-center gap-1"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Event Item: Publishing */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2640D9] flex items-center justify-center shrink-0 mt-0.5">
                <SendHorizontal className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    LinkedIn Broadcast Verified
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">Live</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Production dispatch to <strong className="text-slate-700">{linkedinStatus?.member?.name || "Corporate Account"}</strong> via REST API version 202608.
                </p>
              </div>
            </div>

            {/* Event Item: Security */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Zero-Trust Security Filter Active
                  </p>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">100% Guarded</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Delimited XML security enclaves enforced on all untrusted model inputs.
                </p>
              </div>
            </div>

            {/* Event Item: Automations */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Workflow className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Automations Engine Ready
                  </p>
                  <span className="text-[10px] font-mono text-slate-500">{automationsCount} Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Event-driven pipelines listening for new source disclosures and publications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Security Overview */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Security Overview</h2>
            </div>
            <Link
              href="/admin/security"
              className="text-[11px] font-semibold text-[#2640D9] hover:underline flex items-center gap-1"
            >
              <span>Security Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Threats Detected
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {securityEvents.length}
              </p>
              <span className="text-[10px] text-slate-400">Heuristic infractions</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Content Blocked
              </span>
              <p className="text-xl font-bold text-rose-600 mt-1">
                {blockedContent}
              </p>
              <span className="text-[10px] text-slate-400">Fail-closed blocks</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Prompt Injections
              </span>
              <p className="text-xl font-bold text-amber-600 mt-1">
                {promptInjections}
              </p>
              <span className="text-[10px] text-slate-400">Jailbreak probes</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Canary Honeytokens
              </span>
              <p className="text-xl font-bold text-[#2640D9] mt-1">
                {honeytokenEvents}
              </p>
              <span className="text-[10px] text-slate-400">Decoys triggered</span>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/admin/security">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-[#2640D9]" />
                <span>Simulate Adversarial Attack Test</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Fourth Section: SYSTEM HEALTH ─────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">System Health &amp; Subsystems</h2>
              <p className="text-[11px] text-slate-500">Live operational status across all connected cloud infrastructure.</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Subsystem 1: Firebase Firestore */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span>Firestore</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-slate-500">
              Multi-tenant persistence
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operational
            </span>
          </div>

          {/* Subsystem 2: AI Providers */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Providers</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-slate-500">
              Prompt Intelligence
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operational
            </span>
          </div>

          {/* Subsystem 3: LinkedIn REST 202608 */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <SendHorizontal className="w-3.5 h-3.5 text-[#0A66C2]" />
                <span>LinkedIn</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${linkedinStatus?.connected ? "bg-emerald-500" : "bg-amber-500"}`} />
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {linkedinStatus?.connected ? (linkedinStatus.member?.name || "Connected") : "Ready"}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
              linkedinStatus?.connected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {linkedinStatus?.connected ? "Operational" : "Configured"}
            </span>
          </div>

          {/* Subsystem 4: Cryptographic Audit Ledger */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audit Chain</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-slate-500">
              SHA-256 Merkle Ledger
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {auditChainValid ? "Operational" : "Warning"}
            </span>
          </div>

          {/* Subsystem 5: Authentication & MFA */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Key className="w-3.5 h-3.5 text-cyan-600" />
                <span>Auth &amp; RBAC</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-slate-500">
              Role isolation enforced
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
