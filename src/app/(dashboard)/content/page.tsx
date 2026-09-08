"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  SlidersHorizontal,
  Eye,
  Calendar,
  ShieldCheck,
  Share2,
  Copy,
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Check,
  RefreshCw,
} from "lucide-react";
import { Content, ContentStatus, OutputFormat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function ContentLibraryPage() {
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";

  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [formatFilter, setFormatFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/content?organizationId=${organizationId}`);
      const data = await res.json();
      if (data.success && data.contents) {
        setContents(data.contents);
      }
    } catch (err) {
      console.error("Error fetching content library:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const statusOptions = [
    { id: "ALL", label: "All Statuses" },
    { id: "AWAITING_APPROVAL", label: "Awaiting Approval" },
    { id: "APPROVED", label: "Approved" },
    { id: "PUBLISHED", label: "Published" },
    { id: "SECURITY_REVIEW", label: "Security Review" },
    { id: "GENERATED", label: "Generated" },
  ];

  const formatOptions = [
    { id: "ALL", label: "All Formats" },
    { id: "LINKEDIN_POST", label: "LinkedIn Post" },
    { id: "X_THREAD", label: "X Thread" },
    { id: "EXECUTIVE_SUMMARY", label: "Executive Summary" },
    { id: "CYBERSECURITY_ADVISORY", label: "Cybersecurity Advisory" },
    { id: "PRESENTATION", label: "Presentation Deck" },
  ];

  const filteredContents = contents.filter((item) => {
    const title = item.title || "";
    const body = item.currentVersion?.body || item.content || "";
    const audience = item.targetAudience || "";

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audience.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesFormat = formatFilter === "ALL" || item.outputFormat === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Repository
            </span>
            <span className="text-xs text-slate-400">• Multi-Format Storage</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Content Intelligence Library
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Browse, inspect, compare versions, and publish verified AI communication artefacts.
          </p>
        </div>

        <Link href="/transform">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            New Transformation
          </Button>
        </Link>
      </div>

      {/* 2. Search & Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, body keyword, or audience..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Format Filter */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {formatOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === "TABLE"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === "GRID"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Empty State, Loading, or Content View */}
      {loading ? (
        <Card className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading content library...</span>
        </Card>
      ) : filteredContents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No content artefacts match criteria"
          description="Adjust your search query or filter tags, or generate a new transformation from your source materials."
          actionLabel="Transform New Content"
          onAction={() => (window.location.href = "/transform")}
        />
      ) : viewMode === "TABLE" ? (
        /* TABLE VIEW */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="px-5 py-3">Artefact Title</th>
                  <th className="px-4 py-3">Output Format</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Target Audience</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContents.map((item) => {
                  const bodyText = item.currentVersion?.body || item.content || "";
                  const versionNum = item.currentVersion?.versionNumber || item.version || 1;
                  const formatLabel = item.outputFormat ? item.outputFormat.replace(/_/g, " ") : "Content";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-sm truncate">
                        <Link
                          href={`/content/${item.id}`}
                          className="font-semibold text-slate-800 hover:text-blue-600 transition block truncate"
                        >
                          {item.title}
                        </Link>
                        <div className="text-[11px] text-slate-400 truncate">
                          ID: {item.id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral" size="sm">
                          {formatLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status === "PUBLISHED"
                              ? "success"
                              : item.status === "AWAITING_APPROVAL"
                              ? "warning"
                              : "brand"
                          }
                          size="sm"
                          dot
                        >
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold border border-slate-200">
                          v{versionNum}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.targetAudience}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleCopy(item.id, bodyText)}
                            title="Copy body text"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Link href={`/content/${item.id}`}>
                            <Button variant="outline" size="xs">
                              Workspace
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContents.map((item) => {
            const bodyText = item.currentVersion?.body || item.content || "";
            const versionNum = item.currentVersion?.versionNumber || item.version || 1;
            const formatLabel = item.outputFormat ? item.outputFormat.replace(/_/g, " ") : "Content";

            return (
              <Card key={item.id} hoverable className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Badge variant="neutral" size="sm">
                      {formatLabel}
                    </Badge>
                    <Badge
                      variant={
                        item.status === "PUBLISHED"
                          ? "success"
                          : item.status === "AWAITING_APPROVAL"
                          ? "warning"
                          : "brand"
                      }
                      size="sm"
                      dot
                    >
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold line-clamp-2">
                    <Link
                      href={`/content/${item.id}`}
                      className="hover:text-blue-600 transition"
                    >
                      {item.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {bodyText}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Version v{versionNum}</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCopy(item.id, bodyText)}
                  >
                    {copiedId === item.id ? "Copied" : "Copy"}
                  </Button>
                  <Link href={`/content/${item.id}`}>
                    <Button variant="outline" size="xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
