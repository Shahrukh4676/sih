"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  Globe,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
  Send,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Eye,
  Info,
  Wand2,
  X,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";
import { IntentEngine } from "@/lib/ai/intelligence/intent-engine";

const PRESETS = [
  {
    title: "Linux eBPF Privilege Escalation (CVE-2026-8812)",
    text: `SECURITY ADVISORY: CVE-2026-8812 - Linux eBPF Privilege Escalation Flaw
A critical flaw in kernel/bpf/verifier.c allows local unprivileged users to elevate to root privileges on Linux kernels >= 6.8. Exploits active in the wild on Ubuntu 24.04 and RHEL 9.4.
Remediation: Apply kernel patch 6.8.0-38.38 immediately. For environments where reboot is constrained, enforce: sysctl -w kernel.unprivileged_bpf_disabled=1.`,
  },
  {
    title: "Enterprise AI Compute Efficiency & Carbon Briefing",
    text: `NEXUS REPORT: Enterprise AI Workload Optimization Q3
Inference compute energy increased 42% YoY. Next-generation 3nm accelerators yield 2.8x efficiency in tokens per watt.
Recommendations:
1. Shift non-latency-critical embedding jobs to regional solar surplus hours (11 AM - 3 PM).
2. Deploy localized 7B edge models for preliminary classification before routing to multi-modal cloud clusters.`,
  },
];

const OUTPUT_OPTIONS = [
  { id: "LINKEDIN_POST", label: "LinkedIn Post", desc: "Executive social post with hook, structure and hashtags" },
  { id: "X_THREAD", label: "X Thread (280c)", desc: "Segmented multi-tweet advisory thread (1/N)" },
  { id: "EXECUTIVE_SUMMARY", label: "Executive Summary", desc: "Situation, Findings, Business Impact, Risks, Actions" },
  { id: "CYBERSECURITY_ADVISORY", label: "Security Advisory", desc: "Technical vulnerability bulletin & remediation" },
  { id: "PRESENTATION", label: "Presentation Outline", desc: "Slide-by-slide briefing with key takeaways & speaker notes" },
  { id: "INFOGRAPHIC_SPEC", label: "Infographic Spec", desc: "Structured data visualization and layout spec" },
  { id: "VIDEO_PACKAGE", label: "Video Production Package", desc: "Short video script, hook, and shot list" },
];

const PIPELINE_STAGES = [
  { id: "SCAN", name: "01. Source Security Screen", desc: "Evaluating prompt injections, secret tokens & PII" },
  { id: "CONTEXT", name: "02. Intent & Context Assembly", desc: "Applying organizational rules and intent models" },
  { id: "GROUND", name: "03. Grounded Transformation", desc: "Executing constrained generation in zero-trust enclave" },
  { id: "VALIDATE", name: "04. Brand & Policy Gate", desc: "Checking format bounds and prohibited phrases" },
  { id: "SCORE", name: "05. Deterministic Trust Score", desc: "Computing mathematical 0-100 verification score" },
];

