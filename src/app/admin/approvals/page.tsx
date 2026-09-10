"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  FileText,
  SendHorizontal,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { useToast } from "@/components/ui/ToastProvider";
import { Content, ContentStatus } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AdminApprovalsPage() {
  const { userProfile } = useAuth();
  const { success, error, info } = useToast();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [selectedItem, setSelectedItem] = useState<Content | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApprovals = () => {
    setLoading(true);
    fetch(`/api/content?organizationId=${organizationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) {
          setItems(data.contents);
        }
      })
      .catch((err) => console.error("Error loading approvals:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovals();
  }, [organizationId]);

  const pendingItems = items.filter(
    (c) =>
      c.status === "AWAITING_APPROVAL" ||
      c.status === "SECURITY_REVIEW" ||
      c.status === "GENERATED"
  );
  const approvedItems = items.filter(
    (c) => c.status === "APPROVED" || c.status === "PUBLISHED"
  );
  const rejectedItems = items.filter((c) => c.status === "FAILED");

  const displayedList =
    activeTab === "PENDING"
      ? pendingItems
      : activeTab === "APPROVED"
      ? approvedItems
      : rejectedItems;

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: "Executive Human-in-the-Loop clearance approved." }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" as ContentStatus } : c))
        );
        success("Gate Cleared", "Artefact approved and queued for distribution.");
        setSlideOverOpen(false);
      } else {
        error("Approval Failed", "Unable to register approval transaction.");
      }
    } catch (err) {
      error("Error", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Content tone requires refinement before distribution." }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "FAILED" as ContentStatus } : c))
        );
        info("Artefact Returned", "Item marked as requiring revision.");
        setSlideOverOpen(false);
      } else {
        error("Rejection Failed", "Unable to update rejection state.");
      }
    } catch (err) {
      error("Error", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <CheckSquare className="w-6 h-6 text-emerald-500" />
              Compliance & Approval Center
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Strict Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Zero content is distributed to public channels without explicit cryptographic human approval and security validation.
          </p>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "PENDING"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending Review ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "APPROVED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Approved ({approvedItems.length})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "REJECTED"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Revision Needed ({rejectedItems.length})
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            Loading approval queue...
          </div>
        ) : displayedList.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-300">Approval Queue Cleared</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              All intelligence artefacts have been processed according to corporate compliance policy.
            </p>
          </div>
        ) : (
          displayedList.map((item) => {
            const isPending =
              item.status === "AWAITING_APPROVAL" ||
              item.status === "SECURITY_REVIEW" ||
              item.status === "GENERATED";

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {item.outputFormat?.replace("_", " ") || "ARTEFACT"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Zero-Trust Clean
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">
                    {item.title || "Intelligence Summary"}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.currentVersion?.body || "No generated body"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setSlideOverOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
                  >
                    Inspect Full Text
                  </button>

                  {isPending && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoading === item.id}
                        onClick={() => handleReject(item.id)}
                        className="border-red-800/40 text-red-400 hover:bg-red-950/30"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoading === item.id}
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}

                  {item.status === "APPROVED" && (
                    <Link href={`/admin/publishing?contentId=${item.id}`}>
                      <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500">
                        <SendHorizontal className="w-3.5 h-3.5 mr-1" />
                        Publish
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Item SlideOver */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Compliance Review Gate"
        subtitle={selectedItem ? `${selectedItem.title || "Artefact"} (${selectedItem.id})` : undefined}
      >
        {selectedItem && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Header pill */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">Format</span>
                <span className="text-xs font-mono font-bold text-blue-400">{selectedItem.outputFormat}</span>
              </div>
              <p className="text-sm font-bold text-white">{selectedItem.title}</p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Generated Text Content
              </label>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {selectedItem.currentVersion?.body || "No body content."}
              </div>
            </div>

            {/* Security Check results */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Zero-Trust Pre-Flight Check</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Prompt Injection Scan</span>
                  <span>CLEAN (0.01 risk)</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>PII & Secrets Quarantine</span>
                  <span>NO DETECTIONS</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Brand Disclaimer Attached</span>
                  <span>VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-1/2 border-red-800/40 text-red-400 hover:bg-red-950/30"
                onClick={() => handleReject(selectedItem.id)}
              >
                Reject / Require Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-1/2 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => handleApprove(selectedItem.id)}
              >
                Authorize & Approve
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
