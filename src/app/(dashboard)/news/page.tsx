"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Newspaper,
  Search,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ExternalLink,
  Shield,
  Tag,
  Clock,
  Check,
  RefreshCw,
  Plus,
  X,
  Sliders,
  Share2,
  FileText,
  Presentation as PresentationIcon,
  AlertCircle,
  CheckCircle2,
  Building2,
  ChevronRight,
} from "lucide-react";
import { LinkedInIcon, XTwitterIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import { NewsItem, Content } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export default function NewsIntelligencePage() {
  const router = useRouter();
  const { userProfile, organization } = useAuth();
  const organizationId = userProfile?.organizationId || organization?.id || "org_primary";
  const userId = userProfile?.uid || "usr_admin_default";

  // Data states
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Topic Preferences
  const [savedTopics, setSavedTopics] = useState<string[]>([
    "Cybersecurity Zero-Days",
    "AI Governance & Safety",
    "Cloud Architecture & Security",
    "Regulatory Compliance & NIST",
  ]);
  const [topicsModalOpen, setTopicsModalOpen] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [savingTopics, setSavingTopics] = useState(false);

  // News Detail Modal
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null);

  // Transform Modal
  const [transformItem, setTransformItem] = useState<NewsItem | null>(null);
  const [targetFormat, setTargetFormat] = useState<
    "LINKEDIN_POST" | "X_THREAD" | "CYBERSECURITY_ADVISORY" | "EXECUTIVE_SUMMARY" | "PRESENTATION"
  >("LINKEDIN_POST");
  const [targetTone, setTargetTone] = useState<"PROFESSIONAL" | "TECHNICAL" | "URGENT" | "CONVERSATIONAL">("PROFESSIONAL");
  const [customInstructions, setCustomInstructions] = useState("");
  const [transforming, setTransforming] = useState(false);
  const [transformSuccess, setTransformSuccess] = useState<{
    contentId: string;
    format: string;
    title: string;
  } | null>(null);

  const categories = [
    { id: "ALL", label: "All Briefings" },
    { id: "CYBERSECURITY", label: "Cybersecurity & Exploits" },
    { id: "AI_TRENDS", label: "AI Safety & Governance" },
    { id: "POLICY_REGULATION", label: "Standards & Compliance" },
    { id: "ENTERPRISE_TECH", label: "Enterprise Tech" },
    { id: "MARKET_INTELLIGENCE", label: "Market Intelligence" },
  ];

  // Fetch news feed from server
  const fetchNews = useCallback(
    async (forceRefresh = false) => {
      try {
        if (forceRefresh) {
          setSyncing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          organizationId,
          ...(selectedCategory !== "ALL" ? { category: selectedCategory } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
          ...(forceRefresh ? { refresh: "true" } : {}),
        });

        const res = await fetch(`/api/news?${params.toString()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        const data = await res.json();
        if (data.success && data.items) {
          setNewsList(data.items);
          if (data.preferences?.subscribedTopics) {
            setSavedTopics(data.preferences.subscribedTopics);
          }
        } else {
          setError(data.error || "Failed to load news intelligence feed.");
        }
      } catch (err: any) {
        console.error("Error fetching news:", err);
        setError("Network or server issue connecting to news intelligence service.");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [organizationId, selectedCategory, searchQuery]
  );

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Toggle saved/bookmarked state
  const toggleSave = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNewsList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isSaved: !item.isSaved } : item))
      );
      await fetch(`/api/news/${id}`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  // Save updated topic preferences
  const handleSaveTopics = async () => {
    try {
      setSavingTopics(true);
      const res = await fetch("/api/news/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          subscribedTopics: savedTopics,
        }),
      });
      if (res.ok) {
        setTopicsModalOpen(false);
        await fetchNews(true);
      }
    } catch (err) {
      console.error("Failed to save topics:", err);
    } finally {
      setSavingTopics(false);
    }
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    if (!savedTopics.includes(newTopicInput.trim())) {
      setSavedTopics([...savedTopics, newTopicInput.trim()]);
    }
    setNewTopicInput("");
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setSavedTopics(savedTopics.filter((t) => t !== topicToRemove));
  };

  // Perform AI transformation & persistence
  const handleExecuteTransform = async () => {
    if (!transformItem) return;
    try {
      setTransforming(true);
      setError(null);
      const res = await fetch("/api/news/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsId: transformItem.id,
          organizationId,
          userId,
          userEmail: userProfile?.email || "user@nexus.ai",
          targetFormat,
          tone: targetTone,
          customInstructions,
        }),
      });

      const data = await res.json();
      if (data.success && data.content) {
        setTransformSuccess({
          contentId: data.content.id,
          format: targetFormat,
          title: data.content.title,
        });
      } else {
        setError(data.error || "Failed to transform news briefing");
      }
    } catch (err: any) {
      setError(err?.message || "Transformation request failed");
    } finally {
      setTransforming(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Discovery Engine
            </span>
            <span className="text-xs text-slate-400">• Phase 9 Real RSS Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Personalized News Intelligence
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Ingest real-time cybersecurity, AI governance, and compliance feeds. Personalize ranking and transform directly into executive artefacts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTopicsModalOpen(true)}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
          >
            Manage Topics ({savedTopics.length})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fetchNews(true)}
            disabled={syncing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />}
          >
            {syncing ? "Syncing Feeds..." : "Sync Live Feeds"}
          </Button>
        </div>
      </div>

      {/* 2. Subscribed Topics Pills */}
      <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
        <span className="text-slate-400 font-medium mr-1">Active Ranking Topics:</span>
        {savedTopics.map((topic) => (
          <span
            key={topic}
            className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-medium flex items-center gap-1.5"
          >
            <Tag className="w-3 h-3 text-blue-500" />
            {topic}
          </span>
        ))}
      </div>

      {/* 3. Search & Category Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by CVE, exploit, model, or organization..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="xs" onClick={() => fetchNews(true)}>
            Retry
          </Button>
        </div>
      )}

      {/* 5. News Feed Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-slate-200 bg-white space-y-3 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : newsList.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No news briefings match your filters"
          description="Try broadening your search query, switching categories, or synchronizing live RSS feeds."
          actionLabel="Sync Live Feeds"
          onAction={() => fetchNews(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsList.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200/90"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant={
                        item.relevanceScore >= 85
                          ? "verified"
                          : item.relevanceScore >= 65
                          ? "brand"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {item.relevanceScore}% Match
                    </Badge>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] font-medium text-slate-600">{item.source}</span>
                  </div>

                  <button
                    onClick={(e) => toggleSave(item.id, e)}
                    title={item.isSaved ? "Remove from bookmarks" : "Save briefing"}
                    className="text-slate-400 hover:text-blue-600 transition p-1"
                  >
                    {item.isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-blue-600 fill-blue-50" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <CardTitle className="text-base font-bold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition" onClick={() => setDetailItem(item)}>
                  {item.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>

                  {/* Why it Matters Callout */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-600" />
                      Strategic Impact:
                    </div>
                    <div className="line-clamp-2">{item.whyItMatters}</div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(item.timestamp)}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setDetailItem(item)}
                    >
                      Read Briefing
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        setTransformItem(item);
                        setTransformSuccess(null);
                      }}
                      leftIcon={<Sparkles className="w-3 h-3" />}
                    >
                      Transform
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: Topic Preferences                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={topicsModalOpen}
        onClose={() => setTopicsModalOpen(false)}
        title="Personalized Topic Preferences"
        description="Configure subscribed domains and topics to train the relevance scoring engine."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Add Tracking Topic / Keyword:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                placeholder="e.g. Active Directory Kerberos Exploits, LLM Hallucinations"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button variant="outline" size="sm" onClick={handleAddTopic} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Currently Subscribed Topics:</label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[80px]">
              {savedTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 flex items-center gap-1.5 shadow-2xs"
                >
                  {topic}
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setTopicsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveTopics} disabled={savingTopics}>
              {savingTopics ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. MODAL: News Detail View                                               */}
      {/* ========================================================================= */}
      {detailItem && (
        <Modal
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title="Intelligence Briefing Detail"
          description={`Source: ${detailItem.source} • ${formatRelativeTime(detailItem.timestamp)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <Badge variant="verified">{detailItem.relevanceScore}% Relevance Score</Badge>
              <a
                href={detailItem.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                View Original Source
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">{detailItem.title}</h3>
              <p className="text-slate-600 leading-relaxed text-xs">{detailItem.summary}</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1 text-slate-800">
              <div className="font-semibold flex items-center gap-1.5 text-blue-950">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Strategic Why-It-Matters Analysis:
              </div>
              <p className="leading-relaxed">{detailItem.whyItMatters}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Associated Tags &amp; CVEs:</span>
              <div className="flex flex-wrap gap-1">
                {detailItem.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDetailItem(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const item = detailItem;
                  setDetailItem(null);
                  setTransformItem(item);
                  setTransformSuccess(null);
                }}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Transform into Artefact
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: AI Transformation into Communication Artefact                   */}
      {/* ========================================================================= */}
      {transformItem && (
        <Modal
          isOpen={Boolean(transformItem)}
          onClose={() => {
            setTransformItem(null);
            setTransformSuccess(null);
          }}
          title="Transform News into Communication Artefact"
          description="Synthesize verified briefing into publication-ready content with grounded citations."
        >
          {transformSuccess ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm">Successfully Synthesized and Persisted!</div>
                  <p className="text-emerald-800">
                    Content record has been saved to Firestore with ID <code>{transformSuccess.contentId}</code>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-800">{transformSuccess.title}</div>
                <div className="text-slate-500">Format: {transformSuccess.format.replace("_", " ")}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTransformItem(null);
                    setTransformSuccess(null);
                  }}
                >
                  Done
                </Button>
                <Link href={`/content/${transformSuccess.contentId}`}>
                  <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    View in Content Studio
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Selected Source:</span>
                <div className="font-semibold leading-snug">{transformItem.title}</div>
                <div className="text-[11px] text-slate-500">{transformItem.source}</div>
              </div>

              {/* Target Format */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Target Output Format:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "LINKEDIN_POST", label: "LinkedIn Post", icon: LinkedInIcon },
                    { id: "X_THREAD", label: "X (Twitter) Thread", icon: XTwitterIcon },
                    { id: "CYBERSECURITY_ADVISORY", label: "Cybersecurity Advisory", icon: Shield },
                    { id: "EXECUTIVE_SUMMARY", label: "Executive Summary", icon: FileText },
                    { id: "PRESENTATION", label: "Presentation Brief", icon: PresentationIcon },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTargetFormat(fmt.id as any)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                          targetFormat === fmt.id
                            ? "border-blue-600 bg-blue-50/60 text-blue-900 font-semibold"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Executive Tone:</label>
                <select
                  value={targetTone}
                  onChange={(e) => setTargetTone(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="PROFESSIONAL">Professional &amp; Authoritative</option>
                  <option value="TECHNICAL">Technical &amp; Deep-Dive</option>
                  <option value="URGENT">Urgent &amp; Advisory Action</option>
                  <option value="CONVERSATIONAL">Conversational &amp; Thought Leadership</option>
                </select>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Strategic Directives (Optional):</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Emphasize impact on Fortune 500 CISOs, recommend immediate zero-trust auditing."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransformItem(null)}
                  disabled={transforming}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExecuteTransform}
                  disabled={transforming}
                  leftIcon={<Sparkles className={`w-3.5 h-3.5 ${transforming ? "animate-spin" : ""}`} />}
                >
                  {transforming ? "Synthesizing & Ingesting..." : "Synthesize Artefact"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
