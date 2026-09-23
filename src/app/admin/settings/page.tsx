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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#2640D9]" />
              Platform Governance Settings
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              Global Policies
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure organization branding, multi-tenant access restrictions, security enforcements, and audit preferences.
          </p>
        </div>

        <Button
          onClick={handleSave}
          variant="primary"
          size="sm"
          isLoading={isSaving}
          className="bg-[#2640D9] hover:bg-blue-700 text-white shadow-2xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save Settings
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Organization Identity */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-[#2640D9]" />
            <h2 className="text-sm font-bold text-slate-900">Organization Identity &amp; Tenant Domain</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#2640D9] focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Workspace Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#2640D9] focus:bg-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-700">Allowed Single Sign-On (SSO) Domains</label>
              <input
                type="text"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#2640D9] focus:bg-white"
              />
              <p className="text-[11px] text-slate-500">Comma-separated email domains allowed to self-provision seats in this tenant.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Governance Enforcement */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Security Policies &amp; Compliance Enforcements</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-900">Enforce Multi-Factor Authentication (MFA)</p>
                <p className="text-[11px] text-slate-500">Requires all enterprise users to complete biometric or TOTP step-up.</p>
              </div>
              <input
                type="checkbox"
                checked={enforceMFA}
                onChange={(e) => setEnforceMFA(e.target.checked)}
                className="w-4 h-4 text-[#2640D9] rounded border-slate-300 focus:ring-[#2640D9]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-900">Mandatory Human Review Gate</p>
                <p className="text-[11px] text-slate-500">Every external broadcast to LinkedIn requires human signoff before dispatch.</p>
              </div>
              <input
                type="checkbox"
                checked={strictApproval}
                onChange={(e) => setStrictApproval(e.target.checked)}
                className="w-4 h-4 text-[#2640D9] rounded border-slate-300 focus:ring-[#2640D9]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Brand Layer & Compliance Disclaimers */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-[#2640D9]" />
            <h2 className="text-sm font-bold text-slate-900">Brand Voice &amp; Mandatory Disclaimers</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Enterprise Brand Voice Directive</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#2640D9] focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Mandatory Footer Disclaimer</label>
              <textarea
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#2640D9] focus:bg-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
