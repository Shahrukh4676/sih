"use client";

import React, { useState } from "react";
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
import { Organization } from "@/types";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-indigo-500" />
              Organization Tenants & Governance
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {orgs.length} Multi-Tenant Domains
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Isolate tenant workspaces, enforce brand voice guidelines, and manage compliance policies across organizations.
          </p>
        </div>

        <Button
          onClick={() => info("Create Organization", "Contact platform engineering for high-volume enterprise onboarding.")}
          variant="primary"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Tenant Domain
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant organizations..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrgs.map((org) => {
          return (
            <div
              key={org.id}
              onClick={() => handleOpenOrg(org)}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {org.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">/{org.slug}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      org.tier === "ENTERPRISE"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : org.tier === "PROFESSIONAL"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {org.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  <span className="font-semibold text-slate-300">Voice Tone:</span> {org.brandTone}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <strong className="text-slate-200">{org.members}</strong> members
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <strong className="text-slate-200">{org.contentCount}</strong> artefacts
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-400 transition-colors">
                  <span className="text-[11px]">Manage</span>
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
          <div className="space-y-6 text-xs text-slate-300">
            {/* Overview */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">Tier License</span>
                <span className="text-xs font-mono font-bold text-purple-400">{selectedOrg.tier}</span>
              </div>
              <p className="text-sm font-bold text-white">{selectedOrg.name}</p>
              <p className="text-slate-400 font-mono text-[11px]">Slug: {selectedOrg.slug}</p>
            </div>

            {/* Brand Voice Guidelines */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Brand Voice Policy
              </label>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Target Tone</p>
                  <p className="text-xs text-slate-200 mt-0.5">{selectedOrg.brandTone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Audience Persona</p>
                  <p className="text-xs text-slate-200 mt-0.5">{selectedOrg.targetAudience}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Restricted Phrases</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedOrg.bannedPhrases.map((phrase, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Mandatory Footer Disclaimer</p>
                  <p className="text-[11px] font-mono text-slate-400 italic mt-0.5 bg-slate-950 p-2 rounded border border-slate-800">
                    "{selectedOrg.disclaimer}"
                  </p>
                </div>
              </div>
            </div>

            {/* Security Enforcement */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Security & Approval Policies
              </label>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200">Enforce MFA for all members</p>
                    <p className="text-[10px] text-slate-500">Require TOTP or FIDO2 hardware keys</p>
                  </div>
                  <button
                    onClick={handleToggleMFA}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      selectedOrg.enforceMFA ? "bg-emerald-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedOrg.enforceMFA ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-200">Default Approval Policy</p>
                    <p className="text-[10px] text-slate-500">Human gate before publishing</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    STRICT_HITL
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-500"
                onClick={() => {
                  success("Saved", "Organization governance policies successfully synchronized.");
                  setSlideOverOpen(false);
                }}
              >
                Save Organization Settings
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