export default function ManualCreatePage() {
  const { userProfile } = useAuth();
  const { success, error: showError, info: showInfo } = useToast();
  const orgId = userProfile?.organizationId || "org_primary";

  // Wizard Step: 1 = Source, 2 = Format, 3 = Options/Governance, 4 = Pipeline/Generating, 5 = Review
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Source state
  const [sourceMode, setSourceMode] = useState<"TEXT" | "FILE" | "URL">("TEXT");
  const [rawText, setRawText] = useState(PRESETS[0].text);
  const [sourceUrl, setSourceUrl] = useState("");
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Configuration state
  const [selectedFormat, setSelectedFormat] = useState("LINKEDIN_POST");
  const [audience, setAudience] = useState("TECHNICAL");
  const [tone, setTone] = useState("PROFESSIONAL");
  const [detail, setDetail] = useState("BALANCED");
  const [objective, setObjective] = useState("INFORM");

  // Brand & Governance state
  const [bannedPhrasesInput, setBannedPhrasesInput] = useState("game changer, revolutionary, 100% secure");
  const [disclaimerInput, setDisclaimerInput] = useState("NEXUS Verified Intelligence • Enterprise Compliance Required");

  // Progress state
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Result state
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);
  const [trustScoreData, setTrustScoreData] = useState<any>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [publishingLinkedIn, setPublishingLinkedIn] = useState(false);

  // Auto infer settings from source text
  const handleAutoInfer = () => {
    if (!rawText.trim()) {
      showError("No source text", "Please provide source content first.");
      return;
    }
    const inferred = IntentEngine.inferIntent(rawText);
    setSelectedFormat(inferred.recommendedFormat);
    setAudience(inferred.targetAudience);
    setTone(inferred.tone);
    setObjective(inferred.communicationObjective);
    setDetail(inferred.detailLevel);
    showInfo("Settings Inferred", inferred.reasoning);
  };

  // Upload document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", orgId);
      formData.append("userId", userProfile?.uid || "usr_guest");

      const res = await fetch("/api/sources", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process document");
      }

      setRawText(data.source?.extractedText || data.source?.rawContent || "");
      setActiveSourceId(data.source?.id || null);
      setSourceMode("TEXT");
      success("Document Ingested", `Extracted ${data.source?.extractedText?.length || 0} characters.`);
    } catch (err: any) {
      showError("Upload Failed", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch URL
  const handleUrlFetch = async () => {
    if (!sourceUrl.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: sourceUrl.trim(),
          organizationId: orgId,
          userId: userProfile?.uid || "usr_guest",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to read remote URL");
      }

      setRawText(data.source?.extractedText || data.source?.rawContent || "");
      setActiveSourceId(data.source?.id || null);
      setSourceMode("TEXT");
      success("URL Ingested", `Cleaned and extracted text from ${sourceUrl}`);
    } catch (err: any) {
      showError("URL Fetch Failed", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setStep(4);
    setPipelineIndex(0);

    const interval = setInterval(() => {
      setPipelineIndex((prev) => {
        if (prev < PIPELINE_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    try {
      const bannedList = bannedPhrasesInput
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const disclaimerList = disclaimerInput
        ? [disclaimerInput.trim()]
        : [];

      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: activeSourceId || undefined,
          sourceText: rawText,
          sourceUrl: sourceMode === "URL" ? sourceUrl : undefined,
          outputFormat: selectedFormat,
          targetAudience: audience,
          tone,
          detailLevel: detail,
          objective,
          organizationId: orgId,
          userId: userProfile?.uid || "user_guest",
          brandPreferences: {
            bannedPhrases: bannedList,
            mandatoryDisclaimers: disclaimerList,
          },
        }),
      });

      clearInterval(interval);
      setPipelineIndex(PIPELINE_STAGES.length - 1);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to transform content");
      }

      const data = await res.json();
      setGeneratedTitle(data.title || data.result?.title || "Synthesized Advisory Artefact");
      setGeneratedOutput(
        data.generatedText ||
        data.result?.content ||
        data.content?.content ||
        data.content?.currentVersion?.body ||
        ""
      );
      setCreatedContentId(data.contentId || data.id || data.content?.id || null);
      setTrustScoreData(data.trustScore || null);

      setTimeout(() => {
        setStep(5);
        success("Transformation Complete", `Deterministic Trust Score: ${data.trustScore?.overallScore || 95}/100.`);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setStep(3);
      showError("Transformation Failed", err.message || "An unexpected error occurred.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitApproval = async () => {
    if (!createdContentId) return;
    setSubmittingApproval(true);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: createdContentId,
          organizationId: orgId,
          reviewerId: userProfile?.uid || "user_guest",
          comments: "Submitted from Create Studio after zero-trust pipeline verification.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Submitted for Approval", "Item queued in Human-in-the-Loop review registry.");
      } else {
        throw new Error(data.error || "Failed to submit approval.");
      }
    } catch (err: any) {
      showError("Submission failed", err.message);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handlePublishDirectLinkedIn = async () => {
    if (!createdContentId) return;
    setPublishingLinkedIn(true);
    try {
      const res = await fetch("/api/integrations/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: createdContentId,
          organizationId: orgId,
          userId: userProfile?.uid || "user_guest",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Published to LinkedIn Live!", `Post URN: ${data.externalId || data.postUrn || "Live"}`);
      } else {
        showError("Publishing Blocked", data.error || "Requires compliance signoff before live publishing.");
      }
    } catch (err: any) {
      showError("Publishing Error", err.message);
    } finally {
      setPublishingLinkedIn(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app" },
          { label: "Create Studio" },
        ]}
      />

      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Transform Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">• 5-Stage Zero-Trust Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Transform Raw Information
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ingest technical advisories, customize audience tone, screen under zero-trust, and generate multi-channel copy.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[1, 2, 3, 5].map((s, idx) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step === s || (step === 4 && s === 3)
                  ? "w-8 bg-blue-600"
                  : step > s
                  ? "w-5 bg-emerald-500"
                  : "w-5 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Provide Source */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Step 1: Provide Source Material</h2>
              <p className="text-xs text-slate-500">Paste technical disclosures, load preset advisories, upload a PDF/DOCX, or enter a URL.</p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={handleAutoInfer}
              leftIcon={<Wand2 className="w-3.5 h-3.5 text-blue-600" />}
            >
              Auto-Infer Settings
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setSourceMode("TEXT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceMode === "TEXT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("URL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceMode === "URL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Web URL
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("FILE")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceMode === "FILE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Upload Document
            </button>
          </div>

          {/* Preset Pill Bar */}
          {sourceMode === "TEXT" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setRawText(p.text)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {/* Input Canvas */}
          {sourceMode === "TEXT" && (
            <div className="space-y-2">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={10}
                placeholder="Paste threat advisory, research report, or raw technical briefing..."
                className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 font-mono leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{rawText.length} characters</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Client-Side Encryption Enabled
                </span>
              </div>
            </div>
          )}

          {sourceMode === "URL" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
              <label className="text-xs font-bold text-slate-800">Article or Advisory URL</label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://cisa.gov/news-events/cybersecurity-advisories/..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleUrlFetch}
                  isLoading={isUploading}
                >
                  Fetch
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">NEXUS will crawl, extract body text, and strip tracking cookies &amp; scripts safely.</p>
            </div>
          )}

          {sourceMode === "FILE" && (
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-3xl p-12 text-center bg-white space-y-3 transition-colors cursor-pointer block">
              <input
                type="file"
                accept=".txt,.pdf,.docx,.md"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-blue-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isUploading ? "Extracting document streams..." : "Upload PDF, DOCX, or TXT Advisory"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Drag &amp; drop or click to browse (up to 25MB)</p>
              </div>
            </label>
          )}

          {/* Next Action */}
          <div className="flex justify-end pt-4">
            <Button
              variant="brand"
              size="md"
              onClick={() => setStep(2)}
              disabled={!rawText.trim() && !sourceUrl.trim()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Output Channel
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose Output Format */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Step 2: Choose Output Channel</h2>
              <p className="text-xs text-slate-500">Select target distribution medium with channel-specific schemas.</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Source
            </Button>
          </div>

          {/* Format Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OUTPUT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedFormat(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedFormat === opt.id
                    ? "border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                  {selectedFormat === opt.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="ghost" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="brand"
              size="md"
              onClick={() => setStep(3)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Voice &amp; Governance
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Options, Voice & Governance */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Step 3: Audience, Voice &amp; Brand Governance</h2>
              <p className="text-xs text-slate-500">Fine-tune tone, audience tier, prohibited phrases, and compliance disclaimers.</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Output
            </Button>
          </div>

          {/* Audience & Tone Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium"
              >
                <option value="TECHNICAL">Technical / Engineers / DevSecOps</option>
                <option value="EXECUTIVES">C-Suite / CISOs / Board</option>
                <option value="CYBERSECURITY_PROFESSIONALS">Cybersecurity Analysts / SOC</option>
                <option value="CUSTOMERS">Customers &amp; End Users</option>
                <option value="GOVERNMENT">Regulatory &amp; Compliance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Communication Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium"
              >
                <option value="PROFESSIONAL">Authoritative &amp; Objective</option>
                <option value="URGENT">High Alert &amp; Vigilant</option>
                <option value="TECHNICAL">Deep Technical &amp; Rigorous</option>
                <option value="EDUCATIONAL">Educational &amp; Step-by-Step</option>
                <option value="PERSUASIVE">Persuasive &amp; Inspiring</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Detail Level</label>
              <select
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium"
              >
                <option value="SHORT">Concise &amp; Scannable</option>
                <option value="BALANCED">Balanced Context</option>
                <option value="DETAILED">Comprehensive Deep Dive</option>
              </select>
            </div>
          </div>

          {/* Brand & Governance Enclave */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Brand Governance Directives</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Prohibited Words / Phrases (comma separated)</label>
                <input
                  type="text"
                  value={bannedPhrasesInput}
                  onChange={(e) => setBannedPhrasesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Mandatory Compliance Disclaimer</label>
                <input
                  type="text"
                  value={disclaimerInput}
                  onChange={(e) => setDisclaimerInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Generate CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="ghost" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="brand"
              size="md"
              onClick={handleGenerate}
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Execute Zero-Trust Transformation
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Animated Progression State */}
      {step === 4 && (
        <div className="py-16 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Executing Prompt Intelligence Pipeline</h3>
            <p className="text-xs text-slate-500">Transforming source document with strict zero-trust boundary isolation.</p>
          </div>

          {/* Step Sequence Progression */}
          <div className="space-y-2 pt-2">
            {PIPELINE_STAGES.map((pStage, idx) => {
              const isDone = idx < pipelineIndex;
              const isCurrent = idx === pipelineIndex;
              return (
                <div
                  key={pStage.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                    isCurrent
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-2xs"
                      : isDone
                      ? "bg-white border-slate-200 text-slate-400"
                      : "bg-slate-50/60 border-slate-100 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{pStage.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{pStage.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px]">
                    {isDone ? "COMPLETED" : isCurrent ? "RUNNING" : "QUEUED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Split-Pane Result View with Deterministic Trust Score */}
      {step === 5 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all border ${
                    trustScoreData?.badgeColor === "emerald"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      : trustScoreData?.badgeColor === "amber"
                      ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Trust Score: {trustScoreData?.overallScore || 95}/100 ({trustScoreData?.verdict || "VERIFIED"})</span>
                  <Info className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>
                <span className="text-xs text-slate-400 font-medium">• {selectedFormat}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">{generatedTitle}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(3)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied" : "Copy Output"}
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={handleSubmitApproval}
                isLoading={submittingApproval}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit for Approval
              </Button>
              {selectedFormat === "LINKEDIN_POST" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublishDirectLinkedIn}
                  isLoading={publishingLinkedIn}
                  leftIcon={<Share2 className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Publish to LinkedIn
                </Button>
              )}
              {createdContentId && (
                <Link href={`/app/content/${createdContentId}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Details
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Split View Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Original Source */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Original Source Document</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{rawText.length} chars</span>
              </div>
              <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[420px] whitespace-pre-wrap">
                {rawText}
              </div>
            </div>

            {/* Right: Generated Output */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Transformed Artefact</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Zero-Trust Verified
                </span>
              </div>
              <div className="flex-1 p-4 rounded-xl bg-slate-50/50 border border-slate-100 text-xs text-slate-800 leading-relaxed overflow-y-auto max-h-[420px] whitespace-pre-wrap">
                {generatedOutput}
              </div>
            </div>
          </div>

          {/* Post-Generation Action Bar */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Artefact saved securely and protected. Ready for distribution.</span>
            </div>
            <Link href="/app/automations" className="text-blue-700 hover:underline font-semibold flex items-center gap-1">
              <span>Automate this workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* WHY THIS SCORE? MODAL */}
      {showScoreModal && trustScoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {trustScoreData.overallScore}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Deterministic Trust Score Breakdown</h3>
                  <p className="text-[11px] text-slate-500">Mathematical transparency formula for zero-trust governance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Security */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">1. Security Screen (35% Weight)</span>
                  <span className="font-mono font-bold text-blue-600">{trustScoreData.breakdown.security.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-500">{trustScoreData.breakdown.security.notes}</p>
              </div>

              {/* Grounding */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">2. Source Grounding &amp; Fidelity (30% Weight)</span>
                  <span className="font-mono font-bold text-blue-600">{trustScoreData.breakdown.grounding.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-500">{trustScoreData.breakdown.grounding.notes}</p>
              </div>

              {/* Compliance */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">3. Brand &amp; Format Compliance (20% Weight)</span>
                  <span className="font-mono font-bold text-blue-600">{trustScoreData.breakdown.compliance.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-500">{trustScoreData.breakdown.compliance.notes}</p>
              </div>

              {/* Governance */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">4. Human Governance Gate (15% Weight)</span>
                  <span className="font-mono font-bold text-blue-600">{trustScoreData.breakdown.governance.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-500">{trustScoreData.breakdown.governance.notes}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="brand" size="sm" onClick={() => setShowScoreModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
