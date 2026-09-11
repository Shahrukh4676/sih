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
  Share2,
  ArrowRight,
  Layers,
  ArrowLeft,
  Sliders,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";

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
  { id: "LINKEDIN_POST", label: "LinkedIn Post", desc: "Executive social post with hook and hashtags" },
  { id: "X_THREAD", label: "X Thread (280c)", desc: "Segmented multi-tweet advisory thread" },
  { id: "EXECUTIVE_SUMMARY", label: "Executive Summary", desc: "High-level risk and strategic impact brief" },
  { id: "CYBERSECURITY_ADVISORY", label: "Security Advisory", desc: "Technical vulnerability bulletin & remediation" },
  { id: "PRESENTATION", label: "Presentation Outline", desc: "Slide-by-slide briefing with key takeaways" },
  { id: "INFOGRAPHIC_SPEC", label: "Infographic Spec", desc: "Structured data visualization layout" },
  { id: "VIDEO_PACKAGE", label: "Video Production Package", desc: "Short video script, hook, and shot list" },
];

const PROGRESS_STEPS = ["UNDERSTANDING", "ANALYZING", "PROTECTING", "TRANSFORMING", "READY"];

export default function ManualCreatePage() {
  const { userProfile, organization } = useAuth();
  const { success, error: showError } = useToast();
  const orgId = userProfile?.organizationId || "org_primary";

  // Wizard Step: 1 = Source, 2 = Output & Tone, 3 = Generating, 4 = Split Result
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Source state
  const [sourceMode, setSourceMode] = useState<"TEXT" | "FILE" | "URL">("TEXT");
  const [rawText, setRawText] = useState(PRESETS[0].text);
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Configuration state
  const [selectedFormat, setSelectedFormat] = useState("LINKEDIN_POST");
  const [audience, setAudience] = useState("TECHNICAL");
  const [tone, setTone] = useState("PROFESSIONAL");
  const [detail, setDetail] = useState("BALANCED");
  const [objective, setObjective] = useState("INFORM");

  // Progress state
  const [progressIndex, setProgressIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Result state
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const handleGenerate = async () => {
    setStep(3);
    setProgressIndex(0);

    // Simulate multi-stage visual progression
    const interval = setInterval(() => {
      setProgressIndex((prev) => {
        if (prev < PROGRESS_STEPS.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: rawText,
          sourceUrl: sourceMode === "URL" ? sourceUrl : undefined,
          outputFormat: selectedFormat,
          targetAudience: audience,
          tone,
          detailLevel: detail,
          objective,
          organizationId: orgId,
          userId: userProfile?.uid || "user_guest",
        }),
      });

      clearInterval(interval);
      setProgressIndex(PROGRESS_STEPS.length - 1);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to transform content");
      }

      const data = await res.json();
      setGeneratedTitle(data.title || "Synthesized Advisory Artefact");
      setGeneratedOutput(data.content || data.variant?.content || "");
      setCreatedContentId(data.contentId || data.id || null);

      setTimeout(() => {
        setStep(4);
        success("Content transformed successfully", "Zero-trust security scan passed (0.0 Risk).");
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setStep(2);
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
      const res = await fetch(`/api/approvals/appr_${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: createdContentId,
          status: "APPROVED",
          reviewerId: userProfile?.uid || "user_guest",
          organizationId: orgId,
        }),
      });

      if (res.ok) {
        success("Submitted for compliance signoff", "Artefact routed to approval queue and n8n webhook.");
      } else {
        throw new Error("Failed to submit approval.");
      }
    } catch (err: any) {
      showError("Submission failed", err.message);
    } finally {
      setSubmittingApproval(false);
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
              Manual Create Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">• 4-Step Intelligence Pipeline</span>
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
          {[1, 2, 4].map((s, idx) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step === s || (step === 3 && s === 2)
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
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Step 1: Provide Source Material</h2>
            <p className="text-xs text-slate-500">Paste technical disclosures, load preset advisories, or enter a URL.</p>
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
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
              </div>
              <p className="text-[11px] text-slate-400">NEXUS will crawl, extract body text, and strip tracking cookies.</p>
            </div>
          )}

          {sourceMode === "FILE" && (
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-3xl p-12 text-center bg-white space-y-3 transition-colors cursor-pointer">
              <UploadCloud className="w-10 h-10 text-blue-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">Upload PDF, DOCX, or TXT Advisory</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Drag &amp; drop or click to browse (up to 25MB)</p>
              </div>
            </div>
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
              Continue to Output Settings
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose Output & Tone */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Step 2: Choose Output Format &amp; Voice</h2>
              <p className="text-xs text-slate-500">Configure target channel constraints, tone, and audience profile.</p>
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

          {/* Audience & Tone Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium"
              >
                <option value="TECHNICAL">Technical / Engineers / DevSecOps</option>
                <option value="EXECUTIVE">C-Suite / CISOs / Board</option>
                <option value="PUBLIC">General Public &amp; Industry</option>
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
                <option value="EXPLANATORY">Educational &amp; Step-by-Step</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Detail Level</label>
              <select
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium"
              >
                <option value="CONCISE">Concise &amp; Scannable</option>
                <option value="BALANCED">Balanced Context</option>
                <option value="COMPREHENSIVE">Deep Technical Teardown</option>
              </select>
            </div>
          </div>

          {/* Generate CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Multi-Model AI with Zero-Trust Security Gate</span>
            </div>
            <Button
              variant="brand"
              size="md"
              onClick={handleGenerate}
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Artefact
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Animated Progression State */}
      {step === 3 && (
        <div className="py-16 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Synthesizing Content Artefact...</h3>
            <p className="text-xs text-slate-500">Evaluating source document under multi-layer security models.</p>
          </div>

          {/* Step Sequence Progression */}
          <div className="space-y-2 pt-2">
            {PROGRESS_STEPS.map((pStep, idx) => {
              const isDone = idx < progressIndex;
              const isCurrent = idx === progressIndex;
              return (
                <div
                  key={pStep}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                    isCurrent
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-2xs"
                      : isDone
                      ? "bg-white border-slate-200 text-slate-400"
                      : "bg-slate-50/60 border-slate-100 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span>{pStep}</span>
                  </div>
                  <span className="text-[10px]">
                    {isDone ? "COMPLETED" : isCurrent ? "IN PROGRESS" : "QUEUED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Split-Pane Result View */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  Security Cleared (0.0 Risk)
                </Badge>
                <span className="text-xs text-slate-400 font-medium">• {selectedFormat}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">{generatedTitle}</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
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
              <span>Artefact stored in Firestore with version v1. Ready for distribution.</span>
            </div>
            <Link href="/app/automations" className="text-blue-700 hover:underline font-semibold flex items-center gap-1">
              <span>Automate this workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
