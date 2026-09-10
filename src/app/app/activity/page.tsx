"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
  ShieldCheck,
  AlertCircle,
  FileText,
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "CREATED" | "GENERATED" | "APPROVED" | "PUBLISHED" | "SECURITY_CHECK" | "FAILED";
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
  externalUrl?: string;
  meta?: string;
}

export default function UserActivityPage() {
  const { userProfile } = useAuth();
  const orgId = userProfile?.organizationId || "org_primary";

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "act_1",
      type: "PUBLISHED",
      title: "Published to LinkedIn via REST API 202608",
      description: "Critical Zero-Day Advisory (CVE-2026-8812) successfully published to verified member profile.",
      timestamp: "10 minutes ago",
      channel: "LinkedIn",
      externalUrl: "https://www.linkedin.com/feed/update/urn:li:share:7503499996093177857",
      meta: "Post ID: urn:li:share:7503499996093177857",
    },
    {
      id: "act_2",
      type: "APPROVED",
      title: "Human Compliance Signoff Granted",
      description: "Dual approval completed for LinkedIn executive broadcast version v2.",
      timestamp: "25 minutes ago",
      meta: "Approved by: Compliance Officer",
    },
    {
      id: "act_3",
      type: "SECURITY_CHECK",
      title: "Zero-Trust Security Scan Cleared",
      description: "Passed prompt injection analysis and secret token screening with 0.0 risk score.",
      timestamp: "32 minutes ago",
      meta: "Engine: NEXUS DeepScan",
    },
    {
      id: "act_4",
      type: "GENERATED",
      title: "Multi-Format AI Synthesis Completed",
      description: "Synthesized executive briefing, 3-slide presentation outline, and LinkedIn social asset.",
      timestamp: "35 minutes ago",
      meta: "Model: Gemini 1.5 Pro",
    },
    {
      id: "act_5",
      type: "CREATED",
      title: "Document Ingested",
      description: "Ingested 'Linux eBPF Privilege Escalation Advisory' (2,410 characters).",
      timestamp: "40 minutes ago",
      meta: "Source: Text Input",
    },
  ]);

  const [filterType, setFilterType] = useState<string>("ALL");

  const filtered = filterType === "ALL" ? activities : activities.filter((a) => a.type === filterType);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Personal Audit Trail
            </span>
            <span className="text-xs text-slate-400 font-medium">• Chronological Event Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Personal Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time feed of your created documents, security scans, compliance approvals, and publishing events.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit self-start sm:self-auto text-xs">
          {["ALL", "PUBLISHED", "APPROVED", "GENERATED", "SECURITY_CHECK"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === f ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {filtered.map((item) => {
          const iconConfig = {
            PUBLISHED: { icon: Share2, bg: "bg-blue-600 text-white", border: "border-blue-200" },
            APPROVED: { icon: CheckCircle2, bg: "bg-emerald-600 text-white", border: "border-emerald-200" },
            SECURITY_CHECK: { icon: ShieldCheck, bg: "bg-indigo-600 text-white", border: "border-indigo-200" },
            GENERATED: { icon: Sparkles, bg: "bg-purple-600 text-white", border: "border-purple-200" },
            CREATED: { icon: FileText, bg: "bg-slate-700 text-white", border: "border-slate-200" },
            FAILED: { icon: ShieldAlert, bg: "bg-rose-600 text-white", border: "border-rose-200" },
          }[item.type];

          const Icon = iconConfig.icon;

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Node Circle */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs ring-4 ring-[#f8fafc] ${iconConfig.bg}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Event Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="font-mono">{item.meta}</span>
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                    >
                      <span>View Live Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
