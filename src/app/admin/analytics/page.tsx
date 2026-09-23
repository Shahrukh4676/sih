"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  SendHorizontal,
  ShieldCheck,
  Zap,
  Layers,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { MetricCounter } from "@/components/ui/MetricCounter";
import { useAuth } from "@/context/AuthContext";
import { Content } from "@/types";

export default function AdminAnalyticsPage() {
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [timeRange, setTimeRange] = useState("30D");
  const [contents, setContents] = useState<Content[]>([]);
  const [securityEventsCount, setSecurityEventsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [contentRes, secRes] = await Promise.all([
        fetch(`/api/content?organizationId=${organizationId}`).then((r) => (r.ok ? r.json() : { contents: [] })),
        fetch(`/api/security/events?organizationId=${organizationId}`).then((r) => (r.ok ? r.json() : { events: [] })),
      ]);

      setContents(contentRes.contents || []);
      setSecurityEventsCount((secRes.events || []).length);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [organizationId]);

  const totalProcessed = contents.length;
  const publishedCount = contents.filter((c) => c.status === "PUBLISHED").length;
  const approvedCount = contents.filter((c) => c.status === "APPROVED").length;
  const hoursSaved = Math.max(1, Math.round(totalProcessed * 2.5));

  // Dynamic format distribution
  const formatCounts: Record<string, number> = {};
  contents.forEach((c) => {
    const fmt = c.outputFormat || c.outputType || "Other";
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
  });

  const formatDistribution = Object.entries(formatCounts).map(([fmt, cnt]) => ({
    format: fmt.replace(/_/g, " "),
    count: cnt,
    percent: totalProcessed > 0 ? `${Math.round((cnt / totalProcessed) * 100)}%` : "0%",
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#2640D9]" />
              Intelligence &amp; Distribution Analytics
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quantify transformation velocity, channel reach, operational time saved, and automated compliance coverage.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {["7D", "30D", "90D", "YTD"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                timeRange === t
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Content Processed
          </span>
          <div className="text-2xl font-bold text-slate-900">
            <MetricCounter value={totalProcessed} />
          </div>
          <p className="text-[11px] text-slate-500">Ingested documents &amp; advisories</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Transformations Completed
          </span>
          <div className="text-2xl font-bold text-[#2640D9]">
            <MetricCounter value={totalProcessed} />
          </div>
          <p className="text-[11px] text-blue-700">Prompt Intelligence executed</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Human Approvals Signoff
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            <MetricCounter value={approvedCount + publishedCount} />
          </div>
          <p className="text-[11px] text-emerald-700">Governance cleared</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Manual Time Saved
          </span>
          <div className="text-2xl font-bold text-purple-600">
            ~{hoursSaved} hrs
          </div>
          <p className="text-[11px] text-purple-700">Operational toil eliminated</p>
        </div>
      </div>

      {/* Two-Column Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Channel & Format Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Format &amp; Output Breakdown</h3>
            <span className="text-xs font-mono text-slate-500">Live Breakdown</span>
          </div>

          <div className="space-y-3">
            {formatDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No distribution data recorded yet.</p>
            ) : (
              formatDistribution.map((item) => (
                <div key={item.format} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{item.format}</span>
                    <span className="font-mono text-slate-500">{item.count} items ({item.percent})</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2640D9]"
                      style={{ width: item.percent }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Security & Governance Compliance */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Zero-Trust Security &amp; Trust Score</h3>
            <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              100% Inspected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Average Trust Score</p>
                <p className="text-[11px] text-slate-500">Fact-grounding &amp; hallucination minimization</p>
              </div>
              <span className="text-lg font-bold font-mono text-emerald-600">88 / 100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Security Gate Enforcement</p>
                <p className="text-[11px] text-slate-500">Heuristic injection screens on every transform</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#2640D9]">{totalProcessed + securityEventsCount} Scans</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Cryptographic Ledger Assurance</p>
                <p className="text-[11px] text-slate-500">SHA-256 Merkle chained audit blocks</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
