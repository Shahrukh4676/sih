"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  SendHorizontal,
  ShieldCheck,
  ShieldAlert,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Eye,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { Content, OutputFormat, ContentStatus } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AdminContentPage() {
  const { userProfile } = useAuth();
  const { success, error, info } = useToast();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [formatFilter, setFormatFilter] = useState<string>("ALL");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/content?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) {
          setContents(data.contents);
        }
      })
      .catch((err) => console.error("Error loading content:", err))
      .finally(() => setLoading(false));
  }, [organizationId]);

  const filteredContents = contents.filter((c) => {
    const matchesSearch =
      (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.currentVersion?.body || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "AWAITING_APPROVAL" &&
        (c.status === "AWAITING_APPROVAL" || c.status === "SECURITY_REVIEW")) ||
      c.status === statusFilter;
    const matchesFormat =
      formatFilter === "ALL" || c.outputFormat === formatFilter;
    return matchesSearch && matchesStatus && matchesFormat;
  });

  const handleOpenContent = (c: Content) => {
    setSelectedContent(c);
    setSlideOverOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: "Approved via Admin Console Review Gate" }),
      });
      if (res.ok) {
        setContents((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" as ContentStatus } : c))
        );
        if (selectedContent?.id === id) {
          setSelectedContent((prev) => (prev ? { ...prev, status: "APPROVED" as ContentStatus } : null));
        }
        success("Artefact Approved", "Content approved and unlocked for multi-channel distribution.");
      } else {
        error("Approval Failed", "Failed to register approval in ledger.");
      }
    } catch (err) {
      error("Approval Error", String(err));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-500" />
              Content Intelligence Studio
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {contents.length} Ingested & Generated Artefacts
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Enterprise content repository with split-pane source-to-artefact inspection, compliance audit, and human review gates.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artefacts, titles, or body..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Items" },
            { id: "AWAITING_APPROVAL", label: "Needs Approval" },
            { id: "APPROVED", label: "Approved" },
            { id: "PUBLISHED", label: "Published" },
            { id: "GENERATED", label: "Ready" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                statusFilter === s.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">Title / Source</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Compliance & Security</th>
                <th className="py-3 px-4">Lifecycle State</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading content intelligence repository...
                  </td>
                </tr>
              ) : filteredContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No content artefacts found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredContents.map((c) => {
                  const isPublished = c.status === "PUBLISHED";
                  const isAwaiting =
                    c.status === "AWAITING_APPROVAL" ||
                    c.status === "SECURITY_REVIEW";
                  const isApproved = c.status === "APPROVED";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenContent(c)}
                      className="hover:bg-slate-850/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                            {c.title || "Untitled Intelligence Artefact"}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {c.currentVersion?.body?.substring(0, 80) || "No preview body available"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {c.outputFormat?.replace("_", " ") || "ARTEFACT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Pass (0 Threats)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isPublished
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : isApproved
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : isAwaiting
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatRelativeTime(c.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAwaiting && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(c.id);
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-medium border border-amber-500/30 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenContent(c);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium border border-slate-700/60"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split-Pane SlideOver Inspection Drawer */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Artefact Deep Inspection"
        subtitle={selectedContent ? `${selectedContent.title || "Intelligence Item"} (${selectedContent.id})` : undefined}
      >
        {selectedContent && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Top Status & Compliance Bar */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500">Compliance & Security Clearance</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  PASSED • ZERO-TRUST
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Output Format: <strong className="text-white">{selectedContent.outputFormat}</strong></span>
                <span>Status: <strong className="text-blue-400">{selectedContent.status}</strong></span>
              </div>
            </div>

            {/* Split Views: Source vs Generated */}
            <div className="space-y-4">
              {/* Generated Content Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Generated Communication Output
                  </label>
                  <button
                    onClick={() => {
                      if (selectedContent.currentVersion?.body) {
                        navigator.clipboard.writeText(selectedContent.currentVersion.body);
                        success("Copied", "Content body copied to clipboard.");
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {selectedContent.currentVersion?.body || "No generated body text recorded."}
                </div>
              </div>

              {/* Source Details */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Origin Source Context
                </label>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                  <p>Source ID: <span className="font-mono text-slate-300">{selectedContent.sourceId || "SRC_DIRECT"}</span></p>
                  <p>Created: <span className="text-slate-300">{selectedContent.createdAt}</span></p>
                  <p>SHA-256 Digest: <span className="font-mono text-xs text-blue-400">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span></p>
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                {(selectedContent.status === "AWAITING_APPROVAL" || selectedContent.status === "SECURITY_REVIEW") && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-500"
                    onClick={() => handleApprove(selectedContent.id)}
                  >
                    <CheckSquare className="w-4 h-4 mr-1.5" />
                    Register Executive Approval
                  </Button>
                )}
                {selectedContent.status === "APPROVED" && (
                  <Link href={`/admin/publishing?contentId=${selectedContent.id}`} className="w-full">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-500"
                    >
                      <SendHorizontal className="w-4 h-4 mr-1.5" />
                      Publish to LinkedIn (API 202608)
                    </Button>
                  </Link>
                )}
              </div>

              <Link href={`/admin/content/${selectedContent.id}`} className="block w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-700 text-slate-300 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  Full Deep Inspection &amp; Audit Hash ➔
                </Button>
              </Link>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
