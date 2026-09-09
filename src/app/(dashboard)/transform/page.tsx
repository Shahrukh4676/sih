"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Globe,
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Download,
  Send,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Video,
  Presentation as PresentationIcon,
  Layers,
  HelpCircle,
  Check,
  Film,
  RotateCcw,
  Image as ImageIcon,
  Palette,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ChevronRight,
  ExternalLink,
  Clock,
  Code,
} from "lucide-react";
import { OutputFormat, VisualType, VisualAsset } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

const PRESET_SOURCES = [
  {
    title: "Linux eBPF Privilege Escalation (CVE-2026-8812)",
    type: "Cybersecurity Advisory",
    text: `SECURITY ADVISORY: CVE-2026-8812 - Linux eBPF Privilege Escalation Vulnerability
A high-severity vulnerability has been confirmed in Linux kernels >= 6.8 involving eBPF register bounds calculation bypass. Local unprivileged users can elevate to root privileges.
Affected distributions include Ubuntu 24.04 LTS and RHEL 9.4. A public Proof-of-Concept exploit has been verified in the wild.
Mitigation steps: Apply patched kernel package v6.8.0-38.38 immediately. In environments where rebooting is constrained, disable unprivileged eBPF via: sysctl -w kernel.unprivileged_bpf_disabled=1.`,
  },
  {
    title: "Q3 AI Infrastructure & Sustainability Briefing",
    type: "Executive Report",
    text: `NEXUS RESEARCH: AI Compute Efficiency & Carbon Offsets Q3 Report
Data center electricity demand driven by generative AI inference grew 42% year-over-year. However, next-generation 3nm accelerator architectures demonstrate a 2.8x improvement in tokens per watt.
Key Strategic Recommendations:
1. Shift non-latency critical batch embeddings to renewable grid surplus hours (11:00 AM - 3:00 PM local solar peak).
2. Consolidate low-parameter reasoning models onto local inference edge clusters to reduce cross-continental fiber bandwidth.
3. Transition procurement standards to carbon-neutral certified cooling systems by Q1 2027.`,
  },
];

