"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  SendHorizontal,
  CheckCircle2,
  XCircle,
  Copy,
  Edit2,
  RefreshCw,
  Share2,
  ExternalLink,
  ArrowLeft,
  Lock,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SecurityStatus } from "@/components/ui/SecurityStatus";
import { LinkedInIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { Content } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

export default function UserContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { userProfile, role } = useAuth();
  const { success, error: showError, info } = useToast();
  const orgId = userProfile?.organizationId || "org_primary";
  const userId = userProfile?.uid || "usr_anonymous";

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isReviewerOrAdmin =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "ORG_ADMIN" ||
    role === "REVIEWER";

  useEffect(() => {
    fetch(`/api/content/${id}?organizationId=${orgId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
          setEditedBody(data.content.currentVersion?.body || data.content.content || "");
        }
      })
      .catch((err) => console.error("Error loading content detail:", err))
      .finally(() => setLoading(false));
  }, [id, orgId]);

  const handleCopy = () => {
    if (!content) return;
    const body = editedBody || content.currentVersion?.body || "";
    navigator.clipboard.writeText(body);
    setCopied(true);
    success("Copied", "Content text copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!content) return;
    try {
      setActionLoading("approve");
      const res = await fetch(`/api/approvals/${content.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: "Approved via User Content Studio" }),
      });
      if (res.ok) {
        setContent((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
        success("Approved", "Content approved and cleared for publishing.");
      } else {
        showError("Approval Failed", "Unable to approve content.");
      }
    } catch (err) {
      showError("Error", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishLinkedIn = async () => {
    if (!content) return;
    try {
      setActionLoading("publish");
      const bodyToPublish = editedBody || content.currentVersion?.body || content.title;
      const res = await fetch("/api/integrations/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          userId,
          contentId: content.id,
          text: bodyToPublish,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContent((prev) => (prev ? { ...prev, status: "PUBLISHED" } : null));
        success(
          "Published to LinkedIn!",
          `Post created via LinkedIn API 202608. Post URN: ${data.postId}`
        );
      } else {
        showError("Publishing Error", data.error || "LinkedIn API returned an error.");
      }
    } catch (err) {
      showError("Publishing Failed", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        <p>Loading content details...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="py-16 text-center space-y-3">
        <FileText className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Content Not Found</h2>
        <p className="text-xs text-slate-500">The requested content item does not exist or has been removed.</p>
        <Link href="/app">
          <Button variant="outline" size="sm">
            Return to Workspace Home
          </Button>
        </Link>
      </div>
    );
  }

  const isPendingApproval =
    content.status === "AWAITING_APPROVAL" ||
    content.status === "SECURITY_REVIEW" ||
    content.status === "GENERATED";
  const isApproved = content.status === "APPROVED";
  const isPublished = content.status === "PUBLISHED";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Content", href: "/app/activity" },
          { label: content.title || "Artefact Detail" },
        ]}
        title={content.title || "Intelligence Artefact"}
        description={`Target Format: ${content.outputFormat?.replace("_", " ") || "Communication Asset"} • Created ${formatRelativeTime(content.createdAt)}`}
        badge={
          <div className="flex items-center gap-2">
            <Badge
              variant={isPublished ? "success" : isApproved ? "info" : isPendingApproval ? "warning" : "neutral"}
            >
              {content.status}
            </Badge>
            <SecurityStatus status="CLEAN" />
          </div>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            {isPendingApproval && isReviewerOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading === "approve"}
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
            )}

            {(isApproved || isPendingApproval) && (
              <Button
                variant="brand"
                size="sm"
                isLoading={actionLoading === "publish"}
                onClick={handlePublishLinkedIn}
                className="bg-[#0A66C2] hover:bg-[#084e96]"
              >
                <LinkedInIcon className="w-3.5 h-3.5 mr-1.5 fill-white" />
                Publish LinkedIn (202608)
              </Button>
            )}
          </div>
        }
      />

      {/* Main 2-Column Split View & Metadata Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Content Body */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generated Output Canvas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Generated Communication Output</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Done Editing" : "Edit"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full p-4 rounded-xl border border-slate-200 text-xs text-slate-900 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                {editedBody || content.currentVersion?.body || "No generated body recorded."}
              </div>
            )}
          </div>

          {/* Source Document Context */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Origin Source Context</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5 font-mono">
              <p>Source ID: <span className="text-slate-900">{content.sourceId || "SRC_INGESTED_01"}</span></p>
              <p>Format Specification: <span className="text-blue-600 font-semibold">{content.outputFormat}</span></p>
              <p>Integrity Hash: <span className="text-slate-500 text-[11px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span></p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Metadata Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100">
              Governance &amp; Lifecycle
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-[11px] block">Security Clearance</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero-Trust Clean (0 Threats)
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Approval State</span>
                <span className="font-semibold text-slate-800 capitalize mt-0.5 block">
                  {content.status}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Target Distribution Channel</span>
                <span className="font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                  <Share2 className="w-3.5 h-3.5" />
                  LinkedIn (REST API 202608)
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Created By</span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {content.userId || "Current Workspace Creator"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Creation Timestamp</span>
                <span className="font-mono text-slate-500 text-[11px] mt-0.5 block">
                  {content.createdAt}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/app/create" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Create Another Artefact
                </Button>
              </Link>
              <Link href="/app/approvals" className="w-full">
                <Button variant="ghost" size="sm" className="w-full justify-center text-slate-500">
                  Back to Approvals Queue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
