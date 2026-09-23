"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Automation,
  AutomationEvent,
  AutomationCondition,
  AutomationHealthData,
  ContentLineageNode,
  AutomationDefinitionVersion,
} from "@/types";

export interface CreateAutomationInput {
  name: string;
  description?: string;
  organizationId?: string;
  userId?: string;
  enabled?: boolean;
  trigger: {
    type: "SCHEDULE" | "NEW_SOURCE_UPLOADED" | "NEWS_TOPIC_ALERT" | "DIGEST" | "WEBHOOK" | "WHATSAPP_MESSAGE";
    config?: Record<string, unknown>;
  };
  conditions?: AutomationCondition[];
  aiAction: {
    actionType: "GENERATE_TRANSFORMATION" | "RUN_SECURITY_VALIDATION" | "SUBMIT_FOR_APPROVAL" | "NOTIFY_WHATSAPP" | "TRIGGER_N8N";
    params?: Record<string, unknown>;
  };
  securityCheckRequired?: boolean;
  approvalRequired?: boolean;
  deliveryTarget?: ("LINKEDIN" | "X_TWITTER" | "WHATSAPP" | "SLACK" | "EMAIL")[];
}

export interface InterpretedWorkflow {
  name: string;
  description: string;
  triggerType: "NEW_SOURCE_UPLOADED" | "SCHEDULE" | "NEWS_TOPIC_ALERT";
  triggerLabel: string;
  triggerDetails: string;
  sourceType: "PDF" | "URL" | "TEXT" | "ALL";
  sourceLabel: string;
  outputFormat: string;
  outputLabel: string;
  tone: string;
  targetAudience: string;
  approvalRequired: boolean;
  deliveryTarget: ("LINKEDIN" | "X_TWITTER" | "WHATSAPP" | "SLACK" | "EMAIL")[];
  securityCheckRequired: boolean;
  conditions: AutomationCondition[];
  visualPipeline: Array<{ stage: string; title: string; description: string }>;
  summary: string;
}

export function formatTriggerDisplay(trigger?: { type?: string; config?: Record<string, unknown> }): string {
  if (!trigger?.type) return "On demand";
  switch (trigger.type) {
    case "NEW_SOURCE_UPLOADED": {
      const mime = (trigger.config?.mimeType as string) || "";
      if (mime.includes("pdf")) return "When a research paper or PDF is uploaded";
      if (mime.includes("url")) return "When a webpage URL is added";
      return "When new content is uploaded";
    }
    case "SCHEDULE": {
      const cron = (trigger.config?.cron as string) || "";
      if (cron.includes("1-5")) return "Every weekday at 9:00 AM";
      if (cron.includes("* * 1")) return "Every Monday at 9:00 AM";
      return "On scheduled frequency";
    }
    case "NEWS_TOPIC_ALERT": {
      const topic = (trigger.config?.topic as string) || "";
      if (topic.includes("CYBER")) return "When a security advisory is detected";
      return "When news intelligence alert arrives";
    }
    case "WHATSAPP_MESSAGE":
      return "When mobile dispatch is approved";
    default:
      return "When content is received";
  }
}

export function formatOutputDisplay(aiAction?: { actionType?: string; params?: Record<string, unknown> }): string {
  const format = (aiAction?.params?.format as string) || "";
  switch (format) {
    case "LINKEDIN_POST":
      return "LinkedIn post";
    case "EXECUTIVE_SUMMARY":
      return "Executive summary";
    case "CYBERSECURITY_ADVISORY":
      return "Security bulletin & LinkedIn post";
    case "PRESENTATION":
      return "Presentation outline";
    case "X_THREAD":
      return "Executive briefing & thread";
    default:
      return "Content transformation";
  }
}

