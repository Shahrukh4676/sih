"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Newspaper,
  Search,
  Bookmark,
  Sparkles,
  ExternalLink,
  Shield,
  Tag,
  Clock,
  Check,
  Info,
} from "lucide-react";
import { MOCK_NEWS_ITEMS } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import { NewsItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NewsIntelligencePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [newsList, setNewsList] = useState<NewsItem[]>(MOCK_NEWS_ITEMS);
  const [savedTopics] = useState<string[]>([
    "Cybersecurity Zero-Days",
    "AI Governance & Safety",
    "Cloud Architecture",
    "Regulatory Compliance",
  ]);

  const categories = [
    { id: "ALL", label: "All Briefings" },
    { id: "CYBERSECURITY", label: "Cybersecurity & Exploits" },
    { id: "AI_TRENDS", label: "AI Safety & Governance" },
    { id: "POLICY_REGULATION", label: "Standards & Compliance" },
  ];

  const filteredNews = newsList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSave = (id: string) => {
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSaved: !item.isSaved } : item
      )
    );
  };

  const handleTransform = (item: NewsItem) => {
    router.push(`/transform?sourceTitle=${encodeURIComponent(item.title)}`);
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
            <span className="text-xs text-slate-400">• Curated Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Personalized News Intelligence
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Discover relevant industry events, synthesize summaries, and transform news directly into executive communication artefacts.
          </p>
        </div>

        {/* Tracked Topics */}
        <div className="flex flex-col sm:items-end gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Subscribed Topics:</span>
          <div className="flex flex-wrap gap-1.5">
            {savedTopics.map((topic) => (
              <span
                key={topic}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Honest architectural disclosure */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Architecture Notice:</strong> Autonomous RSS &amp; web crawlers are scheduled for Phase 9. Seeded sample intelligence briefings are live below and can be transformed immediately.
        </span>
      </div>

      {/* 2. Search & Category Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by CVE, keyword, vendor, or topic..."
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

      {/* 3. News Feed Cards */}
      {filteredNews.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No news briefings found"
          description="Try broadening your search query or switching to another category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      {item.source}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSave(item.id)}
                    className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                    title={item.isSaved ? "Saved" : "Save topic"}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        item.isSaved ? "fill-blue-600 text-blue-600" : ""
                      }`}
                    />
                  </button>
                </div>
                <CardTitle className="text-sm font-semibold leading-snug">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.summary}
                </p>

                {/* Why It Matters Callout */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Why it matters:
                  </span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Direct impact on enterprise infrastructure and security compliance standards.
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                >
                  Source Link <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => handleTransform(item)}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Transform News
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
