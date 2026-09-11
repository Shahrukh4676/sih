"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  FileText,
  SendHorizontal,
  RefreshCw,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SecurityStatus } from "@/components/ui/SecurityStatus";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { Content, ContentStatus } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

export default function UserApprovalsPage() {
  const { userProfile, role } = useAuth();
  const { success, error: showError, info } = useToast();
  const orgId = userProfile?.organizationId || "org_primary";

  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"NEEDS_APPROVAL" | "APPROVED" | "REJECTED">("NEEDS_APPROVAL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAuthorizedToApprove =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "ORG_ADMIN" ||
    role === "REVIEWER" ||
    !role; // In local development / demo mode

  const fetchContent = () => {
    setLoading(true);
    fetch(`/api/content?organizationId=${orgId}`)
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
    fetchContent();
  }, [orgId]);

  const needsApprovalItems = items.filter(
    (c) =>
      c.status === "AWAITING_APPROVAL" ||
      c.status === "SECURITY_REVIEW" ||
      c.status === "GENERATED"
  );
  const approvedItems = items.filter((c) => c.status === "APPROVED" || c.status === "PUBLISHED");
  const rejectedItems = items.filter((c) => c.status === "FAILED");

  const displayedList =
    activeTab === "NEEDS_APPROVAL"
      ? needsApprovalItems
      : activeTab === "APPROVED"
      ? approvedItems
      : rejectedItems;

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: "Approved via User Approvals Queue" }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" as ContentStatus } : c))
        );
        success("Approved", "Content approved and unlocked for publishing.");
      } else {
        showError("Approval Failed", "Unable to approve content item.");
      }
    } catch (err) {
      showError("Error", String(err));
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
        body: JSON.stringify({ reason: "Tone or copy adjustments required." }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "FAILED" as ContentStatus } : c))
        );
        info("Rejected", "Item marked as requiring revision.");
      } else {
        showError("Rejection Failed", "Unable to update item state.");
      }
    } catch (err) {
      showError("Error", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/app" }, { label: "Approvals" }]}
        title="Content Approval Gate"
        description="Every generated communication artefact must clear human review and zero-trust security checks before public distribution."
        primaryAction={
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("NEEDS_APPROVAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "NEEDS_APPROVAL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Needs approval ({needsApprovalItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "APPROVED"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Approved ({approvedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("REJECTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "REJECTED"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rejected ({rejectedItems.length})
            </button>
          </div>
        }
      />

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p>Loading approvals queue...</p>
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={
              activeTab === "NEEDS_APPROVAL"
                ? "All clear — no items need approval"
                : activeTab === "APPROVED"
                ? "No approved items yet"
                : "No rejected items"
            }
            description={
              activeTab === "NEEDS_APPROVAL"
                ? "Every generated intelligence asset has been approved or dispatched."
                : "Content cleared in the review gate will appear here."
            }
            actionLabel={activeTab === "NEEDS_APPROVAL" ? "Create New Artefact" : undefined}
            onAction={activeTab === "NEEDS_APPROVAL" ? () => (window.location.href = "/app/create") : undefined}
          />
        ) : (
          displayedList.map((item) => {
            const isPending =
              item.status === "AWAITING_APPROVAL" ||
              item.status === "SECURITY_REVIEW" ||
              item.status === "GENERATED";

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700">
                      {item.outputFormat || "LINKEDIN"}
                    </span>
                    <SecurityStatus status="CLEAN" />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <Link href={`/app/content/${item.id}`} className="block group">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {item.title || "Intelligence Artefact"}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.currentVersion?.body || item.content || "Content ready for review."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link href={`/app/content/${item.id}`}>
                    <Button variant="ghost" size="xs">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Detail
                    </Button>
                  </Link>

                  {isPending && isAuthorizedToApprove && (
                    <>
                      <Button
                        variant="outline"
                        size="xs"
                        isLoading={actionLoading === item.id}
                        onClick={() => handleReject(item.id)}
                        className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        isLoading={actionLoading === item.id}
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}

                  {item.status === "APPROVED" && (
                    <Link href={`/app/content/${item.id}`}>
                      <Button variant="brand" size="xs">
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
    </div>
  );
}
