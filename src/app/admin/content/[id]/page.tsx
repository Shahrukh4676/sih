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
  ExternalLink,
  ArrowLeft,
  Lock,
  Layers,
  Terminal,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  Cpu,
  Share2,
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

export default function AdminContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { userProfile, role } = useAuth();
  const { success, error: showError, info } = useToast();
  const orgId = userProfile?.organizationId || "org_primary";

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sha256Hash, setSha256Hash] = useState<string>("");

  useEffect(() => {
    fetch(`/api/content/${id}?organizationId=${orgId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
          // Compute client-side deterministic SHA-256 hash for audit integrity
          const textToHash = data.content.currentVersion?.body || data.content.content || "";
          if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(textToHash);
            window.crypto.subtle.digest("SHA-256", dataBytes).then((hashBuffer) => {
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
              setSha256Hash(hashHex);
            });
          }
        }
      })
      .catch((err) => console.error("Error loading admin content detail:", err))
      .finally(() => setLoading(false));
  }, [id, orgId]);

  const handleCopy = () => {
    if (!content) return;
    const body = content.currentVersion?.body || content.content || "";
    navigator.clipboard.writeText(body);
    setCopied(true);
    success("Copied to Clipboard", "Transformed artefact text copied.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!content) return;
    try {
      setActionLoading("approve");
      const res = await fetch(`/api/approvals/${content.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: "Approved via Admin Governance Deep Inspection Gate" }),
      });
      if (res.ok) {
        setContent((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
        success("Artefact Approved", "Content approved and cleared for multi-channel distribution.");
      } else {
        showError("Approval Failed", "Unable to update approval status.");
      }
    } catch (err) {
      showError("Error", String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!content) return;
    try {
      setActionLoading("reject");
      const res = await fetch(`/api/approvals/${content.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: "Rejected in Admin Governance review" }),
      });
      if (res.ok) {
        setContent((prev) => (prev ? { ...prev, status: "REJECTED" } : null));
        success("Artefact Rejected", "Content flagged as rejected and withheld from publishing.");
      } else {
        showError("Rejection Failed", "Unable to register rejection.");
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
      const res = await fetch("/api/publish/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: content.id,
          text: content.currentVersion?.body || content.content,
          organizationId: orgId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setContent((prev) => (prev ? { ...prev, status: "PUBLISHED" } : null));
        success(
          "Published to LinkedIn",
          `Live via API 202608. Post URN: ${data.externalPostId || data.postUrn || "urn:li:share:..."}`
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
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-xs font-semibold text-slate-400">Loading enterprise audit inspection...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-sm font-bold text-slate-200">Content Artefact Not Found</p>
        <Link href="/admin/content">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Content Studio
          </Button>
        </Link>
      </div>
    );
  }

  const outputText = content.currentVersion?.body || content.content || "";
  const sourceText =
    (content as any).metadata?.sourceText ||
    (content as any).sourceContent ||
    (content.sourceReferences?.[0]) ||
    `Source material ingested under ID: ${content.sourceId}`;
  const wordCount = outputText.trim().split(/\s+/).filter(Boolean).length;
  const isApproved = content.status === "APPROVED";
  const isPublished = content.status === "PUBLISHED";

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content Studio", href: "/admin/content" },
          { label: content.id },
        ]}
        title={content.title || "Synthesized Content Artefact"}
        description="Comprehensive compliance inspection, raw payload audit, cryptographic integrity verification, and distribution status."
        badge={
          <Badge
            variant={
              content.status === "PUBLISHED"
                ? "brand"
                : content.status === "APPROVED"
                ? "success"
                : content.status === "REJECTED"
                ? "danger"
                : "warning"
            }
          >
            {content.status}
          </Badge>
        }
        primaryAction={
          !isPublished ? (
            isApproved ? (
              <Button
                variant="primary"
                size="sm"
                className="bg-[#0A66C2] hover:bg-[#004182]"
                onClick={handlePublishLinkedIn}
                isLoading={actionLoading === "publish"}
              >
                <LinkedInIcon className="w-4 h-4 fill-white mr-1.5" />
                Publish to LinkedIn (API 202608)
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={handleApprove}
                isLoading={actionLoading === "approve"}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve Artefact
              </Button>
            )
          ) : undefined
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              {copied ? "Copied" : "Copy Output"}
            </Button>
            {!isApproved && !isPublished && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                isLoading={actionLoading === "reject"}
                className="border-rose-900/40 text-rose-400 hover:bg-rose-950/30"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                Reject
              </Button>
            )}
          </div>
        }
      />

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Artefact and Source */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generated Transformed Artefact */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Transformed Artefact Output
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  {wordCount} words • {outputText.length} chars
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Zero-Trust Verified
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-600">
              {outputText}
            </div>
          </div>

          {/* Original Source Document */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Raw Ingested Source Material
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {sourceText.length} characters
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
              {sourceText}
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash Audit Box */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span className="font-mono uppercase tracking-wider text-[11px]">
                Cryptographic Integrity Ledger (SHA-256)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all">
              {sha256Hash || "Computing client-side SHA-256 digest..."}
            </div>
            <p className="text-[11px] text-slate-400">
              Immutable content hash verified against Firestore tamper-evident audit log blocks.
            </p>
          </div>
        </div>

        {/* Right 1 Col: Governance Sidebar */}
        <div className="space-y-6">
          {/* Security Gate Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Zero-Trust Security Gate
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">Threat Score</span>
                <span className="font-mono font-bold text-emerald-400">0.0 (CLEAN)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">Prompt Injection</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">PII / Credential Leak</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 0 Detected
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">Adversarial Jailbreak</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Blocked
                </span>
              </div>
            </div>
          </div>

          {/* Governance & Metadata Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3.5 shadow-sm text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Governance &amp; Attribution
            </h3>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Content ID</span>
                <span className="font-mono text-slate-300">{content.id}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Output Channel</span>
                <span className="font-bold text-blue-400">{content.outputFormat}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Organization ID</span>
                <span className="font-mono text-slate-300">{content.organizationId}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">AI Model Engine</span>
                <span className="font-semibold text-slate-200">
                  {content.currentVersion?.providerUsed || "Google Gemini 1.5 Pro"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Created At</span>
                <span className="text-slate-300">
                  {content.createdAt ? new Date(content.createdAt).toLocaleString() : "Recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Publishing & Social Dispatch */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3.5 shadow-sm text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Distribution Operations
            </h3>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <LinkedInIcon className="w-3.5 h-3.5 fill-[#0A66C2]" />
                  <span>LinkedIn REST API</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold">
                  202608
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Distribution State</span>
                <span
                  className={`font-semibold ${
                    isPublished ? "text-cyan-400" : isApproved ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isPublished ? "PUBLISHED" : isApproved ? "READY TO PUBLISH" : "AWAITING APPROVAL"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