export function formatRelativeTime(dateInput?: string | number | null): string {
  if (!dateInput) return "No runs yet";
  try {
    const timestamp = typeof dateInput === "number" ? dateInput : new Date(dateInput).getTime();
    if (isNaN(timestamp) || timestamp <= 0) return "No runs yet";
    const now = Date.now();
    const diffSecs = Math.floor((now - timestamp) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "No runs yet";
  }
}

export function formatNextRunDisplay(rule: Automation): string {
  if (!rule.enabled) return "Automation paused";
  if (rule.trigger?.type === "SCHEDULE") {
    return "Tomorrow at 9:00 AM";
  }
  if (rule.trigger?.type === "NEW_SOURCE_UPLOADED") {
    return "Waiting for next upload";
  }
  if (rule.trigger?.type === "NEWS_TOPIC_ALERT") {
    return "Listening for verified advisories";
  }
  return "Active";
}

/**
 * Custom hook to manage the collection of automations and their executions
 */
export function useAutomations(organizationId: string = "org_primary") {
  const [rules, setRules] = useState<Automation[]>([]);
  const [executions, setExecutions] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, execRes] = await Promise.all([
        fetch(`/api/automation/rules?organizationId=${organizationId}`),
        fetch(`/api/automation/executions?organizationId=${organizationId}&limit=50`),
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      }

      if (execRes.ok) {
        const execData = await execRes.json();
        setExecutions(execData.executions || []);
      }
    } catch (err: any) {
      console.error("[useAutomations] Fetch error:", err);
      setError("Unable to load automations. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleRule = async (id: string, nextState: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled: nextState } : r))
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const runRule = async (id: string, context?: Record<string, unknown>): Promise<{ success: boolean; event?: AutomationEvent; message?: string }> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId: "usr_creator",
          ...context,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Optimistically update rule execution count & last executed
        setRules((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  executionCount: (r.executionCount || 0) + 1,
                  lastExecutedAt: new Date().toISOString(),
                }
              : r
          )
        );
        if (data.automationEvent) {
          setExecutions((prev) => [data.automationEvent, ...prev]);
        }
        return { success: true, event: data.automationEvent, message: "Automation workflow executed" };
      }
      return { success: false, message: data.reason || data.error || "Execution could not be completed" };
    } catch {
      return { success: false, message: "Network connection error while running automation" };
    }
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}?organizationId=${organizationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const duplicateRule = async (rule: Automation): Promise<Automation | null> => {
    try {
      const copyPayload = {
        name: `${rule.name} (Copy)`,
        description: rule.description,
        organizationId,
        userId: rule.userId || "usr_creator",
        enabled: false,
        trigger: rule.trigger,
        conditions: rule.conditions || [],
        aiAction: rule.aiAction,
        securityCheckRequired: rule.securityCheckRequired !== false,
        approvalRequired: rule.approvalRequired !== false,
        deliveryTarget: rule.deliveryTarget || ["LINKEDIN"],
      };

      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyPayload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rule) {
          setRules((prev) => [data.rule, ...prev]);
          return data.rule;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  return {
    rules,
    executions,
    loading,
    error,
    refresh: fetchAll,
    toggleRule,
    runRule,
    deleteRule,
    duplicateRule,
  };
}

/**
 * Custom hook to manage a single automation and its history
 */
export function useAutomation(id: string, organizationId: string = "org_primary") {
  const [rule, setRule] = useState<Automation | null>(null);
  const [executions, setExecutions] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuleAndRuns = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ruleRes, execRes] = await Promise.all([
        fetch(`/api/automation/rules/${id}`),
        fetch(`/api/automation/executions?organizationId=${organizationId}&limit=50`),
      ]);

      if (ruleRes.ok) {
        const ruleData = await ruleRes.json();
        setRule(ruleData.rule || null);
      } else {
        setError("Automation not found or inaccessible.");
      }

      if (execRes.ok) {
        const execData = await execRes.json();
        const allExecs: AutomationEvent[] = execData.executions || [];
        // Filter executions for this specific rule, or show org executions
        const filtered = allExecs.filter(
          (e) => e.resourceId === id || e.workflowName === rule?.name
        );
        setExecutions(filtered.length > 0 ? filtered : allExecs.slice(0, 10));
      }
    } catch (err) {
      console.error("[useAutomation] Fetch error:", err);
      setError("Unable to load automation details.");
    } finally {
      setLoading(false);
    }
  }, [id, organizationId, rule?.name]);

  useEffect(() => {
    fetchRuleAndRuns();
  }, [id, organizationId]);

  const toggle = async (nextState: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        setRule((prev) => (prev ? { ...prev, enabled: nextState } : prev));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const run = async (context?: Record<string, unknown>): Promise<{ success: boolean; event?: AutomationEvent; message?: string }> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId: "usr_creator",
          ...context,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRule((prev) =>
          prev
            ? {
                ...prev,
                executionCount: (prev.executionCount || 0) + 1,
                lastExecutedAt: new Date().toISOString(),
              }
            : prev
        );
        if (data.automationEvent) {
          setExecutions((prev) => [data.automationEvent, ...prev]);
        }
        return { success: true, event: data.automationEvent, message: "Automation workflow executed" };
      }
      return { success: false, message: data.reason || data.error || "Execution failed" };
    } catch {
      return { success: false, message: "Network connection error while running automation" };
    }
  };

  const update = async (updates: Partial<Automation>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rule) {
          setRule(data.rule);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const simulate = async (context?: Record<string, unknown>): Promise<{ success: boolean; event?: AutomationEvent; message?: string }> => {
    try {
      const res = await fetch(`/api/automation/rules/${id}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId: "usr_creator",
          ...context,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.event) {
          setExecutions((prev) => [data.event, ...prev]);
        }
        return { success: true, event: data.event, message: "Dry-run simulation completed." };
      }
      return { success: false, message: data.error || "Simulation failed" };
    } catch {
      return { success: false, message: "Connection error during simulation" };
    }
  };

  const cancelRun = async (eventId: string, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/automation/executions/${eventId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, reason }),
      });
      if (res.ok) {
        setExecutions((prev) =>
          prev.map((e) =>
            e.id === eventId || e.eventId === eventId
              ? { ...e, status: "BLOCKED", error: reason || "Cancelled" }
              : e
          )
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    rule,
    executions,
    loading,
    error,
    refresh: fetchRuleAndRuns,
    toggle,
    run,
    simulate,
    cancelRun,
    update,
  };
}

/**
 * Hook to retrieve 30-day rolling health score and proactive recommendations
 */
export function useAutomationHealth(automationId: string, organizationId: string = "org_primary") {
  const [health, setHealth] = useState<AutomationHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    if (!automationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/automation/rules/${automationId}/health?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data.health || null);
      }
    } catch {
      // Retain graceful fallback
    } finally {
      setLoading(false);
    }
  }, [automationId, organizationId]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { health, loading, refresh: fetchHealth };
}

/**
 * Hook to retrieve backwards content lineage audit trail
 */
export function useAutomationLineage(automationId: string, eventId?: string) {
  const [lineage, setLineage] = useState<ContentLineageNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLineage = useCallback(async () => {
    if (!automationId) return;
    setLoading(true);
    try {
      const url = eventId
        ? `/api/automation/rules/${automationId}/lineage?eventId=${eventId}`
        : `/api/automation/rules/${automationId}/lineage`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLineage(data.lineage || []);
      }
    } catch {
      // Retain fallback
    } finally {
      setLoading(false);
    }
  }, [automationId, eventId]);

  useEffect(() => {
    fetchLineage();
  }, [fetchLineage]);

  return { lineage, loading, refresh: fetchLineage };
}

/**
 * Hook to retrieve immutable version history
 */
export function useAutomationVersions(automationId: string) {
  const [versions, setVersions] = useState<AutomationDefinitionVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    if (!automationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/automation/rules/${automationId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [automationId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const rollback = async (targetVersion: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/automation/rules/${automationId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion }),
      });
      if (res.ok) {
        fetchVersions();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return { versions, loading, rollback, refresh: fetchVersions };
}

/**
 * Service function to create a new automation rule
 */
export async function createAutomationRule(input: CreateAutomationInput): Promise<{ success: boolean; rule?: Automation; error?: string }> {
  try {
    const res = await fetch("/api/automation/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        organizationId: input.organizationId || "org_primary",
        userId: input.userId || "usr_creator",
        enabled: input.enabled !== false,
        securityCheckRequired: input.securityCheckRequired !== false,
        approvalRequired: input.approvalRequired !== false,
        deliveryTarget: input.deliveryTarget || ["LINKEDIN"],
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, rule: data.rule };
    }
    return { success: false, error: data.error || "Failed to create automation" };
  } catch (err: any) {
    return { success: false, error: "Network error while saving automation" };
  }
}

/**
 * Service function to interpret natural language description using Prompt Intelligence
 */
export async function interpretAutomationPrompt(prompt: string): Promise<{ success: boolean; interpreted?: InterpretedWorkflow; error?: string }> {
  try {
    const res = await fetch("/api/automation/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, interpreted: data.interpreted };
    }
    return { success: false, error: data.error || "Unable to interpret description." };
  } catch {
    return { success: false, error: "Connection error while interpreting workflow." };
  }
}

/**
 * Service function to execute a dry-run simulation
 */
export async function simulateAutomationRule(
  ruleId: string,
  context?: { organizationId?: string; sourceTitle?: string }
): Promise<{ success: boolean; event?: AutomationEvent; error?: string }> {
  try {
    const res = await fetch(`/api/automation/rules/${ruleId}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context || {}),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, event: data.event };
    }
    return { success: false, error: data.error || "Simulation failed" };
  } catch {
    return { success: false, error: "Connection error during simulation" };
  }
}

/**
 * Service function to publish an automation as an enterprise template
 */
export async function publishAutomationAsTemplate(
  ruleId: string,
  organizationId: string = "org_primary"
): Promise<boolean> {
  try {
    const res = await fetch(`/api/automation/rules/${ruleId}/template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
