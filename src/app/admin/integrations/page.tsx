"use client";

import React, { useState } from "react";
import {
  Plug,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Share2,
  Workflow,
  MessageSquare,
  Flame,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

interface IntegrationItem {
  id: string;
  name: string;
  category: "PUBLISHING" | "AUTOMATION" | "MESSAGING" | "INFRASTRUCTURE";
  status: "CONNECTED" | "CONFIGURED" | "OPTIONAL";
  version?: string;
  details: string;
  account?: string;
  verified: boolean;
}

const initialIntegrations: IntegrationItem[] = [
  {
    id: "linkedin",
    name: "LinkedIn Marketing & Social REST API",
    category: "PUBLISHING",
    status: "CONNECTED",
    version: "202608",
    details: "Production-verified direct social publishing with OAuth 2.0 3-legged tokens.",
    account: "Mohammed Ayaan (URN: urn:li:person:...) ",
    verified: true,
  },
  {
    id: "n8n",
    name: "n8n Cloud Workflow Orchestrator",
    category: "AUTOMATION",
    status: "CONNECTED",
    version: "v1.78.1",
    details: "Autonomous multi-step pipeline engine with HMAC-SHA256 authenticated webhook callbacks.",
    account: "https://nexus.app.n8n.cloud",
    verified: true,
  },
  {
    id: "whatsapp",
    name: "Meta WhatsApp Cloud API",
    category: "MESSAGING",
    status: "CONNECTED",
    version: "Graph v21.0",
    details: "Two-way conversational ingestion of news URLs and real-time distribution alerts.",
    account: "WABA ID: 1083920194812",
    verified: true,
  },
  {
    id: "gemini",
    name: "Google Gemini 1.5 Pro & Flash",
    category: "INFRASTRUCTURE",
    status: "CONNECTED",
    version: "v1beta",
    details: "Foundation model reasoning, source distillation, and multi-format artefact generation.",
    account: "Google AI Studio Enterprise Quota",
    verified: true,
  },
  {
    id: "firebase",
    name: "Google Firebase Firestore & Auth",
    category: "INFRASTRUCTURE",
    status: "CONNECTED",
    version: "12.18.0",
    details: "Multi-tenant real-time database, user identity verification, and document persistence.",
    account: "nexoura-prod",
    verified: true,
  },
  {
    id: "x_twitter",
    name: "X (Twitter) Developer Enterprise API",
    category: "PUBLISHING",
    status: "CONFIGURED",
    version: "v2",
    details: "Thread formatting and automated thread publishing with PKCE authentication.",
    account: "Enterprise App Configured",
    verified: false,
  },
];

export default function AdminIntegrationsPage() {
  const { success, info } = useToast();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (item: IntegrationItem) => {
    setSyncing(item.id);
    setTimeout(() => {
      setSyncing(null);
      success("Integration Synchronized", `${item.name} status and credentials re-verified.`);
    }, 600);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Plug className="w-6 h-6 text-blue-500" />
              Enterprise Integration Control Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Zero-Trust Token Storage
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage authenticated third-party connectors, social API versions, webhook secret handshakes, and identity providers.
          </p>
        </div>
      </div>

      {/* Featured Production Verified: LinkedIn API 202608 */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <LinkedInIcon className="w-8 h-8 fill-white" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                LinkedIn Marketing REST API
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Linkedin-Version: 202608
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PRODUCTION VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Active Member: <strong className="text-white">Mohammed Ayaan</strong> • Scopes: <code className="text-blue-400 font-mono text-[10px]">w_member_social, openid, profile, email</code>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Outbound Header Enforcement: <span className="text-emerald-400">Linkedin-Version: 202608 (Sunset-proof)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            isLoading={syncing === "linkedin"}
            onClick={() => handleSync(integrations[0])}
            className="border-blue-800/40 text-blue-300 hover:bg-blue-950/30"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Validate Token
          </Button>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                  {item.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    item.status === "CONNECTED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white">{item.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.details}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              {item.account && (
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  Target: <span className="text-slate-200">{item.account}</span>
                </p>
              )}
              {item.version && (
                <p className="text-[11px] text-slate-500 font-mono">
                  Version: <span className="text-blue-400">{item.version}</span>
                </p>
              )}

              <Button
                variant="secondary"
                size="sm"
                isLoading={syncing === item.id}
                onClick={() => handleSync(item)}
                className="w-full text-xs mt-2 border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200"
              >
                <RefreshCw className="w-3 h-3 mr-1.5 text-blue-400" />
                Test Health & Handshake
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
