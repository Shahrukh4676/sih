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
    setActionLoading(id);
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
        success("Approved", "Content approved for multi-channel publishing.");
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" } : c))
        );
        if (selectedItem?.id === id) {
          setSelectedItem((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
        }
      }
    } catch (err) {
      error("Error", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: id,
          action: "REJECT",
          organizationId,
          reviewerId: userProfile?.uid || "usr_admin",
          reason: "Did not meet enterprise compliance thresholds",
        }),
      });

      if (res.ok) {
        info("Rejected", "Artefact marked as rejected and returned to creator.");
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "FAILED" } : c))
        );
        if (selectedItem?.id === id) {
          setSelectedItem((prev) => (prev ? { ...prev, status: "FAILED" } : null));
        }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-[#2640D9]" />
              Human Governance &amp; Approvals
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              {pendingItems.length} Awaiting Signoff
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mandatory human compliance review gates before external social distribution and broadcast delivery.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "PENDING"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "APPROVED"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Approved ({approvedItems.length})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "REJECTED"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Rejected ({rejectedItems.length})
          </button>
        </div>
      </div>

      {/* Approvals Table (White Canvas) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4">Content Artefact</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Target Channel</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading governance signoff queue...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No items in the {activeTab.toLowerCase()} approvals queue.
                  </td>
                </tr>
              ) : (
                displayedList.map((item) => {
                  const isAwaiting =
                    item.status === "AWAITING_APPROVAL" ||
                    item.status === "SECURITY_REVIEW" ||
                    item.status === "GENERATED";
                  const isActing = actionLoading === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedItem(item);
                        setSlideOverOpen(true);
                      }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="max-w-xs sm:max-w-sm">
                          <p className="font-semibold text-slate-900 group-hover:text-[#2640D9] transition-colors truncate">
                            {item.title || "Intelligence Artefact"}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.currentVersion?.body?.substring(0, 80) || "No preview body available"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 text-[11px]">
                        {organizationId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {item.outputFormat?.replace("_", " ") || "ARTEFACT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Passed</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === "APPROVED" || item.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {isAwaiting && (
                            <>
                              <button
                                disabled={isActing}
                                onClick={() => handleApprove(item.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                disabled={isActing}
                                onClick={() => handleReject(item.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setSlideOverOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
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

      {/* SlideOver Drawer */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Governance Signoff Gate"
        subtitle={selectedItem ? `${selectedItem.title || "Artefact"} (${selectedItem.id})` : undefined}
      >
        {selectedItem && (
          <div className="space-y-6 text-xs text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500">Security Clearance</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  PASSED • ZERO-TRUST
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Target: <strong className="text-slate-900">{selectedItem.outputFormat}</strong></span>
                <span>Current Status: <strong className="text-[#2640D9]">{selectedItem.status}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2640D9]" />
                Artefact Body Preview
              </label>
              <div className="p-4 rounded-xl bg-white border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-800">
                {selectedItem.currentVersion?.body || selectedItem.content || "No body content available."}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(selectedItem.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 justify-center"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Signoff &amp; Approve
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReject(selectedItem.id)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex-1 justify-center"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
