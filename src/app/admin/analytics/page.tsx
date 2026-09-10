"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { MetricCounter } from "@/components/ui/MetricCounter";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30D");

  const channelBreakdown = [
    { name: "LinkedIn (REST API 202608)", percentage: 58, count: 488, color: "bg-blue-600" },
    { name: "X (Twitter) Threads", percentage: 22, count: 185, color: "bg-cyan-500" },
    { name: "Executive Brief Portal", percentage: 12, count: 101, color: "bg-indigo-600" },
    { name: "Meta WhatsApp Cloud", percentage: 8, count: 68, color: "bg-emerald-500" },
  ];

  const formatDistribution = [
    { format: "LinkedIn Post", count: 420, percent: "38%" },
    { format: "Cybersecurity Advisory", count: 260, percent: "24%" },
    { format: "Executive Summary", count: 195, percent: "18%" },
    { format: "X Thread", count: 120, percent: "11%" },
    { format: "Presentation Deck", count: 60, percent: "5%" },
    { format: "Infographic Spec", count: 45, percent: "4%" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Intelligence & Distribution Analytics
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Enterprise ROI Metrics
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Quantify platform velocity, channel reach, operational time saved, and automated compliance coverage.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          {["7D", "30D", "90D", "YTD"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                timeRange === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top Velocity & Time Savings KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Content Processed
          </span>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-white">
              <MetricCounter value={1100} />+
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +24% vs last period
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Hours of Manual Toil Saved
          </span>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-blue-400">
              <MetricCounter value={420} /> hrs
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Based on 3.5h per manual advisory</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Mean Time-to-Publish
          </span>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-cyan-400">
              4.2 sec
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">End-to-end transformation</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Security Interception Rate
          </span>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              100%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Zero unauthorized injections passed</span>
        </div>
      </div>

      {/* Two Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <SendHorizontal className="w-4 h-4 text-blue-400" />
              Multi-Channel Distribution Share
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Breakdown of external channels reached by approved intelligence assets.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {channelBreakdown.map((ch) => (
              <div key={ch.name} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-200">{ch.name}</span>
                  <span className="font-mono text-slate-400">{ch.count} posts ({ch.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${ch.color} rounded-full transition-all duration-500`}
                    style={{ width: `${ch.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Format Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Generated Output Formats
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Volume generated across the 7 corporate communication templates.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {formatDistribution.map((fmt) => (
              <div
                key={fmt.format}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-200">{fmt.format}</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{fmt.count} units</span>
                  <span className="text-blue-400 font-bold">{fmt.percent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
