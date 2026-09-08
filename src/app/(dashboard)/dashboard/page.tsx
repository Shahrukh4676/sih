"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Send,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Newspaper,
  Workflow,
  Share2,
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Layers,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { StatusIndicator } from "@/components/ui/EmptyState";
import {
  MOCK_USER,
  MOCK_ORGANIZATION,
  MOCK_CONTENTS,
  MOCK_APPROVALS,
  MOCK_SOCIAL_CONNECTIONS,
} from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const userName = userProfile?.displayName || MOCK_USER.displayName;
  const orgName = userProfile?.organizationId || MOCK_ORGANIZATION.name;

  const pendingApprovalsCount = MOCK_APPROVALS.filter(
    (a) => a.status === "PENDING"
  ).length;
  const publishedCount = MOCK_CONTENTS.filter(
    (c) => c.status === "PUBLISHED"
  ).length;
  const generatedCount = MOCK_CONTENTS.length;

  const pipelineStages = [
    { label: "Sources", count: 8, status: "Ingested & Indexed", active: false },
    { label: "Analyzed", count: 8, status: "Structured AI Summary", active: false },
    { label: "Generated", count: generatedCount, status: "Multi-Format Artefacts", active: true },
    { label: "Reviewed", count: pendingApprovalsCount, status: "Human-in-the-Loop", active: pendingApprovalsCount > 0 },
    { label: "Published", count: publishedCount, status: "Distributed to Channels", active: false },
  ];

  const socialChannels = [
    { name: "LinkedIn", status: "Ready for Setup", icon: Share2, isConnected: false },
    { name: "X (Twitter)", status: "Ready for Setup", icon: Share2, isConnected: false },
    { name: "WhatsApp Business", status: "Coming Soon", icon: Send, isConnected: false },
    { name: "n8n Webhook", status: "Coming Soon", icon: Workflow, isConnected: false },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Greeting & Context Summary */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Enterprise Content Intelligence
            </span>
            <span className="text-xs text-slate-400 font-medium">• {orgName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Transform source documents, URLs, and advisories into verified communication artefacts under human approval gates and prompt injection screening.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/transform">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Transform Content
            </Button>
          </Link>
          <Link href="/approvals">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
            >
              Review Queue ({pendingApprovalsCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Generated Artefacts"
          value={generatedCount}
          icon={Sparkles}
          change="+4 this week"
          changeType="positive"
          subtitle="Multi-format outputs"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Approval"
          value={pendingApprovalsCount}
          icon={Clock}
          change="Action required"
          changeType="neutral"
          subtitle="Human review gates"
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Published Items"
          value={publishedCount}
          icon={Send}
          change="Audit tracked"
          changeType="positive"
          subtitle="Direct distribution"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Security Health"
          value="Protected"
          icon={ShieldCheck}
          change="0 Leaks"
          changeType="positive"
          subtitle="Injection defense active"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* 3. Visual Content Pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">
              Content Intelligence Pipeline
            </CardTitle>
            <p className="text-xs text-slate-500">
              End-to-end transformation workflow from raw source to verified distribution
            </p>
          </div>
          <StatusIndicator status="online" label="Workflow Online" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {pipelineStages.map((stage, idx) => (
              <div
                key={stage.label}
                className={`relative p-3.5 rounded-xl border transition-all ${
                  stage.active
                    ? "bg-blue-50/70 border-blue-200 text-blue-900 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200/80 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 0{idx + 1}
                  </span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.2 rounded-full ${
                      stage.active
                        ? "bg-blue-200/60 text-blue-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {stage.count}
                  </span>
                </div>
                <div className="font-semibold text-sm">{stage.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {stage.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Two-Column Workspace: Recent Content & Security/Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Transformations & Approvals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transformations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Recent Content Transformations
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Latest multi-artefact conversions generated from sources
                </p>
              </div>
              <Link href="/content">
                <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                    <th className="px-5 py-3">Content Artefact</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_CONTENTS.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate">
                        <div className="truncate font-semibold">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Org ID: {item.organizationId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral" size="sm">
                          {item.outputFormat.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status === "PUBLISHED"
                              ? "success"
                              : item.status === "AWAITING_APPROVAL"
                              ? "warning"
                              : "brand"
                          }
                          size="sm"
                          dot
                        >
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/content/${item.id}`}>
                          <Button variant="ghost" size="xs">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending Approvals Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Pending Human Approvals
                </CardTitle>
                <p className="text-xs text-slate-500">
                  High-stakes artefacts requiring human signoff before publishing
                </p>
              </div>
              <Link href="/approvals">
                <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                  Go to Queue
                </Button>
              </Link>
            </CardHeader>
            <div className="p-5 space-y-3">
              {MOCK_APPROVALS.map((approval) => {
                const targetContent = MOCK_CONTENTS.find((c) => c.id === approval.contentId);
                const title = targetContent?.title || `Content Item #${approval.contentId}`;
                const submitter = approval.reviewerName || "System Engine";

                return (
                  <div
                    key={approval.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          {title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Reviewer: {submitter}</span>
                          <span>•</span>
                          <span className="text-amber-700 font-medium">
                            Strict Review Policy
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link href={`/content/${approval.contentId}`}>
                        <Button variant="outline" size="xs">
                          Inspect
                        </Button>
                      </Link>
                      <Link href="/approvals">
                        <Button variant="primary" size="xs">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Security Posture & Connected Channels */}
        <div className="space-y-6">
          {/* Security Posture Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Security Screening Posture
                </CardTitle>
                <Badge variant="verified" size="sm" dot>
                  Active
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic risk gates & secret screening
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Prompt Injection Defense</span>
                  <span className="font-semibold text-emerald-700">Enforced</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Secret & Credential Leakage</span>
                  <span className="font-semibold text-emerald-700">Zero Leaks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">PII Redaction & Masking</span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Multi-Tenant Isolation</span>
                  <span className="font-semibold text-blue-700 font-mono text-[11px]">
                    organizationId
                  </span>
                </div>
              </div>

              <Link href="/security" className="block w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Open Security Center
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Connected Channels & Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Distribution Channels
              </CardTitle>
              <p className="text-xs text-slate-500">
                Social accounts & automation webhooks
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {socialChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.name}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-slate-800">
                        {channel.name}
                      </span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {channel.status}
                    </Badge>
                  </div>
                );
              })}

              <Link href="/publishing" className="block w-full pt-1">
                <Button variant="outline" size="sm" className="w-full">
                  Configure Publishing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
