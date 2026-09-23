"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Share2,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  FileText,
  ShieldAlert,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";
import {
  useAutomations,
  formatTriggerDisplay,
  formatOutputDisplay,
  formatRelativeTime,
  formatNextRunDisplay,
} from "@/hooks/useAutomations";
import { Automation } from "@/types";

export const ENTERPRISE_TEMPLATES = [
  {
    id: "research_paper_linkedin",
    name: "Research Paper → LinkedIn",
    description: "When I upload a research paper, create a professional LinkedIn post, run security checks, and send it for approval.",
    triggerType: "NEW_SOURCE_UPLOADED",
    triggerLabel: "When research paper is uploaded",
    sourceType: "PDF",
    outputFormat: "LINKEDIN_POST",
    outputLabel: "LinkedIn post",
    approvalRequired: true,
    deliveryTarget: ["LINKEDIN"],
    tag: "Most Popular",
  },
  {
    id: "security_advisory_bulletin",
    name: "Security Advisory → LinkedIn",
    description: "When a security advisory or vulnerability is detected, transform it into a concise executive LinkedIn post, run checks, and require approval.",
    triggerType: "NEWS_TOPIC_ALERT",
    triggerLabel: "When security advisory is detected",
    sourceType: "TEXT",
    outputFormat: "CYBERSECURITY_ADVISORY",
    outputLabel: "Security bulletin & LinkedIn post",
    approvalRequired: true,
    deliveryTarget: ["LINKEDIN"],
    tag: "Cybersecurity",
  },
  {
    id: "weekly_thought_leadership",
    name: "Weekly Thought Leadership",
    description: "Every Monday morning, prepare a LinkedIn post from selected content sources, verify consistency, and send for approval.",
    triggerType: "SCHEDULE",
    triggerLabel: "Every Monday at 9:00 AM",
    sourceType: "ALL",
    outputFormat: "LINKEDIN_POST",
    outputLabel: "LinkedIn post",
    approvalRequired: true,
    deliveryTarget: ["LINKEDIN"],
    tag: "Scheduled",
  },
  {
    id: "document_executive_summary",
    name: "Document → Executive Summary",
    description: "When I upload a long document, create an executive summary, verify factual grounding, and send it for review.",
    triggerType: "NEW_SOURCE_UPLOADED",
    triggerLabel: "When document is uploaded",
    sourceType: "PDF",
    outputFormat: "EXECUTIVE_SUMMARY",
    outputLabel: "Executive summary",
    approvalRequired: true,
    deliveryTarget: ["LINKEDIN"],
    tag: "Leadership",
  },
];

