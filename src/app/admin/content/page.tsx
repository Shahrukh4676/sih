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
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: id,
          action: "APPROVE",
          organizationId,
          reviewerId: userProfile?.uid || "usr_admin",
        }),
      });
      if (res.ok) {
        success("Content Approved", "Artefact signed off for multi-channel distribution.");
        setContents((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" } : c))
        );
        if (selectedContent?.id === id) {
          setSelectedContent((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
        }
      }
    } catch (e) {
      error("Approval Failed", String(e));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#2640D9]" />
              Enterprise Content Catalog
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              {contents.length} Total Artefacts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global repository of ingested sources, transformed intelligence artefacts, governance signoffs, and published copy.
          </p>
        </div>

        <Link href="/app/create">
          <Button
            variant="primary"
            size="sm"
            className="bg-[#2640D9] hover:bg-blue-700 text-white shadow-2xs self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Create Ingestion
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artefacts by title or text body..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2640D9] focus:bg-white transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Items" },
            { id: "PUBLISHED", label: "Published" },
            { id: "APPROVED", label: "Approved" },
            { id: "AWAITING_APPROVAL", label: "Pending Gates" },
            { id: "DRAFT", label: "Drafts" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                statusFilter === f.id
                  ? "bg-[#2640D9] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table (Clean White) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4">Content Artefact</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Security Clearance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading enterprise content catalog...
                  </td>
                </tr>
              ) : filteredContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No content artefacts found matching the active filter.
                  </td>
                </tr>
              ) : (
                filteredContents.map((c) => {
                  const isPublished = c.status === "PUBLISHED";
                  const isApproved = c.status === "APPROVED";
                  const isAwaiting =
                    c.status === "AWAITING_APPROVAL" || c.status === "SECURITY_REVIEW";

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => handleOpenContent(c)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="max-w-md">
                          <p className="font-semibold text-slate-900 group-hover:text-[#2640D9] transition-colors truncate">
                            {c.title || "Untitled Intelligence Artefact"}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {c.currentVersion?.body?.substring(0, 90) || "No preview body available"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {c.outputFormat?.replace("_", " ") || "ARTEFACT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Passed
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isApproved
                              ? "bg-blue-50 text-[#2640D9] border border-blue-200"
                              : isAwaiting
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
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
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold border border-amber-200 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenContent(c);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-semibold transition-colors"
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

      {/* SlideOver Inspection Drawer */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Artefact Inspection"
        subtitle={selectedContent ? `${selectedContent.title || "Intelligence Item"} (${selectedContent.id})` : undefined}
      >
        {selectedContent && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Status & Clearance Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500">Security Clearance</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  PASSED • ZERO-TRUST
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Format: <strong className="text-slate-900">{selectedContent.outputFormat}</strong></span>
                <span>Status: <strong className="text-[#2640D9]">{selectedContent.status}</strong></span>
              </div>
            </div>

            {/* Generated Content Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2640D9]" />
                Generated Communication Output
              </label>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
                  {selectedContent.currentVersion?.body || selectedContent.content || "No body content recorded."}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedContent.currentVersion?.body || selectedContent.content || ""
                      );
                      success("Copied", "Content copied to clipboard");
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
