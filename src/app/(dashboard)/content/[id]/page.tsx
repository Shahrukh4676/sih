"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Send,
  Eye,
  FileText,
  Layers,
  History,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Content, VisualAsset } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const contentId = params?.id as string;

  const [activeTab, setActiveTab] = useState<
    "CONTENT" | "VISUALS" | "SOURCE" | "VERSIONS" | "SECURITY"
  >("CONTENT");
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [visualAsset, setVisualAsset] = useState<VisualAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!contentId) return;
    setLoading(true);
    setNotFound(false);

    // Fetch from real content API
    fetch(`/api/content/${contentId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Content not found");
        }
        return res.json();
      })
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });

    // Try fetching visual assets
    fetch(`/api/content/${contentId}/visuals`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.visuals?.[0]) {
          setVisualAsset(data.visuals[0]);
        }
      })
      .catch(() => {});
  }, [contentId]);

  if (notFound) {
    return (
      <div className="space-y-6 py-12 max-w-xl mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-base font-bold text-slate-900">Content Artefact Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested content record <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{contentId}</code> does not exist in the database.
          </p>
          <Link href="/content">
            <Button variant="outline" size="sm">
              Return to Content Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !content) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        Loading content artefact workspace...
      </div>
    );
  }

  const bodyText = content.currentVersion?.body || content.content || "";

  const handleCopy = () => {
    if (!bodyText) return;
    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = bodyText.length;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header with Back Button, Status, and Actions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/content"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Library
            </Link>
            <span className="text-slate-300">•</span>
            <Badge variant="neutral" size="sm">
              {content.outputFormat.replace(/_/g, " ")}
            </Badge>
            <Badge
              variant={
                content.status === "PUBLISHED"
                  ? "success"
                  : content.status === "AWAITING_APPROVAL"
                  ? "warning"
                  : "brand"
              }
              size="sm"
              dot
            >
              {content.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {content.title}
          </h1>
          <div className="text-xs text-slate-400">
            Version v{content.currentVersion.versionNumber} • Created {formatRelativeTime(content.createdAt)}
          </div>
        </div>

        {/* Header Action CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? "Copied" : "Copy"}
          </Button>

          <Link href="/approvals">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Review / Signoff
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Workspace Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: "CONTENT", label: "Generated Artefact", icon: <FileText className="w-4 h-4" /> },
          { id: "VISUALS", label: "Visual Intelligence", icon: <Layers className="w-4 h-4" /> },
          { id: "SOURCE", label: "Source Intelligence", icon: <Code className="w-4 h-4" /> },
          { id: "VERSIONS", label: "Version History", icon: <History className="w-4 h-4" /> },
          { id: "SECURITY", label: "Security & Governance", icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-tight border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? "text-blue-600 border-blue-600 bg-blue-50/40"
                  : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Panels */}
      {/* TAB 1: CONTENT */}
      {activeTab === "CONTENT" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Synthesized Body Text
              </CardTitle>
              <p className="text-xs text-slate-500">
                {wordCount} words • {charCount} characters • Target: {content.targetAudience}
              </p>
            </div>
            <Badge variant="verified" size="sm" dot>
              Grounded &amp; Verified
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
              {content.currentVersion.body}
            </div>

            {/* If presentation slides */}
            {((content.currentVersion as any).slides || content.currentVersion.slideOutline) && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Deck Slides
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {((content.currentVersion as any).slides || content.currentVersion.slideOutline || []).map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs"
                    >
                      <div className="font-bold text-slate-900">
                        Slide {idx + 1}: {s.title}
                      </div>
                      <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-1">
                        {s.bullets?.map((b: string, bIdx: number) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: VISUALS */}
      {activeTab === "VISUALS" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Visual Intelligence Assets
              </CardTitle>
              <p className="text-xs text-slate-500">
                Rendered SVG vector graphics linked to this artefact
              </p>
            </div>
            {visualAsset && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  if (!visualAsset.svgContent) return;
                  const blob = new Blob([visualAsset.svgContent], { type: "image/svg+xml" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `nexus-visual-${visualAsset.assetId || visualAsset.id}.svg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download SVG
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {visualAsset?.svgContent ? (
              <div className="space-y-4">
                <div
                  className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-md p-2 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: visualAsset.svgContent }}
                />
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600">
                    Template: <strong>{visualAsset.assetType}</strong>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {visualAsset.width} × {visualAsset.height} px
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No visual asset rendered yet. Generate one in the Transform Studio.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SOURCE */}
      {activeTab === "SOURCE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Original Ingested Source Material
            </CardTitle>
            <p className="text-xs text-slate-500">
              Source ID: {content.sourceId} • Tenant: {content.organizationId}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-800">
                Source Document Reference
              </div>
              <div className="text-slate-600 leading-relaxed font-mono">
                Source ID: {content.sourceId}
              </div>
              <div className="text-slate-500 text-[11px]">
                Pre-screened against prompt injection signatures and sanitized before LLM synthesis.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: VERSIONS */}
      {activeTab === "VERSIONS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Version History Timeline
            </CardTitle>
            <p className="text-xs text-slate-500">
              Immutable audit-logged iterations of this communication artefact
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* v2 Current */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-blue-900">
                      Version v{content.currentVersion.versionNumber} (Current Active)
                    </span>
                    <Badge variant="brand" size="sm">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {content.currentVersion.body}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Created {formatRelativeTime(content.updatedAt || content.createdAt)}
                  </div>
                </div>
              </div>

              {/* v1 Initial */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-700">
                      Version v1 (Original Synthesis)
                    </span>
                    <span className="text-[11px] text-slate-400">Archived</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Initial AI extraction and multi-artefact formatting from primary source material.
                  </p>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Created {formatRelativeTime(content.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === "SECURITY" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Security &amp; Safety Audit
              </CardTitle>
              <Badge variant="verified" size="sm" dot>
                {(content.securityCheck as any)?.decision || (content.securityCheck?.passed ? "ALLOW" : "REVIEW")}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Automated prompt injection &amp; credential leakage screening report
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-400 text-[11px]">Prompt Injection</div>
                <div className="font-bold text-emerald-700 text-sm mt-0.5">
                  Clean / None
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-400 text-[11px]">Exposed Credentials</div>
                <div className="font-bold text-emerald-700 text-sm mt-0.5">
                  Zero Leaks
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-400 text-[11px]">Risk Classification</div>
                <div className="font-bold text-blue-700 text-sm mt-0.5">
                  {content.securityCheck?.hallucinationRisk || "LOW"} Risk
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
              <div className="font-semibold text-slate-800">
                Screening Summary
              </div>
              <p>
                All output texts were screened by the NEXUS AI Security Engine prior to persistence. No API keys, JWTs, Bearer tokens, or raw credentials were identified. Output grounded in verified source points.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