export default function TransformPage() {
  const { userProfile, organization } = useAuth();

  // Wizard Stage State (1: Source, 2: Configure, 3: Generate/Results)
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  // Step 1: Source State
  const [sourceInputMode, setSourceInputMode] = useState<"TEXT" | "FILE" | "URL">("TEXT");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState(PRESET_SOURCES[0].text);
  const [sourceUrl, setSourceUrl] = useState("");

  // Step 2: Configuration State
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>("LINKEDIN_POST");
  const [targetAudience, setTargetAudience] = useState("TECHNICAL");
  const [tone, setTone] = useState("PROFESSIONAL");
  const [language, setLanguage] = useState("ENGLISH");
  const [detailLevel, setDetailLevel] = useState<"CONCISE" | "BALANCED" | "COMPREHENSIVE">("BALANCED");
  const [objective, setObjective] = useState("INFORM");
  const [enforceBrandVoice, setEnforceBrandVoice] = useState(true);

  // Step 3: Generation & Progress State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result Artefact State
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedSlides, setGeneratedSlides] = useState<any[]>([]);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);
  const [providerUsed, setProviderUsed] = useState<string>("");
  const [securityDecision, setSecurityDecision] = useState<string>("ALLOW");

  // Visual Asset State
  const [activeResultTab, setActiveResultTab] = useState<"CONTENT" | "VISUAL" | "SECURITY">("CONTENT");
  const [selectedVisualType, setSelectedVisualType] = useState<VisualType>("ADVISORY_ALERT");
  const [activeVisualAsset, setActiveVisualAsset] = useState<VisualAsset | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);

  const formatCards: Array<{
    format: OutputFormat;
    title: string;
    icon: React.ReactNode;
    desc: string;
    recommendedVisual: VisualType;
  }> = [
    {
      format: "LINKEDIN_POST",
      title: "LinkedIn Post",
      icon: <FileText className="w-4 h-4 text-blue-600" />,
      desc: "High-engagement executive post with hooks, key insights & hashtags.",
      recommendedVisual: "SOCIAL_CARD",
    },
    {
      format: "X_THREAD",
      title: "X (Twitter) Thread",
      icon: <Layers className="w-4 h-4 text-sky-500" />,
      desc: "Structured multi-part numbered tweet thread optimized for virality.",
      recommendedVisual: "QUOTE_CARD",
    },
    {
      format: "CYBERSECURITY_ADVISORY",
      title: "Cybersecurity Advisory",
      icon: <ShieldCheck className="w-4 h-4 text-rose-600" />,
      desc: "CVE classification, threat vectors, CVSS, IOCs & remediation steps.",
      recommendedVisual: "ADVISORY_ALERT",
    },
    {
      format: "EXECUTIVE_SUMMARY",
      title: "Executive Summary",
      icon: <FileText className="w-4 h-4 text-slate-700" />,
      desc: "High-level strategic briefing with key takeaways and executive decisions.",
      recommendedVisual: "EXECUTIVE_BRIEF",
    },
    {
      format: "INFOGRAPHIC_SPEC",
      title: "Infographic Specification",
      icon: <ImageIcon className="w-4 h-4 text-emerald-600" />,
      desc: "Structured data visualization points and SVG vector visual asset.",
      recommendedVisual: "INFOGRAPHIC",
    },
    {
      format: "PRESENTATION",
      title: "Presentation Deck",
      icon: <PresentationIcon className="w-4 h-4 text-indigo-600" />,
      desc: "Slide titles, structured bullet points, and speaker notes.",
      recommendedVisual: "EXECUTIVE_BRIEF",
    },
  ];

  // Calculate text stats
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = rawText.length;

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setCurrentStage(3);
    setGenerationStep(1); // 1: Ingesting

    try {
      // Step 1: Ingest source into /api/sources
      let sourceInputText = rawText;
      if (sourceInputMode === "URL") {
        sourceInputText = `Source Reference URL: ${sourceUrl}\nExtracted intelligence payload: ${rawText}`;
      }

      const sourceRes = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceInputText,
          fileName: file?.name || "manual-input.txt",
          organizationId: organization?.organizationId || userProfile?.organizationId || "org_default",
          userId: userProfile?.uid || "usr_creator",
        }),
      });

      if (!sourceRes.ok) {
        const errData = await sourceRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to ingest source.");
      }

      const sourceData = await sourceRes.json();
      const sourceId = sourceData.source.id;

      setGenerationStep(2); // 2: Security & Extraction

      // Step 2: Analyze source into structured intelligence
      const analyzeRes = await fetch(`/api/sources/${sourceId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceReanalyze: false }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to analyze source intelligence.");
      }

      setGenerationStep(3); // 3: AI Transformation

      // Step 3: Transform into target output format
      const detailMapped =
        detailLevel === "CONCISE"
          ? "SHORT"
          : detailLevel === "COMPREHENSIVE"
          ? "DETAILED"
          : "MEDIUM";

      const transformRes = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          outputType: selectedFormat,
          targetAudience,
          tone,
          language,
          detailLevel: detailMapped,
          communicationObjective: objective,
          organizationId: organization?.organizationId || userProfile?.organizationId || "org_default",
          userId: userProfile?.uid || "usr_creator",
          brandPreferences: enforceBrandVoice
            ? {
                tone: organization?.brandVoiceGuidelines?.tone || "Professional",
                bannedPhrases: organization?.brandVoiceGuidelines?.bannedPhrases || [],
                mandatoryDisclaimers: organization?.brandVoiceGuidelines?.mandatoryDisclaimers || [],
              }
            : undefined,
        }),
      });

      if (!transformRes.ok) {
        const errData = await transformRes.json().catch(() => ({}));
        throw new Error(errData.error || "Transformation was blocked or failed.");
      }

      setGenerationStep(4); // 4: Finalizing & Storing

      const transformData = await transformRes.json();
      setGeneratedTitle(transformData.result.title);
      setGeneratedContent(transformData.result.content);
      setGeneratedSlides(transformData.result.slides || []);
      setActiveContentId(transformData.content.id);
      setActiveVersionNumber(1);
      setProviderUsed(transformData.result.providerUsed);
      setSecurityDecision(transformData.content.securityCheck?.decision || "ALLOW");
      setHasGenerated(true);

      // Automatically generate corresponding Visual Asset
      const matchedFormat = formatCards.find((f) => f.format === selectedFormat);
      const recommendedType = matchedFormat?.recommendedVisual || "SOCIAL_CARD";
      setSelectedVisualType(recommendedType);
      handleGenerateVisual(transformData.content.id, recommendedType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error running transformation pipeline";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVisual = async (contentId: string, visualType: VisualType) => {
    setIsGeneratingVisual(true);
    setVisualError(null);

    try {
      const res = await fetch("/api/visuals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          visualType,
          organizationId: organization?.organizationId || userProfile?.organizationId || "org_default",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to render visual asset.");
      }

      const data = await res.json();
      setActiveVisualAsset(data.visualAsset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Visual generation failed";
      setVisualError(msg);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!activeVisualAsset?.svgContent) return;
    const blob = new Blob([activeVisualAsset.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-asset-${activeVisualAsset.assetId || activeVisualAsset.id || "render"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Page Header & Stage Indicator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Studio Workspace
            </span>
            <span className="text-xs text-slate-400">• Free Tier AI Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Content Intelligence &amp; Transformation
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Ingest raw documents, select communication formats, and synthesize publication-ready artefacts.
          </p>
        </div>

        {/* 3-Stage Wizard Stepper */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
          {[
            { num: 1, label: "Source" },
            { num: 2, label: "Configure" },
            { num: 3, label: "Artefacts" },
          ].map((stage) => {
            const isCompleted = currentStage > stage.num;
            const isCurrent = currentStage === stage.num;
            return (
              <button
                key={stage.num}
                onClick={() => setCurrentStage(stage.num as 1 | 2 | 3)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCurrent
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : isCompleted
                    ? "text-slate-700 hover:bg-slate-200/60"
                    : "text-slate-400 hover:bg-slate-200/40"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : stage.num}
                </span>
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Transformation Failed:</span> {error}
          </div>
        </div>
      )}

      {/* STAGE 1: SOURCE INGESTION */}
      {currentStage === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Step 1: Source Ingestion
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Provide the text, report, or advisory you want to transform
                </p>
              </div>

              {/* Ingestion Mode Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setSourceInputMode("TEXT")}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    sourceInputMode === "TEXT"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setSourceInputMode("FILE")}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    sourceInputMode === "FILE"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setSourceInputMode("URL")}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    sourceInputMode === "URL"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  URL Source
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Presets Bar for Instant Hackathon Testing */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-600 pl-1">
                  Preset Samples:
                </span>
                {PRESET_SOURCES.map((preset) => (
                  <button
                    key={preset.title}
                    onClick={() => {
                      setRawText(preset.text);
                      setSourceInputMode("TEXT");
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-medium transition shadow-2xs cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>

              {/* Upload Dropzone Tab */}
              {sourceInputMode === "FILE" && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 transition flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Upload Document or Advisory
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Supports PDF, DOCX, and TXT files. Maximum 25MB per document.
                    </p>
                    <input
                      type="file"
                      id="source-file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setFile(f);
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setRawText(reader.result);
                            }
                          };
                          reader.readAsText(f);
                        }
                      }}
                    />
                    <label
                      htmlFor="source-file"
                      className="mt-4 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      Browse Files
                    </label>

                    {file && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{file.name}</span>
                        <span className="text-[10px] text-blue-600">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coming soon notice for audio/video */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-slate-400" />
                      <span>Audio &amp; Video File Ingestion (MP4, MP3)</span>
                    </span>
                    <Badge variant="neutral" size="sm">
                      Coming Soon (Phase 8)
                    </Badge>
                  </div>
                </div>
              )}

              {/* URL Ingestion Tab */}
              {sourceInputMode === "URL" && (
                <div className="space-y-3">
                  <Input
                    label="Source Web URL"
                    placeholder="https://example.com/advisories/cve-2026-8812"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    helperText="NEXUS AI will extract text and filter out boilerplate headers/footers."
                  />
                  <Textarea
                    label="Extracted Text / Context Notes (Optional Override)"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {/* Direct Text Tab */}
              {sourceInputMode === "TEXT" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Source Content Payload</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {wordCount} words • {charCount} characters
                    </span>
                  </div>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={8}
                    placeholder="Paste report text, research paper summary, or raw incident advisory here..."
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>
              )}

              {/* Action bar to Proceed to Step 2 */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentStage(2)}
                  disabled={!rawText.trim() && !file}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Configure Transformation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STAGE 2: CONFIGURE OUTPUTS & PARAMETERS */}
      {currentStage === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Step 2: Select Target Communication Output
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Select which format NEXUS AI should synthesize
                </p>
              </div>
              <Badge variant="brand" size="sm">
                Single or Multi-Format
              </Badge>
            </CardHeader>
            <CardContent>
              {/* Selectable Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {formatCards.map((fc) => {
                  const isSelected = selectedFormat === fc.format;
                  return (
                    <div
                      key={fc.format}
                      onClick={() => setSelectedFormat(fc.format)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            {fc.icon}
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {fc.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {fc.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grouped Generation Parameters */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                <h4 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                  Voice &amp; Intelligence Parameters
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select
                    label="Target Audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    options={[
                      { value: "TECHNICAL", label: "Technical / Engineers" },
                      { value: "EXECUTIVE", label: "C-Suite & Executives" },
                      { value: "GENERAL", label: "Broad Public / Stakeholders" },
                      { value: "SECURITY", label: "Security & SOC Teams" },
                    ]}
                  />

                  <Select
                    label="Tone of Voice"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    options={[
                      { value: "PROFESSIONAL", label: "Authoritative & Objective" },
                      { value: "CONVERSATIONAL", label: "Conversational & Engaging" },
                      { value: "URGENT", label: "Urgent Warning / Critical" },
                      { value: "INSPIRING", label: "Inspiring & Visionary" },
                    ]}
                  />

                  <Select
                    label="Detail Level"
                    value={detailLevel}
                    onChange={(e) =>
                      setDetailLevel(
                        e.target.value as "CONCISE" | "BALANCED" | "COMPREHENSIVE"
                      )
                    }
                    options={[
                      { value: "CONCISE", label: "Concise (Executive Bullet points)" },
                      { value: "BALANCED", label: "Balanced (Standard Post / Brief)" },
                      { value: "COMPREHENSIVE", label: "Comprehensive (In-depth)" },
                    ]}
                  />

                  <Select
                    label="Objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    options={[
                      { value: "INFORM", label: "Inform & Educate" },
                      { value: "CALL_TO_ACTION", label: "Drive Direct Action" },
                      { value: "THREAT_REMEDIATION", label: "Threat Remediation" },
                      { value: "THOUGHT_LEADERSHIP", label: "Thought Leadership" },
                    ]}
                  />
                </div>

                {/* Brand Voice Enforcement */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Enforce Organization Brand Guidelines
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Applies disclaimer rules, banned phrases, and verified terminology
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceBrandVoice}
                    onChange={(e) => setEnforceBrandVoice(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Navigation CTAs */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStage(1)}
                >
                  Back to Source
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Transform Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STAGE 3: GENERATION PROGRESS & RESULTS */}
      {currentStage === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Progress Indicator Card during Generation */}
          {isGenerating && (
            <Card className="border-blue-200 bg-blue-50/40">
              <CardContent className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Executing Content Intelligence Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Extracting source, screening injection vectors, and synthesizing verified output...
                  </p>
                </div>

                <div className="max-w-md mx-auto grid grid-cols-4 gap-2 pt-2 text-left">
                  {[
                    { step: 1, label: "Ingesting" },
                    { step: 2, label: "Screening" },
                    { step: 3, label: "Transforming" },
                    { step: 4, label: "Rendering" },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className={`p-2 rounded-lg border text-center text-xs ${
                        generationStep >= s.step
                          ? "bg-white border-blue-300 text-blue-700 font-semibold"
                          : "bg-slate-100/60 border-slate-200 text-slate-400"
                      }`}
                    >
                      <div>{generationStep > s.step ? "✓" : s.step}</div>
                      <div className="text-[10px] mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Result Workspace */}
          {hasGenerated && !isGenerating && (
            <div className="space-y-6">
              {/* Security & Verification Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900">
                      AI Security Screening Passed • Decision: {securityDecision}
                    </div>
                    <div className="text-emerald-700 text-[11px]">
                      Zero leaked secrets • No prompt injection vectors detected • Provider: {providerUsed || "Gemini Free Tier"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/approvals">
                    <Button variant="outline" size="xs">
                      Submit for Approval
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copied ? "Copied!" : "Copy Output"}
                  </Button>
                </div>
              </div>

              {/* Result Tabs: Content, Visual Asset, Security */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {generatedTitle || "Generated Communication Artefact"}
                    </CardTitle>
                    <p className="text-xs text-slate-400">
                      Format: {(selectedFormat || "LinkedIn Post").replace(/_/g, " ")} • Version v{activeVersionNumber}
                    </p>
                  </div>

                  <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setActiveResultTab("CONTENT")}
                      className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                        activeResultTab === "CONTENT"
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Text Artefact
                    </button>
                    <button
                      onClick={() => setActiveResultTab("VISUAL")}
                      className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                        activeResultTab === "VISUAL"
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Visual Intelligence
                    </button>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Tab 1: Rendered Text Content */}
                  {activeResultTab === "CONTENT" && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-sans whitespace-pre-wrap leading-relaxed">
                        {generatedContent}
                      </div>

                      {/* If presentation slides were generated */}
                      {generatedSlides.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-slate-900 uppercase">
                            Presentation Slide Outlines ({generatedSlides.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generatedSlides.map((slide, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs text-xs space-y-1.5"
                              >
                                <div className="font-semibold text-slate-900">
                                  Slide {sIdx + 1}: {slide.title}
                                </div>
                                <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-1 pl-1">
                                  {slide.bullets?.map((b: string, bIdx: number) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Visual Intelligence SVG Rendering */}
                  {activeResultTab === "VISUAL" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          Template: <strong className="text-slate-800">{selectedVisualType}</strong> • Dimensions: 1200 × 630 px
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              activeContentId &&
                              handleGenerateVisual(activeContentId, selectedVisualType)
                            }
                            isLoading={isGeneratingVisual}
                            leftIcon={<RefreshCw className="w-3 h-3" />}
                          >
                            Regenerate Visual
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={handleDownloadSvg}
                            disabled={!activeVisualAsset?.svgContent}
                            leftIcon={<Download className="w-3 h-3" />}
                          >
                            Download SVG
                          </Button>
                        </div>
                      </div>

                      {/* SVG Canvas Preview */}
                      {activeVisualAsset?.svgContent ? (
                        <div
                          className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-md flex items-center justify-center p-2"
                          dangerouslySetInnerHTML={{
                            __html: activeVisualAsset.svgContent,
                          }}
                        />
                      ) : (
                        <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          {isGeneratingVisual
                            ? "Rendering SVG visual asset..."
                            : "No visual asset rendered yet. Click 'Regenerate Visual' above."}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStage(1)}
                    >
                      New Transformation
                    </Button>

                    <div className="flex items-center gap-2">
                      <Link href={`/content/${activeContentId}`}>
                        <Button variant="outline" size="sm">
                          Open in Workspace
                        </Button>
                      </Link>
                      <Link href="/approvals">
                        <Button variant="primary" size="sm">
                          Review in Queue
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