export default function AutomationsOverviewPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";
  const { success, info, error: showError } = useToast();

  const {
    rules,
    executions,
    loading,
    error,
    refresh,
    toggleRule,
    runRule,
    deleteRule,
    duplicateRule,
  } = useAutomations(organizationId);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");
  const [triggerFilter, setTriggerFilter] = useState<string>("ALL");

  // Template Modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Delete Confirm Modal
  const [deletingRule, setDeletingRule] = useState<Automation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Running rule state
  const [runningId, setRunningId] = useState<string | null>(null);

  // Menu dropdown state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Summary Metrics (Computed from actual data)
  const stats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.enabled).length;
    const paused = rules.filter((r) => !r.enabled).length;
    const needsAttention = executions.filter(
      (e) => e.status === "FAILED" || e.status === "BLOCKED"
    ).length;

    return { total, active, paused, needsAttention };
  }, [rules, executions]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && rule.enabled) ||
        (statusFilter === "PAUSED" && !rule.enabled);

      const matchesTrigger =
        triggerFilter === "ALL" || rule.trigger?.type === triggerFilter;

      return matchesSearch && matchesStatus && matchesTrigger;
    });
  }, [rules, searchQuery, statusFilter, triggerFilter]);

  // Actions
  const handleToggle = async (rule: Automation) => {
    const nextState = !rule.enabled;
    const ok = await toggleRule(rule.id, nextState);
    if (ok) {
      if (nextState) {
        success("Automation Activated", `"${rule.name}" is now running.`);
      } else {
        info("Automation Paused", `"${rule.name}" has been paused.`);
      }
    } else {
      showError("Update Failed", "Could not change automation status.");
    }
  };

  const handleRunNow = async (rule: Automation) => {
    setRunningId(rule.id);
    const res = await runRule(rule.id);
    setRunningId(null);
    if (res.success) {
      success(
        "Automation Triggered",
        `"${rule.name}" executed. Result logged in activity.`
      );
    } else {
      showError("Execution Failed", res.message || "Failed to run automation.");
    }
  };

  const handleDuplicate = async (rule: Automation) => {
    setOpenMenuId(null);
    const cloned = await duplicateRule(rule);
    if (cloned) {
      success("Automation Duplicated", `Created copy "${cloned.name}".`);
    } else {
      showError("Duplicate Failed", "Could not copy automation.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRule) return;
    setIsDeleting(true);
    const ok = await deleteRule(deletingRule.id);
    setIsDeleting(false);
    if (ok) {
      success("Automation Deleted", `"${deletingRule.name}" was removed.`);
      setDeletingRule(null);
    } else {
      showError("Delete Failed", "Could not delete automation rule.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Automations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Let NEXUS handle repetitive content workflows automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplatesModal(true)}
            leftIcon={<BookOpen className="w-4 h-4 text-slate-500" />}
          >
            Explore Templates
          </Button>

          <Link href="/app/automations/new">
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Automation
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Summary Row (Real Data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.active}</p>
          <span className="text-[11px] text-slate-400">Currently listening</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Paused</span>
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.paused}</p>
          <span className="text-[11px] text-slate-400">Temporarily on hold</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Needs Attention</span>
            <div
              className={`w-2 h-2 rounded-full ${
                stats.needsAttention > 0 ? "bg-amber-500" : "bg-slate-300"
              }`}
            />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.needsAttention}</p>
          <span className="text-[11px] text-slate-400">Requires review</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Automations</span>
            <Workflow className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Configured workflows</span>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      {rules.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search automations by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                All ({rules.length})
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === "ACTIVE"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("PAUSED")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === "PAUSED"
                    ? "bg-white text-slate-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Paused ({stats.paused})
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">Loading your automations...</p>
        </div>
      ) : rules.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
            <Workflow className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">No automations yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Automate repetitive content workflows with NEXUS. Connect uploads or schedules to multi-channel AI generation, security verification, and human approvals.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app/automations/new">
              <Button variant="brand" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Create Automation
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowTemplatesModal(true)}
              leftIcon={<BookOpen className="w-4 h-4 text-slate-500" />}
            >
              Browse Templates
            </Button>
          </div>

          {/* Quick-Start Templates */}
          <div className="pt-8 border-t border-slate-100 text-left">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
              Or start from a verified enterprise template
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {ENTERPRISE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs bg-slate-50/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {tmpl.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{tmpl.description}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Destination: {tmpl.deliveryTarget.join(", ")}
                    </span>
                    <Link href={`/app/automations/new?template=${tmpl.id}`}>
                      <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                        Use Template
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredRules.length === 0 ? (
        /* No Search Match */
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">No matching automations found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setTriggerFilter("ALL");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Automation Cards List */
        <div className="space-y-4">
          {filteredRules.map((rule) => {
            const isMenuOpen = openMenuId === rule.id;
            const isRunning = runningId === rule.id;

            return (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-5 sm:p-6 space-y-4"
              >
                {/* Top Row: Name, Status Badge, Kebab Menu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          rule.enabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            rule.enabled ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {rule.enabled ? "ACTIVE" : "PAUSED"}
                      </span>
                      <Link
                        href={`/app/automations/${rule.id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {rule.name}
                      </Link>
                    </div>
                    {rule.description && (
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        {rule.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Menu */}
                  <div className="flex flex-wrap items-center gap-2 relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunNow(rule)}
                      isLoading={isRunning}
                      leftIcon={<Play className="w-3 h-3 text-blue-600 fill-blue-600" />}
                    >
                      Run Now
                    </Button>

                    <Button
                      variant={rule.enabled ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleToggle(rule)}
                      leftIcon={
                        rule.enabled ? (
                          <Pause className="w-3 h-3 text-slate-500" />
                        ) : (
                          <Play className="w-3 h-3 text-emerald-600" />
                        )
                      }
                    >
                      {rule.enabled ? "Pause" : "Resume"}
                    </Button>

                    <Link href={`/app/automations/${rule.id}`}>
                      <Button variant="brand" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                        Open
                      </Button>
                    </Link>

                    {/* Secondary kebab dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(isMenuOpen ? null : rule.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs">
                          <button
                            onClick={() => handleDuplicate(rule)}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeletingRule(rule);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workflow Properties Grid: Product Language (No enums) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      WHEN
                    </span>
                    <span className="font-medium text-slate-800 mt-0.5 block truncate">
                      {formatTriggerDisplay(rule.trigger)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      OUTPUT
                    </span>
                    <span className="font-medium text-slate-800 mt-0.5 block truncate">
                      {formatOutputDisplay(rule.aiAction)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      REVIEW
                    </span>
                    <span className="font-medium text-slate-800 mt-0.5 block truncate">
                      {rule.approvalRequired ? "Approval required" : "Direct publishing"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      DESTINATION
                    </span>
                    <span className="font-medium text-slate-800 mt-0.5 block truncate">
                      {(rule.deliveryTarget || ["LinkedIn"]).join(", ")}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      HEALTH
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-800">
                        {rule.healthScore || 96} / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Last run & Next run */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last run:</span>
                    <strong className="text-slate-600 font-medium">
                      {formatRelativeTime(rule.lastExecutedAt)}
                    </strong>
                    {rule.executionCount ? (
                      <span className="text-slate-400">
                        • {rule.executionCount} {rule.executionCount === 1 ? "run" : "runs"}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Next:</span>
                    <span className="text-slate-600 font-medium">
                      {formatNextRunDisplay(rule)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Templates Slide-Over / Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enterprise Automation Templates</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-configured, production-ready content workflows that you can customize.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {ENTERPRISE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all space-y-3 bg-white hover:shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{tmpl.name}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {tmpl.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tmpl.description}</p>
                    </div>
                    <Link href={`/app/automations/new?template=${tmpl.id}`}>
                      <Button
                        variant="brand"
                        size="sm"
                        onClick={() => setShowTemplatesModal(false)}
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                      >
                        Use Template
                      </Button>
                    </Link>
                  </div>

                  {/* Pipeline Preview */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] pt-2 border-t border-slate-100 font-medium text-slate-500">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-mono text-[9px]">01 WHEN</span>
                      <span className="text-slate-700 truncate block">{tmpl.triggerLabel}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-mono text-[9px]">02 SOURCE</span>
                      <span className="text-slate-700 truncate block">{tmpl.sourceType}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-mono text-[9px]">03 OUTPUT</span>
                      <span className="text-slate-700 truncate block">{tmpl.outputLabel}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-mono text-[9px]">04 PROTECT</span>
                      <span className="text-slate-700 truncate block">Zero-Trust Guard</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-mono text-[9px]">05 REVIEW</span>
                      <span className="text-slate-700 truncate block">Required</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-mono text-[9px]">06 DISTRIBUTE</span>
                      <span className="text-slate-700 truncate block">LinkedIn</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowTemplatesModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Automation</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">"{deletingRule.name}"</strong>? This will permanently stop all future automatic triggers for this rule.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingRule(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Delete Automation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
