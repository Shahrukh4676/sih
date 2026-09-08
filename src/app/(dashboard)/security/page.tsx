"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Users,
  Smartphone,
  Lock,
  Globe,
  Terminal,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Laptop,
  Check,
  XCircle,
} from "lucide-react";
import {
  MOCK_AUDIT_LOGS,
  MOCK_SECURITY_EVENTS,
  MOCK_USER,
  MOCK_ORGANIZATION,
} from "@/lib/mock-data";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";

export default function SecurityCenterPage() {
  const [activeTab, setActiveTab] = useState<
    "CAPABILITIES" | "AUDIT" | "INCIDENTS" | "RBAC" | "SESSIONS"
  >("CAPABILITIES");
  const [mfaEnabled, setMfaEnabled] = useState(MOCK_USER.mfaEnabled);

  const activeSessions = [
    {
      id: "sess_01",
      device: "Windows 11 Enterprise (Chrome 130)",
      location: "Frankfurt, Germany",
      ipAddress: "198.51.100.42",
      current: true,
      lastActive: "Active now",
    },
    {
      id: "sess_02",
      device: "iOS Mobile Safari (iPhone 15 Pro)",
      location: "Frankfurt, Germany",
      ipAddress: "198.51.100.99",
      current: false,
      lastActive: "2 hours ago",
    },
  ];

  const rbacMatrix = [
    { role: "ADMIN", access: "Organization management, members, settings, security policies", write: true, publish: true, audit: true },
    { role: "CREATOR", access: "Content creation, transformation generation, draft edits", write: true, publish: false, audit: false },
    { role: "REVIEWER", access: "Human-in-the-loop review queue, approve/reject artefacts", write: true, publish: true, audit: true },
    { role: "VIEWER", access: "Read-only access to published library & dashboards", write: false, publish: false, audit: false },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Enterprise Governance
            </span>
            <span className="text-xs text-slate-400">• Security Screening Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Security Intelligence &amp; Content Safety Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time prompt injection detection, PII/secret redaction, tenant isolation, and cryptographic audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security Guard: 0 Breaches Logged</span>
        </div>
      </div>

      {/* 2. Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Prompt Injection Defense"
          value="100% Active"
          icon={Shield}
          change="Real-Time"
          changeType="positive"
          subtitle="Heuristic pattern matching"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Secret Redaction"
          value="0 Leaked"
          icon={Key}
          change="Zero tolerance"
          changeType="positive"
          subtitle="API keys & tokens masked"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="PII Data Masking"
          value="Enforced"
          icon={Lock}
          change="Active"
          changeType="positive"
          subtitle="Emails, phones, cards redacted"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Tenant Isolation"
          value="Strict"
          icon={Users}
          change="organizationId"
          changeType="positive"
          subtitle="Firestore rule enforcement"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: "CAPABILITIES", label: "Security Capabilities" },
          { id: "INCIDENTS", label: `Security Incidents (${MOCK_SECURITY_EVENTS.length})` },
          { id: "AUDIT", label: `Cryptographic Audit Logs (${MOCK_AUDIT_LOGS.length})` },
          { id: "RBAC", label: "RBAC Permissions Scope" },
          { id: "SESSIONS", label: "Active Sessions & MFA" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CAPABILITIES */}
      {activeTab === "CAPABILITIES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="verified" size="sm" dot>
                  Enabled
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">Pre-Transform Gate</span>
              </div>
              <CardTitle className="text-sm font-semibold">
                Prompt Injection Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Screens uploaded source documents and text for override keywords (&ldquo;ignore previous instructions&rdquo;, &ldquo;reveal system prompt&rdquo;, &ldquo;developer mode&rdquo;, adversarial jailbreak patterns). Suspicious inputs are marked for review or quarantined before model inference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="verified" size="sm" dot>
                  Enabled
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">Real-Time Masking</span>
              </div>
              <CardTitle className="text-sm font-semibold">
                Secret &amp; Credential Redaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deterministic regex and entropy checks detect API keys (OpenAI, AWS, GitHub PATs, generic secrets), JWTs, Bearer tokens, and private keys. Findings are masked (e.g. <code>ghp_**********</code>) prior to database storage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="verified" size="sm" dot>
                  Enabled
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">Privacy Preserving</span>
              </div>
              <CardTitle className="text-sm font-semibold">
                PII Detection &amp; Masking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identifies sensitive personal information including corporate email addresses, phone numbers, credit cards, and social security numbers. Evidence is masked before logging or persistence to maintain privacy compliance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="verified" size="sm" dot>
                  Enforced
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">Tenant Boundary</span>
              </div>
              <CardTitle className="text-sm font-semibold">
                Multi-Tenant Isolation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every organization-owned resource is strictly scoped to <code>organizationId</code>. Cloud Firestore security rules prohibit cross-tenant access, unauthorized reads, and ensure immutable append-only audit tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: INCIDENTS */}
      {activeTab === "INCIDENTS" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Security Screening Incidents
            </CardTitle>
            <p className="text-xs text-slate-500">
              Heuristic flags, prompt injection alerts, and credential masks
            </p>
          </CardHeader>
          <div className="p-5 space-y-3">
            {MOCK_SECURITY_EVENTS.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {ev.eventType.replace(/_/g, " ")}
                      </span>
                      <Badge variant="danger" size="sm">
                        {ev.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {ev.description}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Logged {formatDate(ev.timestamp)} • Action: {ev.status}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => alert(`Inspection details for event ${ev.id}: Incident neutralised and reported.`)}
                >
                  Inspect Event
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === "AUDIT" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Cryptographic Audit Log
            </CardTitle>
            <p className="text-xs text-slate-500">
              Immutable SHA-256 chained transaction records
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.userEmail}</div>
                      <div className="text-[10px] text-blue-600 font-mono">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          log.severity === "CRITICAL"
                            ? "danger"
                            : log.severity === "WARNING"
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {log.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                      {log.integrityHash.substring(0, 24)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: RBAC */}
      {activeTab === "RBAC" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Role-Based Access Control (RBAC) Matrix
            </CardTitle>
            <p className="text-xs text-slate-500">
              Nexus AI isolates content generation from approval and publication
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="px-5 py-3">Role</th>
                  <th className="px-4 py-3">Permissions Scope</th>
                  <th className="px-4 py-3 text-center">Write Draft</th>
                  <th className="px-4 py-3 text-center">Approve / Signoff</th>
                  <th className="px-4 py-3 text-center">Audit Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rbacMatrix.map((row) => (
                  <tr key={row.role} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-bold text-slate-900">{row.role}</td>
                    <td className="px-4 py-3 text-slate-600">{row.access}</td>
                    <td className="px-4 py-3 text-center">
                      {row.write ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.publish ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.audit ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: SESSIONS & MFA */}
      {activeTab === "SESSIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Multi-Factor Authentication (MFA)
                </CardTitle>
                <Badge variant="verified" size="sm" dot>
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Require hardware security keys (FIDO2 / WebAuthn) or time-based one-time passwords (TOTP) for sign-in.
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Enforce Organization-wide MFA
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Applies to all creators, editors, and reviewers
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mfaEnabled}
                  onChange={(e) => setMfaEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Active User Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {sess.device}
                      </span>
                      {sess.current && (
                        <Badge variant="brand" size="sm">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sess.location} • {sess.ipAddress}
                    </div>
                  </div>

                  {!sess.current && (
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() => alert("Session revoked.")}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
