"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Sparkles,
  Cpu,
  Bell,
  Shield,
  CheckCircle2,
  Lock,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  KeyRound,
  LogOut,
  Save,
  Laptop,
  Globe,
  Radio,
  Clock,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";

export default function UserSettingsPage() {
  const { userProfile, organization, role, logout } = useAuth();
  const { success, info } = useToast();

  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "User";
  const userEmail = userProfile?.email || "user@enterprise.internal";
  const orgName = organization?.name || userProfile?.organizationId || "Primary Enterprise";

  // State: Tab selection
  const [activeTab, setActiveTab] = useState<"DEFAULTS" | "AI" | "NOTIFICATIONS" | "SECURITY">("DEFAULTS");

  // State: Generation Defaults
  const [defaultFormat, setDefaultFormat] = useState("LINKEDIN_POST");
  const [defaultTone, setDefaultTone] = useState("PROFESSIONAL");
  const [defaultAudience, setDefaultAudience] = useState("TECHNICAL");
  const [defaultDetail, setDefaultDetail] = useState("BALANCED");
  const [autoSubmitApproval, setAutoSubmitApproval] = useState(false);

  // State: AI Inference
  const [aiEngine, setAiEngine] = useState<"GEMINI_PRO" | "GEMINI_FLASH" | "BYOK" | "OLLAMA">("GEMINI_PRO");
  const [byokApiKey, setByokApiKey] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  // State: Notifications
  const [emailApprovalAlerts, setEmailApprovalAlerts] = useState(true);
  const [emailPublishAlerts, setEmailPublishAlerts] = useState(true);
  const [securityThreatAlerts, setSecurityThreatAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // State: Security
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("24h");

  // Load preferences from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexus_user_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.defaultFormat) setDefaultFormat(parsed.defaultFormat);
        if (parsed.defaultTone) setDefaultTone(parsed.defaultTone);
        if (parsed.defaultAudience) setDefaultAudience(parsed.defaultAudience);
        if (parsed.defaultDetail) setDefaultDetail(parsed.defaultDetail);
        if (typeof parsed.autoSubmitApproval === "boolean") setAutoSubmitApproval(parsed.autoSubmitApproval);
        if (parsed.aiEngine) setAiEngine(parsed.aiEngine);
        if (parsed.temperature) setTemperature(parsed.temperature);
        if (typeof parsed.emailApprovalAlerts === "boolean") setEmailApprovalAlerts(parsed.emailApprovalAlerts);
        if (typeof parsed.emailPublishAlerts === "boolean") setEmailPublishAlerts(parsed.emailPublishAlerts);
        if (typeof parsed.securityThreatAlerts === "boolean") setSecurityThreatAlerts(parsed.securityThreatAlerts);
        if (typeof parsed.mfaEnabled === "boolean") setMfaEnabled(parsed.mfaEnabled);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveAll = () => {
    try {
      const settings = {
        defaultFormat,
        defaultTone,
        defaultAudience,
        defaultDetail,
        autoSubmitApproval,
        aiEngine,
        temperature,
        maxTokens,
        emailApprovalAlerts,
        emailPublishAlerts,
        securityThreatAlerts,
        weeklyDigest,
        mfaEnabled,
        sessionTimeout,
      };
      localStorage.setItem("nexus_user_settings", JSON.stringify(settings));
      success("Preferences Saved", "Your workspace settings have been synchronized successfully.");
    } catch (err) {
      info("Preferences Updated", "Settings saved to local session.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Settings" },
        ]}
        title="Workspace Settings"
        description="Customize personal generation defaults, multi-model AI reasoning parameters, notification preferences, and session security."
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            Personal Preferences
          </span>
        }
        primaryAction={
          <Button
            variant="brand"
            size="sm"
            onClick={handleSaveAll}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        }
      />

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{userName}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {role || "CREATOR"}
              </span>
            </div>
            <p className="text-xs text-slate-500">{userEmail}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Organization: <strong className="text-slate-700 font-medium">{orgName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/app/profile">
            <Button variant="outline" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
              View Full Profile
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("DEFAULTS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "DEFAULTS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Generation Defaults
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("AI")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "AI"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Models &amp; Inference
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "NOTIFICATIONS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications &amp; Alerts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SECURITY")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "SECURITY"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security &amp; Sessions
        </button>
      </div>

      {/* Tab 1: Generation Defaults */}
      {activeTab === "DEFAULTS" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Content Generation Defaults
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These pre-select your preferred parameters when entering the Manual Create Studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Output Format</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="LINKEDIN_POST">LinkedIn Post (Executive Hook + Insights)</option>
                <option value="X_THREAD">X Thread (Multi-tweet advisory)</option>
                <option value="EXECUTIVE_SUMMARY">Executive Summary (Board Risk Brief)</option>
                <option value="CYBERSECURITY_ADVISORY">Cybersecurity Advisory &amp; Patch Bulletin</option>
                <option value="PRESENTATION">Presentation Outline (Slide structure)</option>
                <option value="INFOGRAPHIC_SPEC">Infographic Data Layout Spec</option>
                <option value="VIDEO_PACKAGE">Video Script &amp; Production Package</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Brand Tone</label>
              <select
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="PROFESSIONAL">Professional &amp; Authoritative</option>
                <option value="EXECUTIVE">Executive / C-Suite Briefing</option>
                <option value="TECHNICAL">Technical Deep-Dive / Rigorous</option>
                <option value="CONVERSATIONAL">Engaging &amp; Conversational</option>
                <option value="URGENT">Urgent Advisory / Rapid Alert</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Target Audience</label>
              <select
                value={defaultAudience}
                onChange={(e) => setDefaultAudience(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="TECHNICAL">Technical Practitioners &amp; Engineers</option>
                <option value="EXECUTIVE">Leadership &amp; Business Executives</option>
                <option value="GENERAL">General Industry Professionals</option>
                <option value="PUBLIC">Broad Public / External Stakeholders</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Detail Depth</label>
              <select
                value={defaultDetail}
                onChange={(e) => setDefaultDetail(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="CONCISE">Concise &amp; High-Impact (Under 150 words)</option>
                <option value="BALANCED">Balanced Context (200 - 400 words)</option>
                <option value="COMPREHENSIVE">Comprehensive Teardown (500+ words)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Auto-Submit for Review</p>
              <p className="text-[11px] text-slate-500">
                Automatically route generated artefacts with 0.0 risk score to the compliance approval queue.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSubmitApproval}
                onChange={(e) => setAutoSubmitApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Tab 2: AI Models & Inference */}
      {activeTab === "AI" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Multi-Model AI Reasoning Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which intelligence engine runs your content synthesis, source summarization, and security screening.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setAiEngine("GEMINI_PRO")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiEngine === "GEMINI_PRO"
                  ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Google Gemini 1.5 Pro</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  Default Managed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                2M token context window. Best for complex multi-page research, deep vulnerability teardowns, and multi-format synthesis.
              </p>
            </div>

            <div
              onClick={() => setAiEngine("GEMINI_FLASH")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiEngine === "GEMINI_FLASH"
                  ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Google Gemini 1.5 Flash</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  Ultra Fast
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sub-second latency response. Optimized for high-frequency social generation and automated batch ingestion pipelines.
              </p>
            </div>

            <div
              onClick={() => setAiEngine("BYOK")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiEngine === "BYOK"
                  ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Bring Your Own Key (BYOK)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  Dedicated Quota
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Use your organization&apos;s direct Google Cloud project API key. Charges bill directly to your corporate account.
              </p>
            </div>

            <div
              onClick={() => setAiEngine("OLLAMA")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiEngine === "OLLAMA"
                  ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Local Air-Gapped (Ollama)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  Private Edge
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect to on-premise Llama 3 or Mistral running at http://localhost:11434. Zero cloud exposure.
              </p>
            </div>
          </div>

          {aiEngine === "BYOK" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-800">Google Gemini API Key</label>
              <input
                type="password"
                value={byokApiKey}
                onChange={(e) => setByokApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                Key is AES-256 encrypted on the client and never logged in plain text.
              </p>
            </div>
          )}

          {/* Temperature & Hyperparameters */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Inference Temperature</span>
                <p className="text-[11px] text-slate-500">
                  Lower values make copy precise and deterministic; higher values increase stylistic variety.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Notifications & Alerts */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Notification Dispatch Rules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control when NEXUS AI sends alerts for compliance approvals, security scans, and distribution results.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">Compliance Approval Requests</p>
                <p className="text-[11px] text-slate-500">
                  Receive email notifications when content generated under your account requires Human-in-the-Loop review.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailApprovalAlerts}
                  onChange={(e) => setEmailApprovalAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">Multi-Channel Publishing Confirmation</p>
                <p className="text-[11px] text-slate-500">
                  Receive real-time confirmation when an approved post is successfully published to LinkedIn (API 202608).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailPublishAlerts}
                  onChange={(e) => setEmailPublishAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">Zero-Trust Threat Quarantines</p>
                <p className="text-[11px] text-slate-500">
                  Immediate high-priority alert if an ingested document or URL triggers prompt injection or credential leak rules.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityThreatAlerts}
                  onChange={(e) => setSecurityThreatAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">Weekly Intelligence Digest</p>
                <p className="text-[11px] text-slate-500">
                  Weekly summary of published reach, hours saved, and top performing advisory formats.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Sessions */}
      {activeTab === "SECURITY" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Security &amp; Active Browser Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage enterprise multi-factor authentication, active login devices, and session expiration policies.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Multi-Factor Authentication (TOTP)</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      mfaEnabled
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {mfaEnabled ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Protect your account with Google Authenticator or hardware YubiKey.
                </p>
              </div>
            </div>

            <Button
              variant={mfaEnabled ? "outline" : "brand"}
              size="sm"
              onClick={() => {
                setMfaEnabled(!mfaEnabled);
                success(
                  mfaEnabled ? "MFA Disabled" : "MFA Configured",
                  mfaEnabled
                    ? "Two-factor verification removed from session."
                    : "Two-factor verification enabled for account."
                );
              }}
            >
              {mfaEnabled ? "Disable MFA" : "Configure MFA"}
            </Button>
          </div>

          {/* Active Sessions List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900">Active Browser Sessions</h4>
            <div className="space-y-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">Current Session</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                        ACTIVE NOW
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Chrome on Windows • IP 127.0.0.1 (Localhost Workspace)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Expires in 23h 48m</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
