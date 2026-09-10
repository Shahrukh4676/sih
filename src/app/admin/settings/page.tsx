"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  ShieldCheck,
  Sparkles,
  Lock,
  Save,
  Key,
  Globe,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettingsPage() {
  const { userProfile, organization } = useAuth();
  const { success, info } = useToast();

  const [orgName, setOrgName] = useState(organization?.name || "Nexoura Enterprise HQ");
  const [slug, setSlug] = useState("nexoura-hq");
  const [allowedDomains, setAllowedDomains] = useState("nexoura.ai, enterprise.corp");
  const [enforceMFA, setEnforceMFA] = useState(true);
  const [strictApproval, setStrictApproval] = useState(true);
  const [tone, setTone] = useState("Authoritative, crisp, visionary, highly secure");
  const [disclaimer, setDisclaimer] = useState("Confidential • NEXUS AI Enterprise Security Verified");

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success("Settings Synchronized", "Enterprise platform settings and compliance policies updated.");
    }, 600);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-slate-400" />
              Enterprise Platform Governance Settings
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Global Policies
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Configure organization branding, multi-tenant access restrictions, security enforcements, and audit preferences.
          </p>
        </div>

        <Button
          onClick={handleSave}
          variant="primary"
          size="sm"
          isLoading={isSaving}
          className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 self-start md:self-auto"
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save All Changes
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Identity Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              Tenant Identity & Domain Isolation
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Organization name and allowed email domain whitelist for SSO and user seat invitations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Organization Legal Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Workspace Identifier / Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-slate-300 font-semibold">Allowed Corporate Email Domains (Comma Separated)</label>
              <input
                type="text"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Security Enforcements */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Security Posture & Approval Gates
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strict governance preventing unreviewed publishing and unverified model access.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <p className="font-semibold text-slate-200">Enforce Multi-Factor Authentication (MFA)</p>
                <p className="text-[11px] text-slate-500">Require all admins and creators to authenticate via TOTP or security keys.</p>
              </div>
              <button
                type="button"
                onClick={() => setEnforceMFA(!enforceMFA)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  enforceMFA ? "bg-emerald-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    enforceMFA ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <p className="font-semibold text-slate-200">Strict Human-in-the-Loop (HITL) Gate</p>
                <p className="text-[11px] text-slate-500">Require explicit cryptographic sign-off before publishing to external channels (LinkedIn 202608, X).</p>
              </div>
              <button
                type="button"
                onClick={() => setStrictApproval(!strictApproval)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  strictApproval ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    strictApproval ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Brand Voice Guidelines */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Corporate Brand Voice & Compliance Tone
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Guiding instructions injected into every AI transformation prompt to ensure consistent executive tone.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Executive Tone Directives</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Mandatory Compliance Disclaimer</label>
              <textarea
                rows={2}
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px] focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500">
                Automatically appended to generated advisories and technical release summaries.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
