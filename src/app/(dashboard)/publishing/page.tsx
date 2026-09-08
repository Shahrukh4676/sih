"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SendHorizontal,
  Share2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  RefreshCw,
  Plus,
  Shield,
  Layers,
  MessageSquare,
  Workflow,
} from "lucide-react";
import { MOCK_SOCIAL_CONNECTIONS, MOCK_PUBLISHING_JOBS, MOCK_CONTENTS } from "@/lib/mock-data";
import { SocialPlatform } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PublishingCenterPage() {
  const [activeTab, setActiveTab] = useState<
    "CHANNELS" | "READY" | "SCHEDULED" | "HISTORY"
  >("CHANNELS");

  const channelIntegrations = [
    {
      id: "LINKEDIN",
      name: "LinkedIn Company Page & Profile",
      desc: "Post executive updates, articles, and carousels via official OAuth 2.0 PKCE.",
      status: "READY_FOR_SETUP",
      statusLabel: "Ready for Setup",
      badgeVariant: "neutral" as const,
      icon: Share2,
    },
    {
      id: "X_TWITTER",
      name: "X (Twitter) Broadcast",
      desc: "Publish viral threads and quote cards with media attachments.",
      status: "READY_FOR_SETUP",
      statusLabel: "Ready for Setup",
      badgeVariant: "neutral" as const,
      icon: Share2,
    },
    {
      id: "INSTAGRAM",
      name: "Instagram Business",
      desc: "Publish infographics, quotes, and story card visual assets.",
      status: "COMING_SOON",
      statusLabel: "Coming Soon (Phase 8)",
      badgeVariant: "warning" as const,
      icon: Share2,
    },
    {
      id: "WHATSAPP",
      name: "WhatsApp Cloud API",
      desc: "Direct push alerts and two-way executive approval bot.",
      status: "COMING_SOON",
      statusLabel: "Coming Soon (Phase 8)",
      badgeVariant: "warning" as const,
      icon: MessageSquare,
    },
    {
      id: "N8N",
      name: "n8n Automation Webhook",
      desc: "Trigger complex enterprise workflows on content signoff.",
      status: "COMING_SOON",
      statusLabel: "Coming Soon (Phase 7)",
      badgeVariant: "warning" as const,
      icon: Workflow,
    },
  ];

  const readyItems = MOCK_CONTENTS.filter((c) => c.status === "APPROVED");
  const publishedItems = MOCK_CONTENTS.filter((c) => c.status === "PUBLISHED");
  const scheduledJobs = MOCK_PUBLISHING_JOBS.filter((j) => j.status === "QUEUED");

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Distribution Engine
            </span>
            <span className="text-xs text-slate-400">• Multi-Channel Publishing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Social Publishing &amp; Distribution Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Publish verified, human-approved artefacts to authorized enterprise social channels.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero Password Storage • Scoped OAuth Only</span>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: "CHANNELS", label: `Channel Integrations (${channelIntegrations.length})` },
          { id: "READY", label: `Ready to Publish (${readyItems.length})` },
          { id: "SCHEDULED", label: `Scheduled Queue (${scheduledJobs.length})` },
          { id: "HISTORY", label: `Published History (${publishedItems.length})` },
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
            return (
              <Card key={ch.id} className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant={ch.badgeVariant} size="sm">
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
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {ch.status === "READY_FOR_SETUP" ? "Disconnected" : "In Development"}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={ch.status === "COMING_SOON"}
                    onClick={() =>
                      alert(`OAuth connection flow for ${ch.name} will initiate with official enterprise client credentials.`)
                    }
                  >
                    {ch.status === "READY_FOR_SETUP" ? "Connect Channel" : "Coming Soon"}
                  </Button>
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
            readyItems.map((item) => (
              <Card key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="verified" size="sm" dot>
                      Approved
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Format: {item.outputFormat.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {item.currentVersion.body}
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
                    onClick={() => alert(`Staged "${item.title}" for immediate dispatch once social channels are connected.`)}
                  >
                    Dispatch to Channels
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SCHEDULED QUEUE */}
      {activeTab === "SCHEDULED" && (
        <div className="space-y-4">
          {scheduledJobs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Scheduled queue is currently empty"
              description="Schedule approved posts for peak engagement windows or timezone optimization."
            />
          ) : (
            scheduledJobs.map((job) => (
              <Card key={job.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-slate-800">
                    Platform: {job.platform}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Scheduled for: {job.scheduledFor}
                  </div>
                </div>
                <Badge variant="warning" size="sm">
                  Queued
                </Badge>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 4: PUBLISHED HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          {publishedItems.map((item) => (
            <Card key={item.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-800">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-400">
                  Published {formatRelativeTime(item.publishedAt || item.createdAt)}
                </div>
              </div>
              <Badge variant="verified" size="sm" dot>
                Published
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
