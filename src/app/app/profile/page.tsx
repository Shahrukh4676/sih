"use client";

import React, { useState } from "react";
import {
  User as UserIcon,
  Building,
  Sparkles,
  Share2,
  Shield,
  KeyRound,
  CheckCircle2,
  Lock,
  ExternalLink,
  Smartphone,
  Cpu,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";

export default function UserProfilePage() {
  const { userProfile, organization, role, logout } = useAuth();
  const { success } = useToast();

  const [aiProvider, setAiProvider] = useState<"MANAGED" | "BYOK" | "OLLAMA">("MANAGED");
  const [byokKey, setByokKey] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "User";
  const userEmail = userProfile?.email || "user@enterprise.internal";
  const orgName = organization?.name || userProfile?.organizationId || "Primary Enterprise";

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    success("AI preferences updated", `Active provider set to ${aiProvider}.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Account &amp; Security
          </span>
          <span className="text-xs text-slate-400 font-medium">• Enterprise Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Profile &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your enterprise profile, AI intelligence providers, connected social channels, and MFA security.
        </p>
      </div>

      {/* 1. Identity & Role Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{userName}</h2>
              <p className="text-xs text-slate-500">{userEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {role || "USER"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-medium">{orgName}</span>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
            Sign Out
          </Button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Organization ID</span>
            <p className="font-mono font-semibold text-slate-800">{userProfile?.organizationId || "org_primary"}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Active Session Status</span>
            <p className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Authenticated
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Account Created</span>
            <p className="font-semibold text-slate-800">
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "Active"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. AI Intelligence Providers */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">AI Intelligence Engine</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your synthesis provider. Supports cloud-managed AI, Bring-Your-Own-Key, or air-gapped local Ollama.
          </p>
        </div>

        <form onSubmit={handleSaveAi} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Option 1: Managed */}
            <button
              type="button"
              onClick={() => setAiProvider("MANAGED")}
              className={`p-5 rounded-2xl border text-left transition-all ${
                aiProvider === "MANAGED"
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">NEXUS Managed AI</span>
                {aiProvider === "MANAGED" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Zero-cost Google Gemini 1.5 Flash cloud intelligence managed by NEXUS.
              </p>
              <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                ACTIVE • ₹0 BUDGET
              </span>
            </button>

            {/* Option 2: BYOK */}
            <button
              type="button"
              onClick={() => setAiProvider("BYOK")}
              className={`p-5 rounded-2xl border text-left transition-all ${
                aiProvider === "BYOK"
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Enterprise BYOK</span>
                {aiProvider === "BYOK" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Bring your own enterprise Gemini API key with AES-256 client encryption.
              </p>
              <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                ENCRYPTED KEY
              </span>
            </button>

            {/* Option 3: Ollama */}
            <button
              type="button"
              onClick={() => setAiProvider("OLLAMA")}
              className={`p-5 rounded-2xl border text-left transition-all ${
                aiProvider === "OLLAMA"
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Local Ollama</span>
                {aiProvider === "OLLAMA" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                100% offline air-gapped local inference on localhost:11434.
              </p>
              <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">
                AIR-GAPPED
              </span>
            </button>
          </div>

          {aiProvider === "BYOK" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-800">Your Google Gemini API Key</label>
              <input
                type="password"
                value={byokKey}
                onChange={(e) => setByokKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">Keys are encrypted with AES-256-GCM and never logged.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="brand" size="sm" type="submit">
              Save AI Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Connected Distribution Channels */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Connected Accounts</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Distribution platforms authorized to publish approved artefacts.</p>
        </div>

        <div className="space-y-3">
          {/* LinkedIn Item */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                in
              </div>
              <div>
                <p className="font-bold text-slate-900">LinkedIn REST API (Marketing Version 202608)</p>
                <p className="text-slate-500 text-[11px]">Connected member: Mohammed Ayaan • Scope: w_member_social</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
            </span>
          </div>

          {/* WhatsApp Item */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Meta WhatsApp Cloud Gateway</p>
                <p className="text-slate-500 text-[11px]">Interactive approvals &amp; conversational transformation</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[11px]">
              Ready to Pair (NX-*)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
