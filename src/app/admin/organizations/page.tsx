"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  Users,
  ShieldCheck,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

interface OrgData {
  id: string;
  name: string;
  slug: string;
  tier: "ENTERPRISE" | "PROFESSIONAL" | "STARTER";
  members: number;
  contentCount: number;
  enforceMFA: boolean;
  approvalPolicy: "STRICT_HUMAN_IN_THE_LOOP" | "AUTOMATED_HIGH_CONFIDENCE";
  brandTone: string;
  targetAudience: string;
  bannedPhrases: string[];
  disclaimer: string;
}

const initialOrgs: OrgData[] = [
  {
    id: "org_primary",
    name: "Nexoura HQ",
    slug: "nexoura-hq",
    tier: "ENTERPRISE",
    members: 24,
    contentCount: 382,
    enforceMFA: true,
    approvalPolicy: "STRICT_HUMAN_IN_THE_LOOP",
    brandTone: "Authoritative, visionary, highly secure",
    targetAudience: "Chief Information Security Officers, Enterprise IT Directors",
    bannedPhrases: ["cheap", "unverified", "guaranteed 100%"],
    disclaimer: "Confidential • NEXUS AI Enterprise Security Verified",
  },
  {
    id: "org_cyber_lab",
    name: "Cyber Intelligence Lab",
    slug: "cyber-intel-lab",
    tier: "ENTERPRISE",
    members: 14,
    contentCount: 215,
    enforceMFA: true,
    approvalPolicy: "STRICT_HUMAN_IN_THE_LOOP",
    brandTone: "Technical, rigorous, threat-focused",
    targetAudience: "SOC Analysts, Vulnerability Researchers, CERT Teams",
    bannedPhrases: ["probably safe", "minor issue"],
    disclaimer: "TLP:AMBER • Authorized Enterprise Dissemination Only",
  },
  {
    id: "org_fintech",
    name: "FinTech Global Advisory",
    slug: "fintech-global",
    tier: "PROFESSIONAL",
    members: 8,
    contentCount: 94,
    enforceMFA: true,
    approvalPolicy: "STRICT_HUMAN_IN_THE_LOOP",
    brandTone: "Analytical, regulatory compliant, crisp",
    targetAudience: "Institutional Investors, Compliance Officers",
    bannedPhrases: ["buy now", "to the moon"],
    disclaimer: "Not financial advice. Subject to regulatory disclosure.",
  },
  {
    id: "org_media_dyn",
    name: "Media Dynamics",
    slug: "media-dynamics",
    tier: "STARTER",
    members: 5,
    contentCount: 45,
    enforceMFA: false,
    approvalPolicy: "AUTOMATED_HIGH_CONFIDENCE",
    brandTone: "Engaging, conversational, fast-paced",
    targetAudience: "Digital creators, tech enthusiasts",
    bannedPhrases: ["spam", "click here"],
    disclaimer: "Produced with NEXUS AI Intelligence Platform",
  },
];

