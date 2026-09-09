"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Unlink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/Icons";
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

function SettingsContent() {
  const { userProfile, organization } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const connectedParam = searchParams.get("connected");

  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabParam === "INTEGRATIONS" || connectedParam === "true" ? "INTEGRATIONS" : "ACCOUNT"
  );
  const [saved, setSaved] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || userProfile?.email?.split("@")[0] || "User"
  );
  const [email, setEmail] = useState(
    userProfile?.email || "admin@nexus.ai"
  );
  const [orgName, setOrgName] = useState(
    organization?.name || userProfile?.organizationId || "Primary Organization"
  );
  const [brandTone, setBrandTone] = useState("Professional & Objective");
  const [brandAudience, setBrandAudience] = useState("Technical & Executive");
  const [mandatoryDisclaimers, setMandatoryDisclaimers] = useState(
    "NEXUS AI Verified Artefact. Generated under human-in-the-loop oversight."
  );

  // AI Configuration
  const [activeAiProvider, setActiveAiProvider] = useState("gemini");
  const [temperature, setTemperature] = useState("0.2");

  // Multi-User AI Provider state (Phase 13)
  const [aiProviderMode, setAiProviderMode] = useState<"NEXUS_DEFAULT" | "BYOK_GEMINI" | "LOCAL_OLLAMA">("NEXUS_DEFAULT");
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [byokApiKeyInput, setByokApiKeyInput] = useState("");
  const [byokMasked, setByokMasked] = useState<string | null>(null);
  const [byokConfigured, setByokConfigured] = useState(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2");
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaModelsList, setOllamaModelsList] = useState<string[]>([]);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingAiSettings, setSavingAiSettings] = useState(false);


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

  // Phase 8: LinkedIn Integration state
  const [linkedinData, setLinkedinData] = useState<{
    connected: boolean;
    status: string;
    member?: {
      id: string;
      urn: string;
      name: string;
      email?: string;
      avatar?: string;
    };
    connectedAt?: string;
    expiresAt?: string;
  } | null>(null);
  const [loadingLinkedin, setLoadingLinkedin] = useState(false);
  const [disconnectingLinkedin, setDisconnectingLinkedin] = useState(false);

  // X Integration State
  const [xData, setXData] = useState<{
    connected: boolean;
    status?: string;
    user?: { id: string; username: string; name: string; avatar?: string };
    scopes?: string[];
  } | null>(null);
  const [loadingX, setLoadingX] = useState(false);
  const [disconnectingX, setDisconnectingX] = useState(false);

  // Instagram Integration State
  const [instagramData, setInstagramData] = useState<{
    connected: boolean;
    status?: string;
    user?: { id: string; username: string; accountType?: string };
  } | null>(null);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [disconnectingInstagram, setDisconnectingInstagram] = useState(false);

  const orgId = organization?.id || userProfile?.organizationId || "org_primary";
  const userId = userProfile?.uid || "usr_admin_default";

  const fetchLinkedinStatus = useCallback(async () => {
    try {
      setLoadingLinkedin(true);
      const res = await fetch(
        `/api/integrations/linkedin/status?organizationId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      const data = await res.json();
      if (data.connected) {
        setLinkedinData(data);
      } else {
        setLinkedinData({ connected: false, status: data.status || "NOT_CONNECTED" });
      }
    } catch (err) {
      console.error("Error checking LinkedIn status:", err);
    } finally {
      setLoadingLinkedin(false);
    }
  }, [orgId, userId]);

  const fetchXStatus = useCallback(async () => {
    try {
      setLoadingX(true);
      const res = await fetch(
        `/api/integrations/x/status?organizationId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }
      );
      const data = await res.json();
      setXData(data);
    } catch (err) {
      console.error("Error checking X status:", err);
    } finally {
      setLoadingX(false);
    }
  }, [orgId, userId]);

  const fetchInstagramStatus = useCallback(async () => {
    try {
      setLoadingInstagram(true);
      const res = await fetch(
        `/api/integrations/instagram/status?organizationId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }
      );
      const data = await res.json();
      setInstagramData(data);
    } catch (err) {
      console.error("Error checking Instagram status:", err);
    } finally {
      setLoadingInstagram(false);
    }
  }, [orgId, userId]);

  const fetchAiProviderSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/providers?organizationId=${encodeURIComponent(orgId)}`);
      const data = await res.json();
      if (data.success && data.settings) {
        setAiProviderMode(data.settings.provider || "NEXUS_DEFAULT");
        setGeminiModel(data.settings.geminiModel || "gemini-1.5-flash");
        setByokConfigured(Boolean(data.settings.byokConfigured));
        setByokMasked(data.settings.byokKeyMasked || null);
        setOllamaBaseUrl(data.settings.ollamaBaseUrl || "http://localhost:11434");
        setOllamaModel(data.settings.ollamaModel || "llama3.2");
      }
      if (data.ollamaStatus) {
        setOllamaOnline(Boolean(data.ollamaStatus.running));
        setOllamaModelsList(data.ollamaStatus.models || []);
      }
    } catch (err) {
      console.error("Error fetching AI settings:", err);
    }
  }, [orgId]);

  useEffect(() => {
    if (tabParam === "INTEGRATIONS" || connectedParam === "true" || connectedParam === "x" || connectedParam === "instagram") {
      setActiveTab("INTEGRATIONS");
      fetchLinkedinStatus();
      fetchXStatus();
      fetchInstagramStatus();
    } else if (activeTab === "INTEGRATIONS") {
      fetchLinkedinStatus();
      fetchXStatus();
      fetchInstagramStatus();
    } else if (activeTab === "AI") {
      fetchAiProviderSettings();
    }
  }, [tabParam, connectedParam, activeTab, fetchLinkedinStatus, fetchXStatus, fetchInstagramStatus, fetchAiProviderSettings]);

  const handleTestAiConnection = async () => {
    try {
      setAiTesting(true);
      setAiTestResult(null);
      const res = await fetch("/api/ai/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          provider: aiProviderMode,
          byokApiKey: byokApiKeyInput || undefined,
          geminiModel,
          ollamaBaseUrl,
          ollamaModel,
        }),
      });
      const data = await res.json();
      if (data.success && data.result?.success) {
        setAiTestResult({
          success: true,
          message: `Connection successful (${data.result.latencyMs}ms) with ${data.result.provider} [${data.result.model}]`,
        });
      } else {
        setAiTestResult({
          success: false,
          message: data.result?.error || data.error || "Connection test failed",
        });
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setAiTestResult({ success: false, message: errorObj?.message || "Test failed" });
    } finally {
      setAiTesting(false);
    }
  };

  const handleSaveAiSettings = async () => {
    try {
      setSavingAiSettings(true);
      const res = await fetch("/api/ai/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          provider: aiProviderMode,
          byokApiKey: byokApiKeyInput || undefined,
          geminiModel,
          ollamaBaseUrl,
          ollamaModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setByokConfigured(Boolean(data.settings.byokConfigured));
        setByokMasked(data.settings.byokKeyMasked || null);
        setByokApiKeyInput("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save AI settings:", err);
    } finally {
      setSavingAiSettings(false);
    }
  };

  const handleDisconnectLinkedin = async () => {
    if (disconnectingLinkedin) return;
    try {
      setDisconnectingLinkedin(true);
      setLinkedinData({ connected: false, status: "NOT_CONNECTED" });
      const res = await fetch("/api/integrations/linkedin/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          organizationId: orgId,
          userId: userId,
        }),
      });
      if (res.ok) {
        await fetchLinkedinStatus();
      }
    } catch (err) {
      console.error("Failed to disconnect LinkedIn:", err);
    } finally {
      setDisconnectingLinkedin(false);
    }
  };

  const handleDisconnectX = async () => {
    if (disconnectingX) return;
    try {
      setDisconnectingX(true);
      setXData({ connected: false, status: "NOT_CONNECTED" });
      const res = await fetch("/api/integrations/x/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, userId }),
      });
      if (res.ok) await fetchXStatus();
    } catch (err) {
      console.error("Failed to disconnect X:", err);
    } finally {
      setDisconnectingX(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (disconnectingInstagram) return;
    try {
      setDisconnectingInstagram(true);
      setInstagramData({ connected: false, status: "NOT_CONNECTED" });
      const res = await fetch("/api/integrations/instagram/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, userId }),
      });
      if (res.ok) await fetchInstagramStatus();
    } catch (err) {
      console.error("Failed to disconnect Instagram:", err);
    } finally {
      setDisconnectingInstagram(false);
    }
  };

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
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Multi-User AI Provider Engine (Phase 13)
                      </CardTitle>
                      <p className="text-xs text-slate-500">
                        Choose between managed zero-cost cloud AI, your personal BYOK Google Gemini key, or offline local Ollama.
                      </p>
                    </div>
                    <Badge variant={aiProviderMode === "LOCAL_OLLAMA" ? "warning" : "verified"} size="sm">
                      {(aiProviderMode || "NEXUS DEFAULT").replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Provider Selection Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Card 1: Managed Gemini */}
                    <div
                      onClick={() => setAiProviderMode("NEXUS_DEFAULT")}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                        aiProviderMode === "NEXUS_DEFAULT"
                          ? "border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">NEXUS Managed Gemini</span>
                          {aiProviderMode === "NEXUS_DEFAULT" && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Cloud-hosted Gemini 1.5 Flash. Zero configuration, automated pipeline scaling.
                        </p>
                      </div>
                      <Badge variant="verified" size="sm">Zero Config</Badge>
                    </div>

                    {/* Card 2: BYOK Gemini */}
                    <div
                      onClick={() => setAiProviderMode("BYOK_GEMINI")}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                        aiProviderMode === "BYOK_GEMINI"
                          ? "border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">BYOK Gemini Key</span>
                          {aiProviderMode === "BYOK_GEMINI" && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Your Google AI Studio API Key. Encrypted at rest via AES-256-GCM.
                        </p>
                      </div>
                      <Badge variant={byokConfigured ? "verified" : "neutral"} size="sm">
                        {byokConfigured ? "Key Configured" : "Needs Key"}
                      </Badge>
                    </div>

                    {/* Card 3: Local Ollama */}
                    <div
                      onClick={() => setAiProviderMode("LOCAL_OLLAMA")}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                        aiProviderMode === "LOCAL_OLLAMA"
                          ? "border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Local Ollama (Offline)</span>
                          {aiProviderMode === "LOCAL_OLLAMA" && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          100% on-premise inference. Privacy-first, zero egress to external clouds.
                        </p>
                      </div>
                      <Badge variant={ollamaOnline ? "verified" : "neutral"} size="sm">
                        {ollamaOnline ? "Daemon Online" : "Daemon Offline"}
                      </Badge>
                    </div>
                  </div>

                  {/* BYOK Configuration Form */}
                  {aiProviderMode === "BYOK_GEMINI" && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800">
                          Google AI Studio API Key (AES-256-GCM Encrypted)
                        </span>
                        {byokMasked && (
                          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Active: {byokMasked}
                          </span>
                        )}
                      </div>
                      <Input
                        type="password"
                        placeholder={byokConfigured ? "Enter new key to rotate existing key" : "Paste AIzaSy... key from Google AI Studio"}
                        value={byokApiKeyInput}
                        onChange={(e) => setByokApiKeyInput(e.target.value)}
                        className="text-xs"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <Select
                          label="Target Gemini Model"
                          value={geminiModel}
                          onChange={(e) => setGeminiModel(e.target.value)}
                          options={[
                            { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Ultra-fast & free tier)" },
                            { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Deep complex analysis)" },
                            { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Experimental" },
                          ]}
                        />
                        <Select
                          label="Sampling Temperature"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          options={[
                            { value: "0.1", label: "0.1 (Strict Deterministic / Advisories)" },
                            { value: "0.2", label: "0.2 (Balanced Analytical - Recommended)" },
                            { value: "0.5", label: "0.5 (Creative / Social Posts)" },
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {/* Local Ollama Configuration Form */}
                  {aiProviderMode === "LOCAL_OLLAMA" && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800">Local Ollama Host Daemon</span>
                          <span className={`w-2 h-2 rounded-full ${ollamaOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="text-[11px] text-slate-500">{ollamaOnline ? "Daemon detected on port 11434" : "Daemon not detected"}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={fetchAiProviderSettings}
                          leftIcon={<RefreshCw className="w-3 h-3" />}
                        >
                          Scan Host
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Ollama Base URL"
                          value={ollamaBaseUrl}
                          onChange={(e) => setOllamaBaseUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="text-xs"
                        />
                        {ollamaModelsList.length > 0 ? (
                          <Select
                            label="Detected Model"
                            value={ollamaModel}
                            onChange={(e) => setOllamaModel(e.target.value)}
                            options={ollamaModelsList.map((m) => ({ value: m, label: m }))}
                          />
                        ) : (
                          <Input
                            label="Model Tag"
                            value={ollamaModel}
                            onChange={(e) => setOllamaModel(e.target.value)}
                            placeholder="llama3.2"
                            className="text-xs"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Managed Gemini Info Banner */}
                  {aiProviderMode === "NEXUS_DEFAULT" && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
                      <span className="font-semibold block">Managed Zero-Cost Cloud Pipeline:</span>
                      <p>
                        Using high-efficiency Google Gemini REST endpoints. If rate limits are encountered, requests transparently fall back to local offline Ollama models without breaking active publishing runs.
                      </p>
                    </div>
                  )}

                  {/* Test Feedback Banner */}
                  {aiTestResult && (
                    <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      aiTestResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}>
                      {aiTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                      <span>{aiTestResult.message}</span>
                    </div>
                  )}

                  {/* Bottom Action Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestAiConnection}
                      disabled={aiTesting}
                      leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${aiTesting ? "animate-spin" : ""}`} />}
                    >
                      {aiTesting ? "Testing Connection..." : "Test Connection"}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAiSettings}
                      disabled={savingAiSettings}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      {savingAiSettings ? "Saving Settings..." : "Save AI Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    External Connectors &amp; Webhooks
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Credentials are strictly stored server-side with AES-256-GCM encryption
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLinkedinStatus}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loadingLinkedin ? "animate-spin" : ""}`} />}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* LinkedIn OAuth 2.0 (Phase 8) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  linkedinData?.connected
                    ? "border-blue-300 bg-gradient-to-r from-blue-50/50 to-indigo-50/30"
                    : "border-slate-200 bg-slate-50/60"
                } flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0A66C2] flex items-center justify-center text-white shrink-0">
                        <LinkedInIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">LinkedIn Member Publishing</span>
                      {linkedinData?.connected ? (
                        <Badge variant="verified" size="sm" dot>
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {linkedinData?.connected && linkedinData.member ? (
                      <div className="text-[11px] text-slate-600 space-y-0.5 pl-8">
                        <div><span className="font-medium text-slate-800">Member:</span> {linkedinData.member.name}</div>
                        <div><span className="font-mono text-[10px] text-slate-500">{linkedinData.member.urn}</span></div>
                        <div className="text-slate-400">Permissions: <code>w_member_social</code>, <code>openid</code>, <code>profile</code></div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 pl-8">
                        Connect personal LinkedIn profile via 3-legged OAuth 2.0 to publish verified, human-approved posts.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchLinkedinStatus}
                      disabled={loadingLinkedin}
                      title="Sync status from server"
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingLinkedin ? "animate-spin" : ""}`} />
                    </Button>
                    {linkedinData?.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectLinkedin}
                        disabled={disconnectingLinkedin}
                        className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
                        leftIcon={<Unlink className="w-3.5 h-3.5" />}
                      >
                        {disconnectingLinkedin ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    ) : (
                      <a href={`/api/integrations/linkedin/connect?organizationId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(userId)}&returnUrl=${encodeURIComponent("/settings?tab=INTEGRATIONS&connected=true")}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                          leftIcon={<LinkedInIcon className="w-3.5 h-3.5" />}
                        >
                          Connect LinkedIn
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* X (Twitter) Integration (Phase 11) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white">
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">X (Twitter) v2 Integration</span>
                      {xData?.connected ? (
                        <Badge variant="verified" size="sm" dot>
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {xData?.connected && xData.user ? (
                      <div className="text-[11px] text-slate-600 space-y-0.5 pl-8">
                        <div><span className="font-medium text-slate-800">Account:</span> @{xData.user.username} ({xData.user.name})</div>
                        <div className="text-slate-400">Features: OAuth 2.0 PKCE, Thread auto-segmentation (&le;280 chars)</div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 pl-8">
                        Connect X account via OAuth 2.0 PKCE to broadcast verified threads and cryptographic updates.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchXStatus}
                      disabled={loadingX}
                      title="Sync status"
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingX ? "animate-spin" : ""}`} />
                    </Button>
                    {xData?.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectX}
                        disabled={disconnectingX}
                        className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
                        leftIcon={<Unlink className="w-3.5 h-3.5" />}
                      >
                        {disconnectingX ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    ) : (
                      <a href={`/api/integrations/x/connect?organizationId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(userId)}&returnUrl=${encodeURIComponent("/settings?tab=INTEGRATIONS&connected=x")}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-black hover:bg-slate-800 text-white"
                          leftIcon={<Share2 className="w-3.5 h-3.5" />}
                        >
                          Connect X
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Instagram Graph API Integration (Phase 11) */}
                <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white">
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Instagram Graph API v21.0</span>
                      {instagramData?.connected ? (
                        <Badge variant="verified" size="sm" dot>
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {instagramData?.connected && instagramData.user ? (
                      <div className="text-[11px] text-slate-600 space-y-0.5 pl-8">
                        <div><span className="font-medium text-slate-800">Account:</span> @{instagramData.user.username} ({instagramData.user.accountType})</div>
                        <div className="text-slate-400">Features: Media container upload, Caption formatting with hashtags</div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 pl-8">
                        Connect Instagram Business account via Graph API to publish media containers and visual infographics.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchInstagramStatus}
                      disabled={loadingInstagram}
                      title="Sync status"
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingInstagram ? "animate-spin" : ""}`} />
                    </Button>
                    {instagramData?.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectInstagram}
                        disabled={disconnectingInstagram}
                        className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
                        leftIcon={<Unlink className="w-3.5 h-3.5" />}
                      >
                        {disconnectingInstagram ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    ) : (
                      <a href={`/api/integrations/instagram/connect?organizationId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(userId)}&returnUrl=${encodeURIComponent("/settings?tab=INTEGRATIONS&connected=instagram")}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                          leftIcon={<Share2 className="w-3.5 h-3.5" />}
                        >
                          Connect Instagram
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

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

                {/* n8n Cloud Orchestration (Phase 7) */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-slate-900 text-sm">n8n Cloud Orchestration Workflow</span>
                      <Badge variant="verified" size="sm">Phase 7 Connected</Badge>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Workflow <code>uunidN8XWaIcA5xY</code> on <code>shahrukh24.app.n8n.cloud</code> coordinates multi-channel distribution.
                    </p>
                  </div>
                  <Link href="/automations">
                    <Button variant="outline" size="sm" className="shrink-0 text-purple-700 hover:bg-purple-100/50">
                      View Workflows
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>

                {[
                  { name: "Google Gemini REST API", status: "Active (Free Tier)", desc: "Configured via server environment" },
                  { name: "Local Ollama Provider", status: "Ready", desc: "Listens on localhost:11434 (llama3.2)" },
                  { name: "Cloud Firestore & Storage", status: "Connected", desc: "Multi-tenant project sih-5172e" },
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
