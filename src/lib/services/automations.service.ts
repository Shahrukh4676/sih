// ==============================================================================
// NEXUS AI - Phase 10: Real Automation Builder & Execution Service
// ==============================================================================

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Automation, AutomationCondition, AutomationEvent } from "@/types";
import { cleanForFirestore, normalizeFirestoreData } from "../firebase/firestore-utils";
import { logAuditEvent } from "./audit.service";
import { AutomationService } from "./automation.service";

export const AUTOMATIONS_COLLECTION = "automations";

// In-memory cache for fast lookups and network resilience
const automationsMemoryCache = new Map<string, Automation>();

export class AutomationsManager {
  /**
   * Retrieves all automations belonging to an organization
   */
  public static async getAutomationsByOrg(organizationId: string): Promise<Automation[]> {
    if (!organizationId) return [];

    const cached: Automation[] = [];
    for (const a of automationsMemoryCache.values()) {
      if (a.organizationId === organizationId) {
        cached.push(a);
      }
    }

    try {
      const q = query(
        collection(db, AUTOMATIONS_COLLECTION),
        where("organizationId", "==", organizationId)
      );
      const snap = await getDocs(q);
      const dbItems: Automation[] = [];

      for (const d of snap.docs) {
        const item = normalizeFirestoreData({ id: d.id, ...d.data() }) as Automation;
        automationsMemoryCache.set(item.id, item);
        dbItems.push(item);
      }

      if (dbItems.length > 0) {
        return dbItems.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      }
    } catch (err) {
      console.warn("[AutomationsManager] Firestore read notice:", err);
    }

    // Return cached items if Firestore was empty or offline
    return cached.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  /**
   * Retrieves single automation rule by ID
   */
  public static async getAutomationById(id: string): Promise<Automation | null> {
    if (automationsMemoryCache.has(id)) {
      return automationsMemoryCache.get(id)!;
    }

    try {
      const d = await getDoc(doc(db, AUTOMATIONS_COLLECTION, id));
      if (d.exists()) {
        const item = normalizeFirestoreData({ id: d.id, ...d.data() }) as Automation;
        automationsMemoryCache.set(item.id, item);
        return item;
      }
    } catch (err) {
      console.warn("[AutomationsManager] Could not get automation by ID:", err);
    }

    return null;
  }

  /**
   * Creates a new automation rule with triggers, conditions, action, and delivery targets
   */
  public static async createAutomation(
    data: Omit<Automation, "id" | "createdAt" | "updatedAt" | "executionCount">
  ): Promise<Automation | null> {
    try {
      const id = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const automationObj: Automation = {
        ...data,
        id,
        executionCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      automationsMemoryCache.set(id, automationObj);

      const ref = doc(db, AUTOMATIONS_COLLECTION, id);
      const payload = cleanForFirestore({
        ...automationObj,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(ref, payload);

      await logAuditEvent({
        organizationId: data.organizationId,
        userId: data.userId || "usr_admin",
        userEmail: "admin@nexus.ai",
        userRole: "ADMIN",
        action: "AUTOMATION_CREATED",
        resourceType: "AUTOMATION",
        resourceId: id,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase10",
        details: { name: data.name, triggerType: data.trigger.type },
      });

      return automationObj;
    } catch (err) {
      console.error("[AutomationsManager] Error creating automation:", err);
      return null;
    }
  }

  /**
   * Updates an existing automation rule
   */
  public static async updateAutomation(
    id: string,
    updates: Partial<Omit<Automation, "id" | "organizationId" | "createdAt">>
  ): Promise<Automation | null> {
    const existing = await this.getAutomationById(id);
    if (!existing) return null;

    const updatedObj: Automation = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    automationsMemoryCache.set(id, updatedObj);

    try {
      const ref = doc(db, AUTOMATIONS_COLLECTION, id);
      await updateDoc(ref, cleanForFirestore({
        ...updates,
        updatedAt: serverTimestamp(),
      }));

      await logAuditEvent({
        organizationId: existing.organizationId,
        userId: updates.userId || existing.userId || "usr_admin",
        userEmail: "admin@nexus.ai",
        userRole: "ADMIN",
        action: "AUTOMATION_UPDATED",
        resourceType: "AUTOMATION",
        resourceId: id,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase10",
        details: { name: updatedObj.name },
      });
    } catch (err) {
      console.warn("[AutomationsManager] Error updating Firestore automation:", err);
    }

    return updatedObj;
  }

  /**
   * Toggles enabled/disabled status of an automation
   */
  public static async toggleEnabled(id: string, enabled: boolean): Promise<boolean> {
    const existing = await this.getAutomationById(id);
    if (!existing) return false;

    existing.enabled = enabled;
    existing.updatedAt = new Date().toISOString();
    automationsMemoryCache.set(id, existing);

    try {
      const ref = doc(db, AUTOMATIONS_COLLECTION, id);
      await updateDoc(ref, {
        enabled,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.warn("[AutomationsManager] Toggle error:", err);
      return false;
    }
  }

  /**
   * Deletes an automation rule
   */
  public static async deleteAutomation(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.getAutomationById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return false;
    }

    automationsMemoryCache.delete(id);

    try {
      await deleteDoc(doc(db, AUTOMATIONS_COLLECTION, id));
      await logAuditEvent({
        organizationId,
        userId: existing.userId || "usr_admin",
        userEmail: "admin@nexus.ai",
        userRole: "ADMIN",
        action: "AUTOMATION_DELETED",
        resourceType: "AUTOMATION",
        resourceId: id,
        severity: "INFO",
        ipAddress: "127.0.0.1",
        userAgent: "NEXUS-Engine/Phase10",
        details: { name: existing.name },
      });
      return true;
    } catch (err) {
      console.warn("[AutomationsManager] Delete error:", err);
      return false;
    }
  }

  /**
   * Evaluates conditions for an automation rule against event context
   */
  public static evaluateConditions(
    conditions: AutomationCondition[],
    context: Record<string, unknown>
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const c of conditions) {
      const actualVal = String(context[c.field] ?? "").toLowerCase();
      const targetVal = String(c.value ?? "").toLowerCase();

      switch (c.operator) {
        case "EQUALS":
          if (actualVal !== targetVal) return false;
          break;
        case "CONTAINS":
          if (!actualVal.includes(targetVal)) return false;
          break;
        case "GREATER_THAN":
          if (parseFloat(actualVal) <= parseFloat(targetVal)) return false;
          break;
        case "MATCHES_REGEX":
          try {
            const regex = new RegExp(c.value, "i");
            if (!regex.test(actualVal)) return false;
          } catch {
            return false;
          }
          break;
        default:
          break;
      }
    }

    return true;
  }

  /**
   * Executes an automation rule when its trigger condition is satisfied
   */
  public static async executeRule(
    ruleId: string,
    eventContext: {
      contentId?: string;
      organizationId: string;
      userId: string;
      channel?: string;
      title?: string;
      category?: string;
      relevanceScore?: number;
      [key: string]: unknown;
    }
  ): Promise<{
    executed: boolean;
    reason?: string;
    actionResult?: unknown;
    automationEvent?: AutomationEvent;
  }> {
    const rule = await this.getAutomationById(ruleId);
    if (!rule) {
      return { executed: false, reason: `Automation rule ${ruleId} not found` };
    }

    if (!rule.enabled) {
      return { executed: false, reason: `Automation rule '${rule.name}' is currently disabled` };
    }

    // 1. Evaluate filter conditions
    const matched = this.evaluateConditions(rule.conditions, eventContext);
    if (!matched) {
      return { executed: false, reason: "Context did not meet rule filtering conditions" };
    }

    // 2. Increment execution count
    rule.executionCount = (rule.executionCount || 0) + 1;
    rule.lastExecutedAt = new Date().toISOString();
    automationsMemoryCache.set(rule.id, rule);

    try {
      await updateDoc(doc(db, AUTOMATIONS_COLLECTION, rule.id), {
        executionCount: rule.executionCount,
        lastExecutedAt: serverTimestamp(),
      });
    } catch {}

    // 3. Execute Action
    let automationEvent: AutomationEvent | undefined;
    const actionType = rule.aiAction.actionType;

    if (actionType === "TRIGGER_N8N" && eventContext.contentId) {
      const channel = eventContext.channel || (rule.deliveryTarget[0]?.toLowerCase()) || "linkedin";
      const triggerResult = await AutomationService.triggerApprovedContentWorkflow({
        contentId: eventContext.contentId,
        organizationId: eventContext.organizationId,
        userId: eventContext.userId,
        channel,
      });
      automationEvent = triggerResult.event;
    }

    await logAuditEvent({
      organizationId: eventContext.organizationId,
      userId: eventContext.userId,
      userEmail: "admin@nexus.ai",
      userRole: "ADMIN",
      action: "AUTOMATION_EXECUTED",
      resourceType: "AUTOMATION",
      resourceId: rule.id,
      severity: "INFO",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/Phase10",
      details: {
        ruleName: rule.name,
        actionType,
        eventId: automationEvent?.id,
      },
    });

    return {
      executed: true,
      actionResult: {
        ruleId: rule.id,
        ruleName: rule.name,
        actionType,
        deliveryTargets: rule.deliveryTarget,
        approvalsRequired: rule.approvalRequired,
      },
      automationEvent,
    };
  }
}

// Backward-compatible module exports
export const getAutomationsByOrg = AutomationsManager.getAutomationsByOrg.bind(AutomationsManager);
export const toggleAutomationEnabled = AutomationsManager.toggleEnabled.bind(AutomationsManager);
export const createAutomationRule = AutomationsManager.createAutomation.bind(AutomationsManager);