export default function AdminOrganizationsPage() {
  const { success, info } = useToast();
  const [orgs, setOrgs] = useState<OrgData[]>(initialOrgs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrgData | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.organizations && data.organizations.length > 0) {
          const mapped: OrgData[] = data.organizations.map((o: any) => ({
            id: o.id || o.organizationId,
            name: o.name,
            slug: o.slug || o.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            tier: (o.tier || "ENTERPRISE") as any,
            members: o.membersCount || 1,
            contentCount: o.contentCount || 0,
            enforceMFA: o.securitySettings?.mfaRequired ?? true,
            approvalPolicy: "STRICT_HUMAN_IN_THE_LOOP",
            brandTone: o.brandSettings?.tone || "Authoritative, visionary, highly secure",
            targetAudience: o.brandSettings?.targetAudience || "Enterprise Leaders & DevSecOps",
            bannedPhrases: o.brandSettings?.bannedPhrases || ["cheap", "unverified"],
            disclaimer: o.brandSettings?.mandatoryDisclaimers?.[0] || "Confidential • NEXUS AI Enterprise Security Verified",
          }));
          setOrgs(mapped);
        }
      })
      .catch((err) => console.error("Error loading organizations:", err));
  }, []);

  const filteredOrgs = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenOrg = (org: OrgData) => {
    setSelectedOrg(org);
    setSlideOverOpen(true);
  };

  const handleToggleMFA = () => {
    if (!selectedOrg) return;
    const newMFA = !selectedOrg.enforceMFA;
    setOrgs((prev) =>
      prev.map((o) => (o.id === selectedOrg.id ? { ...o, enforceMFA: newMFA } : o))
    );
    setSelectedOrg((prev) => (prev ? { ...prev, enforceMFA: newMFA } : null));
    success("Security Policy Updated", `MFA enforcement is now ${newMFA ? "MANDATORY" : "OPTIONAL"}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#2640D9]" />
              Organizations &amp; Tenants
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200">
              Multi-Tenant Isolation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enterprise boundary segmentation, brand governance, and isolated encryption boundaries across all client tenants.
          </p>
        </div>

        <Button
          onClick={() => info("Create Tenant", "Multi-tenant onboarding wizard initialized.")}
          variant="primary"
          size="sm"
          className="bg-[#2640D9] hover:bg-blue-700 text-white shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Provision Tenant
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations or slugs..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2640D9] focus:bg-white transition-colors"
          />
        </div>
        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          {filteredOrgs.length} active tenants
        </span>
      </div>

      {/* Organization Grid (Clean White Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrgs.map((org) => {
          return (
            <div
              key={org.id}
              onClick={() => handleOpenOrg(org)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2640D9] font-bold text-sm">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#2640D9] transition-colors">
                        {org.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">/{org.slug}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      org.tier === "ENTERPRISE"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : org.tier === "PROFESSIONAL"
                        ? "bg-blue-50 text-[#2640D9] border border-blue-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {org.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  <span className="font-semibold text-slate-800">Voice Tone:</span> {org.brandTone}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong className="text-slate-800">{org.members}</strong> members
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <strong className="text-slate-800">{org.contentCount}</strong> artefacts
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#2640D9] transition-colors">
                  <span className="text-[11px] font-semibold">Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organization SlideOver */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Organization Governance"
        subtitle={selectedOrg ? `${selectedOrg.name} (${selectedOrg.id})` : undefined}
      >
        {selectedOrg && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Overview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tier License</span>
                <span className="text-xs font-mono font-bold text-purple-700">{selectedOrg.tier}</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{selectedOrg.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">Slug: {selectedOrg.slug}</p>
            </div>

            {/* Brand Voice Guidelines */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2640D9]" />
                Brand Voice Policy
              </label>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Target Tone</p>
                  <p className="text-xs text-slate-900 mt-0.5">{selectedOrg.brandTone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Audience Persona</p>
                  <p className="text-xs text-slate-900 mt-0.5">{selectedOrg.targetAudience}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Restricted Phrases</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedOrg.bannedPhrases.map((phrase, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono font-semibold">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Mandatory Footer Disclaimer</p>
                  <p className="text-[11px] font-mono text-slate-600 italic mt-0.5 bg-white p-2 rounded border border-slate-200">
                    "{selectedOrg.disclaimer}"
                  </p>
                </div>
              </div>
            </div>

            {/* Security Enforcement */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Security &amp; Approval Policies
              </label>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Enforce Multi-Factor Auth (MFA)</p>
                    <p className="text-[11px] text-slate-500">Mandatory biometric / TOTP token for all members</p>
                  </div>
                  <button
                    onClick={handleToggleMFA}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedOrg.enforceMFA
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300"
                    }`}
                  >
                    {selectedOrg.enforceMFA ? "Enforced" : "Optional"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Publishing Review Policy</p>
                    <p className="text-[11px] text-slate-500">Human compliance signoff before social distribution</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#2640D9] border border-blue-200">
                    STRICT
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
