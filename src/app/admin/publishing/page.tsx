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
  Sparkles,
  Radio,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/Icons";
import { Content, PublishingRecord } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

interface LinkedInStatus {
  connected: boolean;
  configured?: boolean;
  mode?: "live" | "simulation";
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
  expiresAt?: string;
}

export default function AdminPublishingPage() {
  const { userProfile } = useAuth();
  const { success, error, info } = useToast();
  const searchParams = useSearchParams();

  const organizationId = userProfile?.organizationId || "org_primary";
  const userId = userProfile?.uid || "usr_admin_default";

  const [activeTab, setActiveTab] = useState<"READY" | "CHANNELS" | "HISTORY">("READY");
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [records, setRecords] = useState<PublishingRecord[]>([]);
  const [readyItems, setReadyItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Test Broadcast state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPostText, setTestPostText] = useState(
    "NEXUS AI Pipeline Test: Autonomous intelligence artifact verified against LinkedIn Marketing REST API 202608. #NexusAI #EnterpriseAI #Cybersecurity"
  );
  const [isBroadcastingTest, setIsBroadcastingTest] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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
          "Published to LinkedIn Live!",
          `Post published using official LinkedIn API version 202608. Post URN: ${data.postId || data.externalId}`
        );
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

  const handleDisconnectLinkedIn = async () => {
    if (!confirm("Are you sure you want to disconnect your LinkedIn integration? Stored tokens will be permanently revoked.")) {
      return;
    }
    try {
      setDisconnecting(true);
      const res = await fetch("/api/integrations/linkedin/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success("LinkedIn Disconnected", "Credentials purged. Reconnect whenever ready.");
        fetchLinkedinStatus();
      } else {
        error("Disconnect Failed", data.error || "Unable to disconnect LinkedIn.");
      }
    } catch (err) {
      error("Error", String(err));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleExecuteTestBroadcast = async () => {
    if (!testPostText.trim()) return;
    try {
      setIsBroadcastingTest(true);
      const res = await fetch("/api/integrations/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId,
          text: testPostText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success(
          "LinkedIn Test Broadcast Verified!",
          `Live post created via LinkedIn REST API 202608. URN: ${data.postId || data.externalId}`
        );
        setShowTestModal(false);
        fetchContentAndHistory();
      } else {
        error("Test Broadcast Failed", data.error || "LinkedIn API rejected test post.");
      }
    } catch (err) {
      error("Broadcast Error", String(err));
    } finally {
      setIsBroadcastingTest(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <SendHorizontal className="w-6 h-6 text-[#2640D9]" />
              Publishing Operations
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              LinkedIn REST 202608 Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch approved intelligence artifacts to verified professional networks and corporate distribution pipelines.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("READY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "READY"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Ready Queue ({readyItems.length})
          </button>
          <button
            onClick={() => setActiveTab("CHANNELS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "CHANNELS"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Connected Channels
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "HISTORY"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Ledger ({records.length})
          </button>
        </div>
      </div>

      {/* Primary Channel Showcase: LinkedIn (API 202608) - White Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          {linkedinStatus?.member?.avatar ? (
            <img
              src={linkedinStatus.member.avatar}
              alt={linkedinStatus.member.name || "LinkedIn Profile"}
              className="w-12 h-12 rounded-2xl object-cover border border-blue-200 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/10">
              <LinkedInIcon className="w-6 h-6 fill-white" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                LinkedIn Marketing REST API
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#2640D9] border border-blue-200">
                API Version: 202608
              </span>
              {linkedinStatus?.connected ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {linkedinStatus.mode === "live" ? "Live Production Verified" : "Simulation Mode"}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {linkedinStatus?.connected ? (
                <>
                  Connected Member: <strong className="text-slate-900">{linkedinStatus.member?.name || "Connected Profile"}</strong>
                  {linkedinStatus.member?.email && ` (${linkedinStatus.member.email})`} • Scopes: <code className="text-[#2640D9] font-mono text-[10px] bg-blue-50 px-1 py-0.5 rounded">{linkedinStatus.scopes?.join(", ") || "w_member_social, openid, profile, email"}</code>
                </>
              ) : (
                <span className="text-slate-500">
                  Authorize your LinkedIn profile to publish intelligence summaries directly to your professional network.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {linkedinStatus?.connected ? (
            <>
              <button
                onClick={() => setShowTestModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold shadow-2xs transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                Test Live Broadcast
              </button>
              <button
                onClick={fetchLinkedinStatus}
                disabled={statusLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin text-[#2640D9]" : ""}`} />
                Sync
              </button>
              <button
                onClick={handleDisconnectLinkedIn}
                disabled={disconnecting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </>
          ) : (
            <a
              href={`/api/integrations/linkedin/connect?returnUrl=/admin/publishing&organizationId=${encodeURIComponent(organizationId)}&userId=${encodeURIComponent(userId)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/10"
            >
              <LinkedInIcon className="w-4 h-4 fill-white" />
              Connect LinkedIn (OAuth 2.0)
            </a>
          )}
        </div>
      </div>

      {/* Tab: Ready Queue */}
      {activeTab === "READY" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Approved Artefacts Awaiting Distribution
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {readyItems.length} items ready
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
              Loading ready queue...
            </div>
          ) : readyItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <CheckCircle2 className="w-8 h-8 text-[#2640D9] mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-slate-800">No Items in Publishing Queue</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Approved content from the review gate will automatically appear here ready for 1-click multi-channel distribution.
              </p>
              <button
                onClick={() => setShowTestModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#2640D9] hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-all shadow-2xs"
              >
                <Radio className="w-3.5 h-3.5" />
                Dispatch a Live Test Post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {readyItems.map((item) => {
                const bodyText = item.currentVersion?.body || item.content || item.title;
                const isItemPublishing = publishingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {item.outputFormat?.replace("_", " ") || "ARTEFACT"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {item.title || "Intelligence Artefact"}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {bodyText}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isItemPublishing}
                        onClick={() => handlePublishToLinkedin(item)}
                        className="bg-[#0A66C2] hover:bg-[#084e96] text-white shadow-2xs"
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
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white">
                <LinkedInIcon className="w-5 h-5 fill-white" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                linkedinStatus?.connected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                {linkedinStatus?.connected ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">LinkedIn Company &amp; Profile</h3>
              <p className="text-xs text-slate-500 mt-1">API Version: 202608 • Verified Marketing API</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-mono space-y-1">
              <div>Member: <span className="font-semibold text-slate-900">{linkedinStatus?.member?.name || "Not connected"}</span></div>
              {linkedinStatus?.member?.urn && (
                <div className="truncate text-slate-400">{linkedinStatus.member.urn}</div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 opacity-75">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Share2 className="w-5 h-5 text-slate-700" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                CONFIGURED
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">X / Twitter Enterprise</h3>
              <p className="text-xs text-slate-500 mt-1">OAuth 2.0 PKCE • Ready for dispatch</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              Thread auto-splitter active
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 opacity-75">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Meta WhatsApp Cloud</h3>
              <p className="text-xs text-slate-500 mt-1">Business API v21.0 • Webhook verified</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              Incoming article trigger + outbound
            </div>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "HISTORY" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historical Distribution Log</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every external dispatch is permanently recorded in the tamper-evident ledger.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
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
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#2640D9] border border-blue-200 uppercase">
                        {r.channel}
                      </span>
                      <span className="text-emerald-700 flex items-center gap-1 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {r.status}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>
                    {r.externalPostId && (
                      <p className="text-[11px] font-mono text-slate-600 truncate max-w-md">
                        URN: {r.externalPostId}
                      </p>
                    )}
                  </div>

                  {r.publishedUrl && (
                    <a
                      href={r.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2640D9] border border-blue-200 text-xs font-semibold transition-colors"
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

      {/* Test Broadcast Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white">
                  <LinkedInIcon className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dispatch Live Test to LinkedIn</h3>
                  <p className="text-[11px] text-slate-500 font-mono">REST API 202608 • w_member_social</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Broadcast Payload</label>
              <textarea
                value={testPostText}
                onChange={(e) => setTestPostText(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2640D9] focus:bg-white font-sans transition-colors"
              />
              <p className="text-[11px] text-slate-500">
                Target account: <strong className="text-slate-800">{linkedinStatus?.member?.name || "Verified Profile"}</strong> ({linkedinStatus?.member?.urn || "urn:li:person:..."})
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestModal(false)}
                disabled={isBroadcastingTest}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isBroadcastingTest}
                onClick={handleExecuteTestBroadcast}
                className="bg-[#0A66C2] hover:bg-[#084e96] text-white"
              >
                <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />
                Broadcast to Live Feed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
