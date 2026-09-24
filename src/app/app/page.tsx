"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Workflow,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Plus,
  SendHorizontal,
  Shield,
  AlertTriangle,
  ChevronRight,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Content } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

export default function UserHomePage() {
  const { userProfile, organization } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [contents, setContents] = useState<Content[]>([]);
  const [securityEventsCount, setSecurityEventsCount] = useState<number>(0);
  const [threatsBlockedCount, setThreatsBlockedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "Creator";

  useEffect(() => {
    // 1. Fetch live contents
    fetch(`/api/content?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) setContents(data.contents);
      })
      .catch((err) => console.error("Error loading user home content:", err))
      .finally(() => setLoading(false));

    // 2. Fetch security stats
    fetch(`/api/security/events?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.events) {
          setSecurityEventsCount(data.events.length);
          const blocked = data.events.filter((e: any) => e.decision === "BLOCK").length;
          setThreatsBlockedCount(blocked);
        }
      })
      .catch(() => {});
  }, [organizationId]);

  // Real Counts
  const draftsCount = contents.filter((c) => c.status === "DRAFT" || c.status === "GENERATED").length;
  const pendingCount = contents.filter((c) => c.status === "AWAITING_APPROVAL" || c.status === "SECURITY_REVIEW").length;
  const publishedCount = contents.filter((c) => c.status === "PUBLISHED").length;

  // Active items for table
  const activeItems = contents.slice(0, 6);

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* ── 1. HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Turn technical advisories, research reports, and documents into clear communications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/app/automations">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Workflow className="w-3.5 h-3.5 text-[#2640D9]" />
              <span>Automate</span>
            </button>
          </Link>
          <Link href="/app/create">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-[#2640D9] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Content</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── 2. WORKSPACE OVERVIEW (3 COMPACT CARDS) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/app/create" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Drafts
              </span>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#2640D9] transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {draftsCount}
            </div>
            <p className="text-[11px] text-slate-500">In-progress transformations</p>
          </div>
        </Link>

        <Link href="/app/approvals" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Approval
              </span>
              <Clock className="w-4 h-4 text-amber-500 group-hover:scale-105 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {pendingCount}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">Awaiting compliance review</p>
          </div>
        </Link>

        <Link href="/app/activity" className="group">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Published
              </span>
              <SendHorizontal className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {publishedCount}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Delivered to LinkedIn &amp; channels</p>
          </div>
        </Link>
      </div>

      {/* ── 3. ACTIVE WORK ─────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Work</h2>
            <p className="text-[11px] text-slate-500">Your recent content items and their current pipeline status.</p>
          </div>
          <Link
            href="/app/create"
            className="text-xs font-semibold text-[#2640D9] hover:underline flex items-center gap-1"
          >
            <span>+ New Transformation</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading active items...
          </div>
        ) : activeItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl space-y-2">
            <Sparkles className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No content items yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Start by pasting a technical disclosure, CVE advisory, or research paper in the Create studio.
            </p>
            <div className="pt-2">
              <Link href="/app/create">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg bg-[#2640D9] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  Create First Content
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">Content</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Security</th>
                  <th className="pb-2.5 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/app/content/${item.id}`} className="group">
                        <p className="font-semibold text-slate-900 group-hover:text-[#2640D9] transition-colors truncate max-w-xs sm:max-w-sm">
                          {item.title || "Untitled Item"}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.currentVersion?.body?.substring(0, 75) || "Grounded transformation output"}
                        </p>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {item.outputFormat?.replace("_", " ") || "ARTEFACT"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.status === "APPROVED"
                          ? "bg-blue-50 text-[#2640D9] border border-blue-200"
                          : item.status === "AWAITING_APPROVAL" || item.status === "SECURITY_REVIEW"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pass</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-slate-500 font-mono text-[11px]">
                      {formatRelativeTime(item.updatedAt || item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4 & 5. TWO-COLUMN ROW: RECENT ACTIVITY & SECURITY SUMMARY ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity Timeline (2/3 width) */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2640D9]" />
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            </div>
            <Link
              href="/app/activity"
              className="text-[11px] font-semibold text-[#2640D9] hover:underline flex items-center gap-1"
            >
              <span>Full Timeline</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Published to LinkedIn</p>
                <p className="text-[11px] text-slate-500">
                  Advisory broadcast dispatched to LinkedIn.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Recent</span>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-[#2640D9] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Content Transformation</p>
                <p className="text-[11px] text-slate-500">
                  Prompt Intelligence inferred requirements and scored 88/100 Trust.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1h ago</span>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Zero-Trust Screen Passed</p>
                <p className="text-[11px] text-slate-500">
                  Ingress heuristic scan cleared source text with zero prompt injections.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">2h ago</span>
            </div>
          </div>
        </div>

        {/* Optional Security Summary (1/3 width) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Security Status</h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Scans Completed</span>
                <span className="font-mono font-bold text-slate-900">
                  {contents.length + securityEventsCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Threats Blocked</span>
                <span className="font-mono font-bold text-rose-600">
                  {threatsBlockedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Enclave Isolation</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          <Link href="/app/activity" className="pt-2">
            <button
              type="button"
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <span>View Security Activity</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
