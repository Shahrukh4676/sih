"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Sliders,
  Cpu,
  Bookmark,
  Share2,
  MessageSquare,
  Shield,
  Bell,
  Save,
  Check,
  Users,
  Plus,
  Lock,
  Workflow,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { MOCK_USER, MOCK_ORGANIZATION } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type SettingsTab =
  | "ACCOUNT"
  | "ORGANIZATION"
  | "MEMBERS"
  | "AI"
  | "BRAND"
  | "INTEGRATIONS"
  | "SECURITY";

export default function SettingsPage() {
  const { userProfile, organization } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("ACCOUNT");
  const [saved, setSaved] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || MOCK_USER.displayName
  );
  const [email, setEmail] = useState(
    userProfile?.email || MOCK_USER.email
  );
  const [orgName, setOrgName] = useState(
    organization?.name || MOCK_ORGANIZATION.name
  );
  const [brandTone, setBrandTone] = useState("Professional & Objective");
  const [brandAudience, setBrandAudience] = useState("Technical & Executive");
  const [mandatoryDisclaimers, setMandatoryDisclaimers] = useState(
    "NEXUS AI Verified Artefact. Generated under human-in-the-loop oversight."
  );

  // AI Configuration
  const [activeAiProvider, setActiveAiProvider] = useState("gemini");
  const [temperature, setTemperature] = useState("0.2");

  // Members Management
  const [members, setMembers] = useState([
    {
      id: "u1",
      name: userProfile?.displayName || "Lead Engineer",
      email: userProfile?.email || "admin@nexus.ai",
      role: userProfile?.role || "ADMIN",
      status: "ACTIVE",
      joined: "Sep 2026",
    },
    {
      id: "u2",
      name: "Security Reviewer",
      email: "reviewer@nexus.ai",
      role: "REVIEWER",
      status: "ACTIVE",
      joined: "Sep 2026",
    },
    {
      id: "u3",
      name: "Content Creator",
      email: "creator@nexus.ai",
      role: "CREATOR",
      status: "ACTIVE",
      joined: "Sep 2026",
    },
  ]);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CREATOR");

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: "ACCOUNT", label: "Account Profile", icon: <User className="w-4 h-4" /> },
    { id: "ORGANIZATION", label: "Organization Profile", icon: <Building2 className="w-4 h-4" /> },
    { id: "MEMBERS", label: "Team & RBAC", icon: <Users className="w-4 h-4" /> },
    { id: "AI", label: "AI Model Engine", icon: <Cpu className="w-4 h-4" /> },
    { id: "BRAND", label: "Brand Voice & Disclaimers", icon: <Bookmark className="w-4 h-4" /> },
    { id: "INTEGRATIONS", label: "Integrations & APIs", icon: <Share2 className="w-4 h-4" /> },
    { id: "SECURITY", label: "Security & MFA", icon: <Shield className="w-4 h-4" /> },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setMembers([
      ...members,
      {
        id: `u_${Date.now()}`,
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole as any,
        status: "ACTIVE",
        joined: "Just now",
      },
    ]);
    setInviteEmail("");
    setInviteModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Workspace Settings
            </span>
            <span className="text-xs text-slate-400">• Multi-Tenant Controls</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform &amp; Governance Settings
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Configure enterprise security policies, AI model parameters, brand voice rules, and team roles.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        >
          {saved ? "Saved Changes" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tab Navigation (3 cols) */}
        <div className="lg:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className={isActive ? "text-blue-600" : "text-slate-400"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Tab Workspace (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: ACCOUNT PROFILE */}
          {activeTab === "ACCOUNT" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Personal Account Profile
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Update your identity and authorization details
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    value={email}
                    disabled
                    helperText="Managed through Firebase Authentication"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Active User Role:
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Determines review and publication permissions
                    </span>
                  </div>
                  <Badge variant="brand" size="md">
                    {userProfile?.role || "ADMIN"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ORGANIZATION PROFILE */}
          {activeTab === "ORGANIZATION" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Organization &amp; Tenant Profile
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Multi-tenant isolation boundary identifier
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organization Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                  <Input
                    label="Tenant Identifier (organizationId)"
                    value={organization?.organizationId || userProfile?.organizationId || "org_primary"}
                    disabled
                    helperText="Enforced by Cloud Firestore Security Rules"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Subscription Plan
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Zero-cost hackathon architecture tier
                    </span>
                  </div>
                  <Badge variant="verified" size="md">
                    Enterprise Free Tier
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: TEAM & RBAC */}
          {activeTab === "MEMBERS" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Team Members &amp; RBAC Governance
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Roles: ADMIN (Org owner), CREATOR (Drafting), REVIEWER (Signoff), VIEWER (Read-only)
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => setInviteModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Invite Member
                </Button>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                      <th className="px-5 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          <div>{m.name}</div>
                          <div className="text-[11px] text-slate-400">{m.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="brand" size="sm">
                            {m.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="verified" size="sm" dot>
                            {m.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{m.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: AI CONFIGURATION */}
          {activeTab === "AI" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  AI Model Configuration (₹0 Free-First Architecture)
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Select between Google Gemini Free Tier REST API or Local Ollama
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Active AI Provider"
                    value={activeAiProvider}
                    onChange={(e) => setActiveAiProvider(e.target.value)}
                    options={[
                      { value: "gemini", label: "Google Gemini 2.5 Flash (Free Tier REST API)" },
                      { value: "ollama", label: "Local Ollama Fallback (http://localhost:11434)" },
                    ]}
                  />

                  <Select
                    label="Generation Temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    options={[
                      { value: "0.1", label: "0.1 (Strict Deterministic / Advisories)" },
                      { value: "0.2", label: "0.2 (Balanced Analytical - Recommended)" },
                      { value: "0.5", label: "0.5 (Creative / Social Posts)" },
                    ]}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
                  <span className="font-semibold block">Automatic Failover Engine:</span>
                  <p>
                    If the primary Google Gemini free tier hits quota limits or is unreachable, NEXUS AI automatically routes requests to your local Ollama instance (default model: <code>llama3.2</code>) without pipeline downtime.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: BRAND VOICE */}
          {activeTab === "BRAND" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Organization Brand Voice &amp; Governance
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Brand parameters injected into prompt synthesis for consistency
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Default Tone of Voice"
                    value={brandTone}
                    onChange={(e) => setBrandTone(e.target.value)}
                  />
                  <Input
                    label="Default Target Audience"
                    value={brandAudience}
                    onChange={(e) => setBrandAudience(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Mandatory Communication Disclaimer"
                  value={mandatoryDisclaimers}
                  onChange={(e) => setMandatoryDisclaimers(e.target.value)}
                  rows={3}
                  helperText="Appended automatically to generated advisories and corporate publications."
                />
              </CardContent>
            </Card>
          )}

          {/* TAB 6: INTEGRATIONS */}
          {activeTab === "INTEGRATIONS" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  External Connectors &amp; Webhooks
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Credentials are strictly stored server-side and never exposed in plain text
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Meta WhatsApp Business Cloud API (Phase 6) */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">Meta WhatsApp Business Cloud API</span>
                      <Badge variant="success" size="sm">Phase 6 Active</Badge>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Direct Graph API v21.0 integration for conversational commands, AI transformation &amp; approval workflows.
                    </p>
                  </div>
                  <Link href="/whatsapp">
                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                      Open Command Center
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>

                {[
                  { name: "Google Gemini REST API", status: "Active (Free Tier)", desc: "Configured via GEMINI_API_KEY environment variable" },
                  { name: "Local Ollama Provider", status: "Ready", desc: "Listens on localhost:11434" },
                  { name: "Cloud Firestore & Storage", status: "Connected", desc: "Multi-tenant project sih-5172e" },
                  { name: "n8n Workflow Webhooks", status: "Coming Soon (Phase 7)", desc: "Trigger external automation graphs" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* TAB 7: SECURITY */}
          {activeTab === "SECURITY" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Enterprise Security Configuration
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Multi-factor authentication and session safeguards
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Enforce Multi-Factor Authentication (MFA)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Mandatory hardware security key (FIDO2) or TOTP for all team members
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Automated Ingestion Quarantine
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Quarantine sources containing critical prompt injection signatures
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Team Member"
        description="Add a new user to your multi-tenant organization."
      >
        <div className="space-y-4">
          <Input
            label="Work Email Address"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Organization Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { value: "CREATOR", label: "CREATOR (Content drafting & generation)" },
              { value: "REVIEWER", label: "REVIEWER (Approval signoff & editing)" },
              { value: "ADMIN", label: "ADMIN (Full organization management)" },
              { value: "VIEWER", label: "VIEWER (Read-only access)" },
            ]}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInvite}
              disabled={!inviteEmail.trim()}
            >
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
