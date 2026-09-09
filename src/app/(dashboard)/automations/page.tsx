"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Workflow,
  Clock,
  ShieldCheck,
  UserCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  Share2,
  Check,
  ExternalLink,
  RefreshCw,
  Zap,
  Activity,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";
import { AutomationEvent, Automation } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";

interface WorkflowStatusInfo {
  configured?: boolean;
  reachable?: boolean;
  workflow?: {
    id?: string;
    name?: string;
    webhookUrl?: string;
  };
  stats?: {
    total?: number;
    completed?: number;
    running?: number;
    failed?: number;
  };
  [key: string]: unknown;
}

export default function AutomationsPage() {
  const { userProfile, organization } = useAuth();
  const organizationId = userProfile?.organizationId || organization?.id || "org_primary";
  const userId = userProfile?.uid || "usr_admin_default";

  const [activeTab, setActiveTab] = useState<"BUILDER" | "EXECUTIONS">("BUILDER");

  // Rules state (Phase 10)
  const [rules, setRules] = useState<Automation[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Builder form fields
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [triggerType, setTriggerType] = useState<
    "NEWS_TOPIC_ALERT" | "NEW_SOURCE_UPLOADED" | "WHATSAPP_MESSAGE" | "SCHEDULE" | "WEBHOOK"
  >("NEWS_TOPIC_ALERT");
  const [conditionField, setConditionField] = useState("category");
  const [conditionOperator, setConditionOperator] = useState<"EQUALS" | "CONTAINS" | "GREATER_THAN">("EQUALS");
  const [conditionValue, setConditionValue] = useState("CYBERSECURITY");
  const [actionType, setActionType] = useState<
    "TRIGGER_N8N" | "GENERATE_TRANSFORMATION" | "NOTIFY_WHATSAPP" | "RUN_SECURITY_VALIDATION"
  >("TRIGGER_N8N");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [securityCheckRequired, setSecurityCheckRequired] = useState(true);
  const [deliveryTargets, setDeliveryTargets] = useState<string[]>(["LINKEDIN", "WHATSAPP"]);
  const [savingRule, setSavingRule] = useState(false);

  // Executions state (Phase 7 n8n integration)
  const [workflowInfo, setWorkflowInfo] = useState<WorkflowStatusInfo | null>(null);
  const [executions, setExecutions] = useState<AutomationEvent[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(true);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [triggerContentId, setTriggerContentId] = useState("cnt_sample_enterprise_advisory");
  const [triggerChannel, setTriggerChannel] = useState("linkedin");
  const [triggering, setTriggering] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch automation rules
  const fetchRules = useCallback(async () => {
    try {
      setRulesLoading(true);
      const res = await fetch(`/api/automation/rules?organizationId=${organizationId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.rules)) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error("Error fetching rules:", err);
    } finally {
      setRulesLoading(false);
    }
  }, [organizationId]);

  // Fetch n8n status & execution events
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/automation/status", {
        headers: { "x-organization-id": organizationId },
      });
      const data = await res.json();
      if (data.success) {
        setWorkflowInfo(data);
      }
    } catch (err) {
      console.error("Error fetching automation status:", err);
    }
  }, [organizationId]);

  const fetchExecutions = useCallback(async () => {
    try {
      setExecutionsLoading(true);
      const res = await fetch("/api/automation/executions", {
        headers: { "x-organization-id": organizationId },
      });
      const data = await res.json();
      if (data.success && data.executions) {
        setExecutions(data.executions);
      }
    } catch (err) {
      console.error("Error fetching executions:", err);
    } finally {
      setExecutionsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchRules();
    fetchStatus();
    fetchExecutions();
  }, [fetchRules, fetchStatus, fetchExecutions]);

  // Toggle rule enable/disable
  const handleToggleRule = async (rule: Automation) => {
    try {
      const newEnabled = !rule.enabled;
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: newEnabled } : r))
      );
      await fetch(`/api/automation/rules/${rule.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
    } catch (err) {
      console.error("Error toggling rule:", err);
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      await fetch(`/api/automation/rules/${ruleId}?organizationId=${organizationId}`, {
        method: "DELETE",
      });
      setActionFeedback("Automation rule deleted successfully.");
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      console.error("Error deleting rule:", err);
    }
  };

  // Run rule manually
  const handleRunRule = async (rule: Automation) => {
    try {
      const res = await fetch(`/api/automation/rules/${rule.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId,
          contentId: "cnt_sample_enterprise_advisory",
          category: "CYBERSECURITY",
          relevanceScore: 92,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Rule '${rule.name}' executed successfully.`);
        await fetchRules();
        await fetchExecutions();
      } else {
        alert(data.reason || "Rule execution did not trigger.");
      }
    } catch (err) {
      alert("Failed to run automation rule.");
    } finally {
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Save rule (Create or Edit)
  const handleSaveRule = async () => {
    if (!ruleName.trim()) return;
    try {
      setSavingRule(true);
      const payload = {
        name: ruleName.trim(),
        description: ruleDescription.trim(),
        organizationId,
        userId,
        enabled: true,
        trigger: {
          type: triggerType,
          config: { schedule: "*/15 * * * *" },
        },
        conditions: [
          {
            field: conditionField,
            operator: conditionOperator,
            value: conditionValue,
          },
        ],
        aiAction: {
          actionType,
          params: { targetFormat: "LINKEDIN_POST", tone: "PROFESSIONAL" },
        },
        securityCheckRequired,
        approvalRequired,
        deliveryTarget: deliveryTargets as any,
      };

      if (editingRuleId) {
        await fetch(`/api/automation/rules/${editingRuleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/automation/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setIsBuilderModalOpen(false);
      setEditingRuleId(null);
      setRuleName("");
      setRuleDescription("");
      setActionFeedback("Automation rule saved successfully!");
      await fetchRules();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error("Error saving rule:", err);
    } finally {
      setSavingRule(false);
    }
  };

  const openCreateModal = () => {
    setEditingRuleId(null);
    setRuleName("");
    setRuleDescription("");
    setTriggerType("NEWS_TOPIC_ALERT");
    setConditionField("category");
    setConditionOperator("EQUALS");
    setConditionValue("CYBERSECURITY");
    setActionType("TRIGGER_N8N");
    setApprovalRequired(true);
    setSecurityCheckRequired(true);
    setDeliveryTargets(["LINKEDIN", "WHATSAPP"]);
    setIsBuilderModalOpen(true);
  };

  const openEditModal = (rule: Automation) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleDescription(rule.description || "");
    setTriggerType(rule.trigger?.type as any || "NEWS_TOPIC_ALERT");
    if (rule.conditions && rule.conditions[0]) {
      setConditionField(rule.conditions[0].field);
      setConditionOperator(rule.conditions[0].operator as any);
      setConditionValue(rule.conditions[0].value);
    }
    setActionType(rule.aiAction?.actionType as any || "TRIGGER_N8N");
    setApprovalRequired(rule.approvalRequired ?? true);
    setSecurityCheckRequired(rule.securityCheckRequired ?? true);
    setDeliveryTargets((rule.deliveryTarget as any) || ["LINKEDIN"]);
    setIsBuilderModalOpen(true);
  };

  const handleManualTrigger = async () => {
    if (!triggerContentId.trim()) return;
    try {
      setTriggering(true);
      await fetch(`/api/automation/executions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: triggerContentId.trim(),
          channel: triggerChannel,
        }),
      });

      await fetch(`/api/approvals/appr_sample_trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: triggerContentId.trim(),
          status: "APPROVED",
          reviewerId: "admin_user",
          reviewerName: "Compliance Lead",
          comments: "Manual trigger test for Phase 7/10 integration",
        }),
      });

      setActionFeedback(`Content "${triggerContentId}" approved and dispatched to n8n Cloud webhook!`);
      setIsTriggerModalOpen(false);
      await fetchExecutions();
      await fetchStatus();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: unknown) {
      alert("Trigger failed.");
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success" dot size="sm">COMPLETED</Badge>;
      case "RUNNING":
      case "TRIGGERED":
        return <Badge variant="info" dot size="sm">IN PROGRESS</Badge>;
      case "FAILED":
        return <Badge variant="danger" dot size="sm">FAILED</Badge>;
      case "BLOCKED":
        return <Badge variant="warning" dot size="sm">BLOCKED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Workflow className="w-3.5 h-3.5" />
              Automation Engine
            </span>
            <span className="text-xs text-slate-400">• Phase 10 Builder &amp; Orchestration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Enterprise Automation Builder
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Configure automated multi-step pipelines: Trigger → Conditions → AI Action → Human Approval → n8n Multi-Channel Distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              fetchRules();
              fetchStatus();
              fetchExecutions();
            }}
            leftIcon={<RefreshCw className={`w-4 h-4 ${executionsLoading || rulesLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          {activeTab === "BUILDER" ? (
            <Button
              variant="primary"
              size="md"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Automation
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsTriggerModalOpen(true)}
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Test n8n Trigger
            </Button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("BUILDER")}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "BUILDER"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Automation Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("EXECUTIONS")}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "EXECUTIONS"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Activity className="w-4 h-4" />
          Execution Stream &amp; n8n Cloud ({executions.length})
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AUTOMATION BUILDER RULES LIST                                  */}
      {/* ===================================================================== */}
      {activeTab === "BUILDER" && (
        <div className="space-y-4">
          {rulesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-xl border border-slate-200 bg-white animate-pulse space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : rules.length === 0 ? (
            <EmptyState
              icon={Workflow}
              title="No automation rules configured"
              description="Automate repetitive intelligence tasks: ingest news, generate executive briefings, require compliance approvals, and dispatch to n8n."
              actionLabel="Create Your First Automation"
              onAction={openCreateModal}
            />
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`border transition-all ${
                    rule.enabled ? "border-slate-200 bg-white" : "border-slate-200/60 bg-slate-50/50 opacity-75"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                        <Badge variant={rule.enabled ? "success" : "neutral"} size="sm">
                          {rule.enabled ? "ACTIVE" : "DISABLED"}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          • {rule.executionCount || 0} run(s)
                        </span>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{rule.description}</p>
                      )}

                      {/* Visual Pipeline Flow */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                          Trigger: {(rule.trigger?.type || "MANUAL").replace(/_/g, " ")}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />

                        {rule.conditions && rule.conditions.length > 0 && (
                          <>
                            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                              If {rule.conditions[0].field} {rule.conditions[0].operator} &quot;{rule.conditions[0].value}&quot;
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </>
                        )}

                        <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-medium">
                          Action: {(rule.aiAction?.actionType || "EXECUTE").replace(/_/g, " ")}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />

                        <span
                          className={`px-2 py-0.5 rounded font-medium border ${
                            rule.approvalRequired
                              ? "bg-rose-50 border-rose-200 text-rose-800"
                              : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          {rule.approvalRequired ? "Human Sign-off Required" : "Direct Auto-Publish"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />

                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                          Target: {rule.deliveryTarget?.join(", ") || "n8n"}
                        </span>
                      </div>
                    </div>

                    {/* Rule Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleRunRule(rule)}
                        title="Execute rule immediately with test context"
                        leftIcon={<Play className="w-3 h-3 text-blue-600" />}
                      >
                        Run Now
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleToggleRule(rule)}
                        className={rule.enabled ? "text-slate-600" : "text-emerald-600"}
                      >
                        {rule.enabled ? "Disable" : "Enable"}
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => openEditModal(rule)}
                        title="Edit rule"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-rose-600 hover:text-rose-700"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIVE EXECUTION STREAM & n8n STATUS                             */}
      {/* ===================================================================== */}
      {activeTab === "EXECUTIONS" && (
        <div className="space-y-6">
          {/* n8n Cloud Active Workflow Status Card */}
          <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-slate-50">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <CardTitle className="text-base font-bold text-slate-900">
                    {workflowInfo?.workflow?.name || "NEXUS — Approved Content Orchestration"}
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Active Cloud Orchestrator • ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">{workflowInfo?.workflow?.id || "uunidN8XWaIcA5xY"}</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="verified" dot size="sm">
                  CONNECTED (Cloud Webhook)
                </Badge>
                <a
                  href="https://shahrukh24.app.n8n.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 transition text-xs inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open n8n</span>
                </a>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] text-slate-400 font-medium">Total Orchestrations</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {workflowInfo?.stats?.total || executions.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] text-slate-400 font-medium">Completed / Ready</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">
                    {workflowInfo?.stats?.completed ?? executions.filter((e) => e.status === "COMPLETED").length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] text-slate-400 font-medium">In Progress</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">
                    {workflowInfo?.stats?.running ?? executions.filter((e) => e.status === "TRIGGERED" || e.status === "RUNNING").length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] text-slate-400 font-medium">Policy Failures</div>
                  <div className="text-lg font-bold text-rose-600 mt-0.5">
                    {workflowInfo?.stats?.failed ?? executions.filter((e) => e.status === "FAILED").length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executions Table */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live Execution History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {executionsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading execution records...</div>
              ) : executions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No automation events recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {executions.map((event) => (
                    <div key={event.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{event.workflowName || event.eventType}</span>
                          {getStatusBadge(event.status)}
                          <span className="font-mono text-[11px] text-slate-400">{event.id}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Resource: <code className="text-slate-700">{event.resourceId}</code> • Channel: <span className="font-medium text-slate-700">{event.channel || "linkedin"}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 shrink-0">
                        {formatRelativeTime(event.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Visual Automation Builder (Create / Edit)                       */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        title={editingRuleId ? "Edit Automation Rule" : "Create Enterprise Automation Pipeline"}
        description="Configure event triggers, conditional filtering, AI actions, and multi-channel delivery."
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Automation Pipeline Name"
            placeholder="e.g. Critical CVE Ingestion -> LinkedIn Briefing"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
          />

          <Input
            label="Description (Optional)"
            placeholder="e.g. Monitors CISA zero-day alerts and generates executive briefing for review."
            value={ruleDescription}
            onChange={(e) => setRuleDescription(e.target.value)}
          />

          {/* Trigger */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">1. Trigger Event:</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="NEWS_TOPIC_ALERT">News Topic Alert (CISA/NIST/Google News Ingestion)</option>
              <option value="NEW_SOURCE_UPLOADED">New Threat Source Ingested (Document/PDF/Advisory)</option>
              <option value="WHATSAPP_MESSAGE">WhatsApp Conversational Command Received</option>
              <option value="SCHEDULE">Periodic Schedule (Cron / Hourly Interval)</option>
              <option value="WEBHOOK">External Webhook Callback</option>
            </select>
          </div>

          {/* Conditions */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="font-semibold text-slate-700">2. Conditional Filter:</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={conditionField}
                onChange={(e) => setConditionField(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              >
                <option value="category">Category</option>
                <option value="relevanceScore">Relevance Score</option>
                <option value="channel">Channel</option>
              </select>

              <select
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              >
                <option value="EQUALS">EQUALS</option>
                <option value="CONTAINS">CONTAINS</option>
                <option value="GREATER_THAN">GREATER THAN</option>
              </select>

              <input
                type="text"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="Value"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Action */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">3. Action to Execute:</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="TRIGGER_N8N">Dispatch Approved Content to n8n Cloud Orchestrator</option>
              <option value="GENERATE_TRANSFORMATION">AI Transform into Publication Artefact</option>
              <option value="NOTIFY_WHATSAPP">Send Alert to Executive WhatsApp Group</option>
              <option value="RUN_SECURITY_VALIDATION">Deep Security Scan &amp; Vulnerability Check</option>
            </select>
          </div>

          {/* Governance Flags */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-700">4. Governance &amp; Security Controls:</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800">Require Human Compliance Sign-off (Mandatory Human-in-the-Loop)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityCheckRequired}
                  onChange={(e) => setSecurityCheckRequired(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800">Automated DLP &amp; Credential Scan Verification</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsBuilderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRule} disabled={savingRule || !ruleName.trim()}>
              {savingRule ? "Saving..." : editingRuleId ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Test n8n Trigger */}
      <Modal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        title="Test n8n Orchestration Trigger"
        description="Emulates approved content transition to dispatch a signed webhook payload to n8n Cloud."
      >
        <div className="space-y-4">
          <Input
            label="Content ID"
            placeholder="e.g. cnt_sample_enterprise_advisory"
            value={triggerContentId}
            onChange={(e) => setTriggerContentId(e.target.value)}
            required
          />

          <Select
            label="Target Channel"
            value={triggerChannel}
            onChange={(e) => setTriggerChannel(e.target.value)}
            options={[
              { value: "linkedin", label: "LinkedIn" },
              { value: "x", label: "X (Twitter)" },
              { value: "whatsapp", label: "WhatsApp" },
            ]}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsTriggerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualTrigger}
              disabled={triggering || !triggerContentId.trim()}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              {triggering ? "Dispatching..." : "Dispatch to n8n Webhook"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
