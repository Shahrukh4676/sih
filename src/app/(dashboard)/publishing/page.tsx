"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  SendHorizontal,
  Share2,
  AlertTriangle,
  ExternalLink,
  Clock,
  RefreshCw,
  Shield,
  MessageSquare,
  Workflow,
  Unlink,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/Icons";
import { MOCK_CONTENTS } from "@/lib/mock-data";
import { PublishingRecord } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface LinkedInStatus {
  connected: boolean;
  status: string;
  member?: {
    id: string;
    urn: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  scopes?: string[];
  connectedAt?: string;
}

export default function PublishingCenterPage() {
  const [activeTab, setActiveTab] = useState<
    "CHANNELS" | "READY" | "HISTORY"
  >("CHANNELS");

  // Real API state
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [records, setRecords] = useState<PublishingRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<{
    type: "success" | "error";
    message: string;
    postId?: string;
  } | null>(null);

  const fetchLinkedinStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const res = await fetch("/api/integrations/linkedin/status");
      const data = await res.json();
      setLinkedinStatus(data);
    } catch (err) {
      console.error("Error fetching LinkedIn status:", err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setRecordsLoading(true);
      const res = await fetch("/api/publishing/records");
      const data = await res.json();
      if (data.success && data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error("Error fetching publishing records:", err);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedinStatus();
    fetchRecords();
  }, [fetchLinkedinStatus, fetchRecords]);

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/integrations/linkedin/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "org_primary",
          userId: "usr_admin_default",
        }),
      });
      if (res.ok) {
        await fetchLinkedinStatus();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  const handlePublishToLinkedIn = async (contentId: string, title: string) => {
    try {
      setPublishingId(contentId);
      setPublishFeedback(null);

      const res = await fetch("/api/integrations/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          versionId: "v1",
          organizationId: "org_primary",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPublishFeedback({
          type: "success",
          message: `Successfully published "${title}" to LinkedIn!`,
          postId: data.externalPostId,
        });
        await fetchRecords();
        await fetchLinkedinStatus();
      } else {
        setPublishFeedback({
          type: "error",
          message: data.error || `Publishing failed with status: ${data.status}`,
        });
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setPublishFeedback({
        type: "error",
        message: errorObj?.message || "Failed to dispatch publish request",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const readyItems = MOCK_CONTENTS.filter((c) => c.status === "APPROVED");

  const channelIntegrations = [
    {
      id: "LINKEDIN",
      name: "LinkedIn Member Profile",
      desc: "Publish executive updates and verified briefings directly to personal LinkedIn feeds via OAuth 2.0.",
      connected: linkedinStatus?.connected,
      member: linkedinStatus?.member,
      statusLabel: linkedinStatus?.connected ? "Connected (w_member_social)" : "Ready for Setup",
      badgeVariant: linkedinStatus?.connected ? ("verified" as const) : ("neutral" as const),
      icon: LinkedInIcon,
    },
    {
      id: "X_TWITTER",
      name: "X (Twitter) Broadcast",
      desc: "Publish viral threads and quote cards with cryptographic media attachments.",
      connected: false,
      statusLabel: "Future Phase",
      badgeVariant: "neutral" as const,
      icon: Share2,
    },
    {
      id: "INSTAGRAM",
      name: "Instagram Business",
      desc: "Publish visual quote cards, infographics, and carousel media.",
      connected: false,
      statusLabel: "Future Phase",
      badgeVariant: "neutral" as const,
      icon: Share2,
    },
    {
      id: "WHATSAPP",
      name: "Meta WhatsApp Cloud API",
      desc: "Push instant alerts and trigger executive approvals directly via WhatsApp bot.",
      connected: true,
      statusLabel: "Phase 6 Active",
      badgeVariant: "success" as const,
      icon: MessageSquare,
      link: "/whatsapp",
    },
    {
      id: "N8N",
      name: "n8n Cloud Workflow Orchestrator",
      desc: "Autonomous webhook graph (uunidN8XWaIcA5xY) routing approved content to social channels.",
      connected: true,
      statusLabel: "Phase 7 Connected",
      badgeVariant: "verified" as const,
      icon: Workflow,
      link: "/automations",
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Distribution Engine
            </span>
            <span className="text-xs text-slate-400">• Phase 8 LinkedIn Integration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Social Publishing &amp; Distribution Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Publish verified, human-approved artefacts to authorized enterprise social channels via official APIs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              fetchLinkedinStatus();
              fetchRecords();
            }}
            leftIcon={<RefreshCw className={`w-4 h-4 ${statusLoading || recordsLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>AES-256-GCM Encrypted Tokens</span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {publishFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            publishFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {publishFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{publishFeedback.message}</span>
          </div>
          {publishFeedback.postId && (
            <a
              href={`https://www.linkedin.com/feed/update/${publishFeedback.postId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-700 underline hover:text-emerald-900 shrink-0 flex items-center gap-1"
            >
              View on LinkedIn
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: "CHANNELS", label: `Channel Integrations (${channelIntegrations.length})` },
          { id: "READY", label: `Ready to Publish (${readyItems.length})` },
          { id: "HISTORY", label: `Published History (${records.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CHANNELS */}
      {activeTab === "CHANNELS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelIntegrations.map((ch) => {
            const Icon = ch.icon;
            const isLinkedIn = ch.id === "LINKEDIN";

            return (
              <Card key={ch.id} className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isLinkedIn && ch.connected ? "bg-[#0A66C2] text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant={ch.badgeVariant} size="sm" dot={Boolean(ch.connected)}>
                      {ch.statusLabel}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {ch.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {ch.desc}
                  </p>
                  {isLinkedIn && ch.connected && ch.member && (
                    <div className="mt-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
                      <div className="font-semibold">{ch.member.name}</div>
                      <div className="font-mono text-[10px] text-blue-700 truncate">{ch.member.urn}</div>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {ch.connected ? "Active Connection" : "Not Connected"}
                  </span>
                  {isLinkedIn ? (
                    ch.connected ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={handleDisconnect}
                        className="text-rose-600 hover:text-rose-700 hover:border-rose-200"
                        leftIcon={<Unlink className="w-3 h-3" />}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <a href="/api/integrations/linkedin/connect">
                        <Button
                          variant="primary"
                          size="xs"
                          className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                          leftIcon={<LinkedInIcon className="w-3 h-3" />}
                        >
                          Connect LinkedIn
                        </Button>
                      </a>
                    )
                  ) : ch.link ? (
                    <Link href={ch.link}>
                      <Button variant="outline" size="xs">
                        Configure
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="xs" disabled>
                      Future Phase
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: READY TO PUBLISH */}
      {activeTab === "READY" && (
        <div className="space-y-4">
          {readyItems.length === 0 ? (
            <EmptyState
              icon={SendHorizontal}
              title="No artefacts currently awaiting publication"
              description="Once artefacts are approved in the Approval Center, they appear here ready for scheduled or instant broadcast."
            />
          ) : (
            readyItems.map((item) => {
              const bodyText = item.currentVersion.body || "";
              const charCount = bodyText.length;
              const isOverLimit = charCount > 3000;
              const isPublishing = publishingId === item.id;

              return (
                <Card key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="verified" size="sm" dot>
                        Approved
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Format: {item.outputFormat.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        isOverLimit ? "bg-rose-50 text-rose-700 font-bold" : "bg-slate-100 text-slate-600"
                      }`}>
                        {charCount} / 3000 chars
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {bodyText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/content/${item.id}`}>
                      <Button variant="outline" size="xs">
                        Inspect
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="xs"
                      disabled={isOverLimit || isPublishing || !linkedinStatus?.connected}
                      onClick={() => handlePublishToLinkedIn(item.id, item.title)}
                      className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                      leftIcon={<Zap className={`w-3.5 h-3.5 ${isPublishing ? "animate-spin" : ""}`} />}
                    >
                      {isPublishing
                        ? "Publishing..."
                        : linkedinStatus?.connected
                        ? "Publish to LinkedIn"
                        : "Connect LinkedIn to Post"}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: PUBLISHED HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No LinkedIn publications yet."
              description="Approved artefacts published to LinkedIn via the Posts API or n8n workflow will appear here with live permalinks."
            />
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <Card key={rec.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={rec.status === "PUBLISHED" ? "verified" : "danger"}
                        size="sm"
                        dot={rec.status === "PUBLISHED"}
                      >
                        {rec.status}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <LinkedInIcon className="w-3 h-3 text-[#0A66C2]" />
                        LinkedIn
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatRelativeTime(rec.publishedAt || rec.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-600 break-all">
                      Post ID: {rec.externalPostId || "N/A"}
                    </div>

                    {rec.error && (
                      <div className="text-xs text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {rec.error}
                      </div>
                    )}
                  </div>

                  {rec.publishedUrl && (
                    <a
                      href={rec.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="xs" leftIcon={<ExternalLink className="w-3 h-3" />}>
                        View Post
                      </Button>
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
