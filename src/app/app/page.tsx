"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Workflow,
  ArrowRight,
  Clock,
  CheckCircle2,
  Share2,
  FileText,
  ShieldCheck,
  Zap,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Content } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

export default function UserWorkspaceHomePage() {
  const { userProfile, organization } = useAuth();
  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "User";
  const orgId = userProfile?.organizationId || "org_primary";

  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content?organizationId=${orgId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) {
          setRecentContent(data.contents.slice(0, 6));
        }
      })
      .catch((err) => console.error("Error loading user workspace content:", err))
      .finally(() => setLoading(false));
  }, [orgId]);

  const pendingApprovals = recentContent.filter(
    (c) => c.status === "AWAITING_APPROVAL" || c.status === "SECURITY_REVIEW" || c.status === "GENERATED"
  );
  const publishedContent = recentContent.filter((c) => c.status === "PUBLISHED");

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Welcoming Hero Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>User Workspace</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Good morning, {userName}.
        </h1>
        <p className="text-base text-slate-500 font-medium">
          Turn information into communication. What would you like to build today?
        </p>
      </div>

      {/* 2. Two Primary Action Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action 1: Create Manually */}
        <Link
          href="/app/create"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-500/10 transition-all hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Create Manually</h2>
              <p className="text-xs text-blue-100 leading-relaxed max-w-sm">
                Paste an article, upload a PDF advisory, or provide a URL. Our multi-model engine transforms it into verified LinkedIn, X, and executive communication assets in seconds.
              </p>
            </div>

            <div className="flex items-center gap-2 font-semibold text-xs text-white group-hover:translate-x-1 transition-transform">
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Action 2: Automate */}
        <Link
          href="/app/automations"
          className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-8 text-slate-900 shadow-sm transition-all hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-indigo-50/50 blur-2xl group-hover:scale-125 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Workflow className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Automate</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Set up autonomous event rules. When new advisories or RSS topics arrive, auto-generate drafts, run zero-trust screening, and queue for compliance approval.
              </p>
            </div>

            <div className="flex items-center gap-2 font-semibold text-xs text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Configure Automation Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Pending Approvals & Quick Distribution */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Pending Compliance Review ({pendingApprovals.length})
              </h3>
            </div>
            <Link href="/app/activity" className="text-xs font-semibold text-amber-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{item.title}</span>
                  <Badge variant="warning" size="sm">
                    {item.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.currentVersion?.body || item.content || "Content ready for compliance review."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  <span className="font-medium text-blue-600">{item.outputFormat || "LINKEDIN"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Recent Transformed Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Content</h3>
            <p className="text-xs text-slate-500">Your latest intelligence transformations</p>
          </div>
          <Link href="/app/activity" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>Activity History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : recentContent.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Your content workspace is ready</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Transform your first report, zero-day CVE, or research article into verified social and executive copy.
            </p>
            <Link href="/app/create">
              <Button variant="brand" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Create Your First Transformation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentContent.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                      {item.outputFormat || "LINKEDIN"}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {item.currentVersion?.body || item.content || "Artefact ready."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">Security Passed</span>
                  </div>
                  <Link href="/app/activity" className="text-slate-400 hover:text-slate-700">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Connected Channels Status Pill */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">LinkedIn REST API (v202608)</p>
            <p className="text-slate-500 text-[11px]">Production Verified • Direct Member Publishing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Active Channel
          </span>
          <Link href="/app/profile">
            <Button variant="ghost" size="xs">
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
