"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Check,
} from "lucide-react";
import { Content } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ConfirmationDialog } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { formatRelativeTime } from "@/lib/utils";

export default function ApprovalCenterPage() {
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<Content | null>(null);
  const [editableBody, setEditableBody] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [rejectReasonModal, setRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/content?organizationId=${organizationId}&status=AWAITING_APPROVAL,SECURITY_REVIEW,GENERATED`
      );
      const data = await res.json();
      if (data.success && data.contents) {
        setItems(data.contents);
        if (data.contents.length > 0) {
          setActiveItem(data.contents[0]);
          const body =
            data.contents[0].currentVersion?.body ||
            data.contents[0].content ||
            "";
          setEditableBody(body);
        } else {
          setActiveItem(null);
          setEditableBody("");
        }
      }
    } catch (err) {
      console.error("Error fetching approvals queue:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (id: string) => {
    if (!activeItem) return;
    const itemTitle = activeItem.title;
    const contentId = activeItem.id;

    try {
      await fetch(`/api/approvals/appr_${contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          status: "APPROVED",
          reviewerId: userProfile?.uid || "user_governance_lead",
          reviewerName: userProfile?.displayName || "Governance Officer",
          comments: "Approved via Approval Center",
        }),
      });
      setSuccessToast(`"${itemTitle}" approved! Available in Publishing Center.`);
    } catch (err) {
      console.error("Error submitting approval:", err);
    }

    const remaining = items.filter((i) => i.id !== id);
    setItems(remaining);
    setActiveItem(remaining[0] || null);
    if (remaining[0]) {
      setEditableBody(
        remaining[0].currentVersion?.body || remaining[0].content || ""
      );
    }
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleReject = async () => {
    if (!activeItem || !rejectReason.trim()) return;
    const contentId = activeItem.id;

    try {
      await fetch(`/api/approvals/appr_${contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          status: "REJECTED",
          reviewerId: userProfile?.uid || "user_governance_lead",
          reviewerName: userProfile?.displayName || "Governance Officer",
          comments: rejectReason,
        }),
      });
    } catch (err) {
      console.error("Error submitting rejection:", err);
    }

    setSuccessToast(`"${activeItem.title}" rejected and logged to audit trail.`);
    setRejectReasonModal(false);
    const remaining = items.filter((i) => i.id !== activeItem.id);
    setItems(remaining);
    setActiveItem(remaining[0] || null);
    if (remaining[0]) {
      setEditableBody(
        remaining[0].currentVersion?.body || remaining[0].content || ""
      );
    }
    setRejectReason("");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Governance Gate
            </span>
            <span className="text-xs text-slate-400">• Strict Human Signoff</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Human-in-the-Loop Approval Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Review and authorize AI-generated publications before public delivery to connected channels.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>Policy: Human Review Mandatory</span>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* 2. Review Queue or Empty State */}
      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Review Queue is Clear"
          description="All AI transformations have been reviewed, approved, or published. Check the Content Library or trigger new transformations in the Studio."
          actionLabel="Go to Transform Studio"
          onAction={() => (window.location.href = "/transform")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Pending List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Pending Queue ({items.length})
            </div>

            {items.map((item) => {
              const isSelected = activeItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    setEditableBody(item.currentVersion?.body || item.content || "");
                    setIsEditing(false);
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="neutral" size="sm">
                      {(item.outputFormat || "Content").replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      variant={
                        item.status === "SECURITY_REVIEW" ? "danger" : "warning"
                      }
                      size="sm"
                      dot
                    >
                      {(item.status || "PENDING").replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                    <span>Target: {item.targetAudience}</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Inspection & Action Workspace (8 cols) */}
          {activeItem && (
            <div className="lg:col-span-8 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Artefact Inspection &amp; Signoff
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Format: {(activeItem.outputFormat || "Content").replace(/_/g, " ")} • Target: {activeItem.targetAudience}
                    </p>
                  </div>
                  <Badge variant="verified" size="sm" dot>
                    Security Screened
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Body Preview</span>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? "Done Editing" : "Edit In-Place"}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={editableBody}
                        onChange={(e) => setEditableBody(e.target.value)}
                        rows={10}
                        className="font-sans text-xs leading-relaxed"
                      />
                    ) : (
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                        {editableBody}
                      </div>
                    )}
                  </div>

                  {/* Decision Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectReasonModal(true)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Reject Content
                    </Button>

                    <div className="flex items-center gap-2">
                      <Link href={`/content/${activeItem.id}`}>
                        <Button variant="outline" size="sm">
                          Inspect Workspace
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(activeItem.id)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Approve Artefact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectReasonModal}
        onClose={() => setRejectReasonModal(false)}
        title="Reject Content Artefact"
        description="Provide a justification for the audit trail and governance log."
      >
        <div className="space-y-4">
          <Textarea
            label="Rejection Rationale"
            placeholder="E.g., Tone does not match compliance standards; factual inconsistency with advisory CVE references."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            required
          />
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectReasonModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
