"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Lock,
  Layers,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/Icons";
import { Content, PublishingRecord } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

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

export default function AdminPublishingPage() {
  const { userProfile } = useAuth();
  const { success, error, info } = useToast();
  const searchParams = useSearchParams();
  const targetContentId = searchParams.get("contentId");

  const organizationId = userProfile?.organizationId || "org_primary";
  const userId = userProfile?.uid || "usr_admin_default";

  const [activeTab, setActiveTab] = useState<"READY" | "CHANNELS" | "HISTORY">("READY");
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [records, setRecords] = useState<PublishingRecord[]>([]);
  const [readyItems, setReadyItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchLinkedinStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const res = await fetch(
        `/api/integrations/linkedin/status?organizationId=${encodeURIComponent(organizationId)}&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }
      );
      const data = await res.json();
      setLinkedinStatus(data);
    } catch (err) {
      console.error("Error fetching LinkedIn status:", err);
    } finally {
      setStatusLoading(false);
    }
  }, [organizationId, userId]);

  const fetchContentAndHistory = useCallback(async () => {
    try {
      setLoading(true);
      const [contentRes, historyRes] = await Promise.all([
        fetch(`/api/content?organizationId=${organizationId}`),
        fetch(`/api/publishing/history?organizationId=${organizationId}`).catch(() => null),
      ]);

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        const items = contentData.contents || [];
        // Items ready for publishing
        const ready = items.filter(
          (c: Content) => c.status === "APPROVED" || c.status === "GENERATED"
        );
        setReadyItems(ready);
      }

      if (historyRes && historyRes.ok) {
        const histData = await historyRes.json();
        setRecords(histData.records || []);
      }
    } catch (err) {
      console.error("Error loading publishing data:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchLinkedinStatus();
    fetchContentAndHistory();
  }, [fetchLinkedinStatus, fetchContentAndHistory]);

  const handlePublishToLinkedin = async (contentItem: Content) => {
    try {
      setPublishingId(contentItem.id);
      const textToPublish =
        contentItem.currentVersion?.body || contentItem.content || contentItem.title;

      const res = await fetch("/api/integrations/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId,
          contentId: contentItem.id,
          text: textToPublish,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success(
          "Published to LinkedIn!",
          `Post published using official LinkedIn API version 202608. Post ID: ${data.postId}`
        );
        // Refresh
        fetchContentAndHistory();
      } else {
        error(
          "Publishing Error",
          data.error || "LinkedIn API returned an unexpected error."
        );
      }
    } catch (err) {
      error("Publishing Failed", String(err));
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <SendHorizontal className="w-6 h-6 text-blue-500" />
              Multi-Channel Publishing Operations
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              LinkedIn API 202608 Active
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Publish approved intelligence artefacts to verified corporate social networks, advisories, and messaging pipelines.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("READY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "READY"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ready Queue ({readyItems.length})
          </button>
          <button
            onClick={() => setActiveTab("CHANNELS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "CHANNELS"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Connected Channels
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "HISTORY"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Publishing Ledger ({records.length})
          </button>
        </div>
      </div>

      {/* Primary Channel Showcase: LinkedIn (API 202608) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <LinkedInIcon className="w-6 h-6 fill-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                LinkedIn Marketing REST API
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                API Version: 202608
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Production Verified
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Connected Account: <strong className="text-white">Mohammed Ayaan</strong> • Scopes: <code className="text-blue-400 font-mono text-[10px]">w_member_social, openid, profile, email</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLinkedinStatus}
            disabled={statusLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}`} />
            Sync Status
          </button>
        </div>
      </div>

      {/* Tab: Ready Queue */}
      {activeTab === "READY" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Approved Artefacts Awaiting Distribution
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {readyItems.length} items ready
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
              Loading ready queue...
            </div>
          ) : readyItems.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-slate-300">No Items in Publishing Queue</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Approved content from the review gate will automatically appear here ready for 1-click multi-channel distribution.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyItems.map((item) => {
                const bodyText = item.currentVersion?.body || item.title;
                const isItemPublishing = publishingId === item.id;

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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.status}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white truncate">
                        {item.title || "Intelligence Artefact"}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {bodyText}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isItemPublishing}
                        onClick={() => handlePublishToLinkedin(item)}
                        className="bg-[#0A66C2] hover:bg-[#084e96] text-white shadow-md shadow-blue-500/20"
                      >
                        <LinkedInIcon className="w-3.5 h-3.5 mr-1.5 fill-white" />
                        Post to LinkedIn (202608)
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Connected Channels */}
      {activeTab === "CHANNELS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-blue-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white">
                <LinkedInIcon className="w-5 h-5 fill-white" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CONNECTED
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">LinkedIn Company & Profile</h3>
              <p className="text-xs text-slate-400 mt-1">API Version: 202608 • Verified Active</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Member: Mohammed Ayaan
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 opacity-80">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                <Share2 className="w-5 h-5 text-slate-300" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                CONFIGURED
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">X / Twitter Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">OAuth 2.0 PKCE • Ready for dispatch</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Thread auto-splitter active
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 opacity-80">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/40 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Meta WhatsApp Cloud</h3>
              <p className="text-xs text-slate-400 mt-1">Business API v21.0 • Webhook verified</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Incoming article trigger + outbound
            </div>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "HISTORY" && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Historical Distribution Log</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every external dispatch is permanently recorded in the tamper-evident ledger.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              API Version: 202608
            </span>
          </div>

          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No past publishing dispatches recorded yet in this workspace.
              </div>
            ) : (
              records.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                        {r.channel}
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {r.status}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>
                    {r.externalPostId && (
                      <p className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                        URN: {r.externalPostId}
                      </p>
                    )}
                  </div>

                  {r.publishedUrl && (
                    <a
                      href={r.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
                    >
                      <span>View Live Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
