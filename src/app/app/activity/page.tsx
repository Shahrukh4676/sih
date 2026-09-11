"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Workflow,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "CREATED" | "GENERATED" | "SECURITY_CHECK" | "APPROVED" | "PUBLISHED" | "AUTOMATION_COMPLETED";
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
  externalUrl?: string;
  meta?: string;
}

const initialActivities: ActivityItem[] = [
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
    type: "AUTOMATION_COMPLETED",
    title: "Autonomous Pipeline Dispatched",
    description: "Workflow 'Critical Zero-Day Advisory Broadcast' completed without human toil.",
    timestamp: "30 minutes ago",
    meta: "Engine: n8n Cloud Webhook",
  },
  {
    id: "act_4",
    type: "SECURITY_CHECK",
    title: "Zero-Trust Security Scan Cleared",
    description: "Passed prompt injection analysis and secret token screening with 0.0 risk score.",
    timestamp: "32 minutes ago",
    meta: "Engine: NEXUS DeepScan",
  },
  {
    id: "act_5",
    type: "GENERATED",
    title: "Multi-Format AI Synthesis Completed",
    description: "Synthesized executive briefing, 3-slide presentation outline, and LinkedIn social asset.",
    timestamp: "35 minutes ago",
    meta: "Model: Gemini 1.5 Pro",
  },
  {
    id: "act_6",
    type: "CREATED",
    title: "Document Ingested",
    description: "Ingested 'Linux eBPF Privilege Escalation Advisory' (2,410 characters).",
    timestamp: "40 minutes ago",
    meta: "Source: Text Input",
  },
];

export default function UserActivityPage() {
  const { userProfile } = useAuth();
  const [filterType, setFilterType] = useState<string>("ALL");

  const filtered =
    filterType === "ALL"
      ? initialActivities
      : initialActivities.filter((a) => a.type === filterType);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/app" }, { label: "Activity" }]}
        title="Personal Activity Feed"
        description="Chronological audit trail of your created source documents, AI generations, security scans, compliance approvals, and published posts."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Events" },
          { id: "CREATED", label: "Created" },
          { id: "GENERATED", label: "Generated" },
          { id: "SECURITY_CHECK", label: "Security Checked" },
          { id: "APPROVED", label: "Approved" },
          { id: "PUBLISHED", label: "Published" },
          { id: "AUTOMATION_COMPLETED", label: "Automations" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              filterType === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="relative border-l-2 border-slate-200/80 ml-4 space-y-6 pl-6 pt-2">
        {filtered.map((item) => {
          return (
            <div key={item.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                  item.type === "PUBLISHED"
                    ? "bg-emerald-500 ring-4 ring-emerald-50"
                    : item.type === "APPROVED"
                    ? "bg-blue-600 ring-4 ring-blue-50"
                    : item.type === "SECURITY_CHECK"
                    ? "bg-indigo-600 ring-4 ring-indigo-50"
                    : item.type === "AUTOMATION_COMPLETED"
                    ? "bg-cyan-500 ring-4 ring-cyan-50"
                    : "bg-slate-400 ring-4 ring-slate-100"
                }`}
              />

              {/* Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>{item.meta}</span>
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
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
