// ==============================================================================
// NEXUS AI - Automation & Event Orchestration Service (Phase 7)
// ==============================================================================
// Manages the complete lifecycle of automation events between NEXUS AI and n8n:
// Approval -> Idempotency Check -> Event Persistence (QUEUED/TRIGGERED)
//          -> n8n Cloud Webhook Dispatch -> Asynchronous Callback Processing
//          -> Audit Logging & UI State Reflection
// ==============================================================================

import "server-only";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { AutomationEvent, AutomationEventStatus } from "@/types";
import { getN8nClient, ApprovedContentTriggerPayload } from "../automation/n8n-client";
import { getContentById } from "./content.service";
import { logAuditEvent } from "./audit.service";
import { cleanForFirestore } from "../firebase/firestore-utils";

export const AUTOMATION_EVENTS_COLLECTION = "automationEvents";

// Resilient memory cache for instant event lookup, test stability, and deduplication
const eventsCache = new Map<string, AutomationEvent>();

export interface TriggerApprovedWorkflowOptions {
  contentId: string;
  organizationId: string;
  userId: string;
  versionId?: string | number;
  channel?: string;
}

export interface CallbackPayload {
  eventId: string;
  workflow: string;
  status: "COMPLETED" | "FAILED" | "BLOCKED" | "DUPLICATE";
  result?: {
    state?: string;
    channel?: string;
    [key: string]: unknown;
  };
  error?: string;
  timestamp?: string;
}

export class AutomationService {
  /**
   * Idempotency check: returns true if an automation event is already active or completed
   * for the specified content and version.
   */
  public static async hasActiveOrCompletedEvent(
    contentId: string,
    versionId: string | number
  ): Promise<boolean> {
    const verStr = String(versionId);

    // 1. Check memory cache first
    for (const evt of eventsCache.values()) {
      if (
        evt.resourceId === contentId &&
        String(evt.versionId) === verStr &&
        ["TRIGGERED", "RUNNING", "COMPLETED"].includes(evt.status)
      ) {
        return true;
      }
    }

    // 2. Query Firestore
    try {
      const q = query(
        collection(db, AUTOMATION_EVENTS_COLLECTION),
        where("resourceId", "==", contentId),
        where("versionId", "==", verStr)
      );
      const snap = await getDocs(q);
      const activeMatch = snap.docs.some((d) => {
        const data = d.data() as AutomationEvent;
        return ["TRIGGERED", "RUNNING", "COMPLETED"].includes(data.status);
      });
      return activeMatch;
    } catch (err) {
      console.warn("[AutomationService] Idempotency check warning (fallback to memory):", err);
      return false;
    }
  }

  /**
   * Triggers the existing n8n Cloud workflow upon content approval.
   * Enforces server-side authorization, tenant verification, and idempotency.
   */
  public static async triggerApprovedContentWorkflow(
    options: TriggerApprovedWorkflowOptions
  ): Promise<{
    success: boolean;
    eventId?: string;
    duplicate?: boolean;
    error?: string;
    event?: AutomationEvent;
  }> {
    const { contentId, organizationId, userId, channel = "linkedin" } = options;

    // 1. Validate content existence & ownership
    const content = await getContentById(contentId);
    if (!content) {
      return { success: false, error: `Content not found: ${contentId}` };
    }

    if (content.organizationId && content.organizationId !== organizationId) {
      return { success: false, error: "Cross-tenant approval trigger rejected" };
    }

    const versionId = options.versionId || content.version || 1;

    // 2. Enforce Idempotency
    const alreadyProcessed = await this.hasActiveOrCompletedEvent(contentId, versionId);
    if (alreadyProcessed) {
      console.log(`[AutomationService] Idempotency notice: Content ${contentId} v${versionId} already has an active or completed event.`);
      // Find existing event id
      const existing = Array.from(eventsCache.values()).find(
        (e) => e.resourceId === contentId && String(e.versionId) === String(versionId)
      );
      return {
        success: true,
        duplicate: true,
        eventId: existing?.eventId,
        event: existing,
      };
    }

    // 3. Generate unique event ID
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const eventRecord: AutomationEvent = {
      id: eventId,
      eventId,
      organizationId,
      userId,
      eventType: "CONTENT_APPROVED",
      resourceType: "CONTENT",
      resourceId: contentId,
      versionId: String(versionId),
      channel: channel.toLowerCase(),
      status: "TRIGGERED",
      workflowName: "NEXUS — Approved Content Orchestration",
      webhookUrl: getN8nClient().getWebhookUrl(),
      retryCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Cache immediately
    eventsCache.set(eventId, eventRecord);

    // Persist to Firestore
    try {
      const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, eventId);
      await setDoc(docRef, cleanForFirestore({
        ...eventRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("[AutomationService] Firestore write warning (retaining in memory):", err);
    }

    // 4. Log Audit Event: AUTOMATION_TRIGGERED
    await logAuditEvent({
      organizationId,
      userId,
      userEmail: `user_${userId}@nexus.internal`,
      userRole: "EDITOR",
      action: "AUTOMATION_TRIGGERED",
      resourceType: "AUTOMATION_EVENT",
      resourceId: eventId,
      severity: "INFO",
      ipAddress: "server-orchestrator",
      userAgent: "NEXUS-n8n-Client",
      details: {
        contentId,
        versionId,
        channel,
        webhookUrl: getN8nClient().getWebhookUrl(),
      },
    });

    // 5. Asynchronously trigger the n8n Cloud Webhook
    // NOTE: Does NOT block or fail the caller if n8n is slow or temporarily unreachable
    const triggerPayload: ApprovedContentTriggerPayload = {
      event: "CONTENT_APPROVED",
      eventId,
      organizationId,
      userId,
      contentId,
      versionId,
      channel: channel.toLowerCase(),
      timestamp: nowIso,
    };

    // Dispatch webhook asynchronously
    getN8nClient().triggerN8nWorkflow(triggerPayload).then(async (result) => {
      // Check if event was already completed or updated by an asynchronous callback
      const current = await AutomationService.getAutomationEventById(eventId);
      if (current && current.status === "COMPLETED") {
        return;
      }

      if (!result.success) {
        console.warn(`[AutomationService] n8n trigger reported non-fatal issue for event ${eventId}:`, result.error);
        eventRecord.status = "FAILED";
        eventRecord.error = result.error || "Automation service unavailable.";
        eventRecord.updatedAt = new Date().toISOString();
        eventsCache.set(eventId, eventRecord);

        try {
          const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, eventId);
          await updateDoc(docRef, cleanForFirestore({
            status: "FAILED",
            error: eventRecord.error,
            updatedAt: serverTimestamp(),
          }));
        } catch {
          // ignore
        }

        await logAuditEvent({
          organizationId,
          userId,
          userEmail: `user_${userId}@nexus.internal`,
          userRole: "EDITOR",
          action: "AUTOMATION_FAILED",
          resourceType: "AUTOMATION_EVENT",
          resourceId: eventId,
          severity: "WARNING",
          ipAddress: "server-orchestrator",
          userAgent: "NEXUS-n8n-Client",
          details: { error: result.error },
        });
      }
    });

    return {
      success: true,
      eventId,
      event: eventRecord,
    };
  }

  /**
   * Processes an inbound callback from the existing n8n Cloud workflow.
   * Verifies shared-secret, validates eventId, enforces idempotency, and updates event.
   */
  public static async processCallback(
    payload: CallbackPayload,
    headers: Headers | Record<string, string | null | undefined>
  ): Promise<{
    success: boolean;
    status: number;
    error?: string;
    duplicate?: boolean;
    event?: AutomationEvent;
  }> {
    // 1. Authenticate n8n callback secret
    const isAuthenticated = getN8nClient().verifyCallbackSecret(headers);
    if (!isAuthenticated) {
      console.warn("[AutomationService] Callback rejected: Invalid callback secret.");
      return { success: false, status: 401, error: "Unauthorized: Invalid callback secret" };
    }

    const { eventId, status, result, error } = payload;
    if (!eventId) {
      return { success: false, status: 400, error: "Missing required field: eventId" };
    }

    // 2. Find event record by eventId
    const event = await this.getAutomationEventById(eventId);
    if (!event) {
      console.warn(`[AutomationService] Callback rejected: Unknown eventId '${eventId}'`);
      return { success: false, status: 404, error: `Automation event not found: ${eventId}` };
    }

    // 3. Prevent duplicate callback processing
    if (event.status === "COMPLETED" && status === "COMPLETED") {
      console.log(`[AutomationService] Idempotent duplicate callback ignored for event ${eventId}`);
      return { success: true, status: 200, duplicate: true, event };
    }

    // 4. Update event record
    const nowIso = new Date().toISOString();
    event.status = status as AutomationEventStatus;
    event.result = result || { state: "READY_FOR_DISTRIBUTION", channel: event.channel };
    event.error = error || undefined;
    event.updatedAt = nowIso;
    if (status === "COMPLETED") {
      event.completedAt = nowIso;
    }

    eventsCache.set(event.id, event);

    try {
      const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, event.id);
      await updateDoc(docRef, cleanForFirestore({
        status: event.status,
        result: event.result,
        error: event.error || null,
        completedAt: event.completedAt || null,
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("[AutomationService] Firestore callback update notice:", err);
    }

    // 5. Log audit events
    await logAuditEvent({
      organizationId: event.organizationId,
      userId: event.userId,
      userEmail: `user_${event.userId}@nexus.internal`,
      userRole: "EDITOR",
      action: "AUTOMATION_CALLBACK_RECEIVED",
      resourceType: "AUTOMATION_EVENT",
      resourceId: eventId,
      severity: "INFO",
      ipAddress: "n8n-callback",
      userAgent: "n8n-Cloud-Webhook",
      details: {
        status,
        workflow: payload.workflow,
        state: result?.state || "READY_FOR_DISTRIBUTION",
      },
    });

    if (status === "COMPLETED") {
      await logAuditEvent({
        organizationId: event.organizationId,
        userId: event.userId,
        userEmail: `user_${event.userId}@nexus.internal`,
        userRole: "EDITOR",
        action: "AUTOMATION_COMPLETED",
        resourceType: "AUTOMATION_EVENT",
        resourceId: eventId,
        severity: "INFO",
        ipAddress: "n8n-callback",
        userAgent: "n8n-Cloud-Webhook",
        details: {
          resourceId: event.resourceId,
          versionId: event.versionId,
          channel: event.channel,
          resultState: result?.state || "READY_FOR_DISTRIBUTION",
        },
      });
    }

    return {
      success: true,
      status: 200,
      event,
    };
  }

  /**
   * Retrieves single automation event by document ID or eventId
   */
  public static async getAutomationEventById(idOrEventId: string): Promise<AutomationEvent | null> {
    if (eventsCache.has(idOrEventId)) {
      return eventsCache.get(idOrEventId)!;
    }

    // Find in memory by eventId
    for (const evt of eventsCache.values()) {
      if (evt.eventId === idOrEventId) {
        return evt;
      }
    }

    // Check Firestore by document id
    try {
      const ref = doc(db, AUTOMATION_EVENTS_COLLECTION, idOrEventId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const item = snap.data() as AutomationEvent;
        eventsCache.set(item.id, item);
        return item;
      }
    } catch {
      // ignore
    }

    // Check Firestore by eventId field
    try {
      const q = query(
        collection(db, AUTOMATION_EVENTS_COLLECTION),
        where("eventId", "==", idOrEventId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const item = snap.docs[0].data() as AutomationEvent;
        eventsCache.set(item.id, item);
        return item;
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Retrieves all automation executions for an organization with pagination support
   */
  public static async getAutomationEventsByOrg(
    organizationId: string,
    maxLimit: number = 50
  ): Promise<AutomationEvent[]> {
    const list: AutomationEvent[] = [];

    // Memory cache items
    for (const evt of eventsCache.values()) {
      if (evt.organizationId === organizationId) {
        list.push(evt);
      }
    }

    try {
      const q = query(
        collection(db, AUTOMATION_EVENTS_COLLECTION),
        where("organizationId", "==", organizationId),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() as AutomationEvent;
        if (!list.some((item) => item.id === data.id)) {
          list.push(data);
        }
      });
    } catch (err) {
      console.warn("[AutomationService] Firestore list warning:", err);
    }

    const getTime = (val: unknown) => {
      if (!val) return 0;
      if (typeof val === "object" && val !== null && "seconds" in val && typeof (val as { seconds: unknown }).seconds === "number") {
        return (val as { seconds: number }).seconds * 1000;
      }
      const t = new Date(val as string | number).getTime();
      return isNaN(t) ? 0 : t;
    };
    return list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }

  /**
   * Retries an automation execution safely
   */
  public static async retryAutomationEvent(
    eventId: string,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; event?: AutomationEvent }> {
    const existing = await this.getAutomationEventById(eventId);
    if (!existing) {
      return { success: false, error: `Event not found: ${eventId}` };
    }

    if (existing.organizationId !== organizationId) {
      return { success: false, error: "Cross-tenant retry rejected" };
    }

    // Update retry state
    existing.retryCount = (existing.retryCount || 0) + 1;
    existing.status = "TRIGGERED";
    existing.error = undefined;
    existing.updatedAt = new Date().toISOString();

    eventsCache.set(existing.id, existing);

    await logAuditEvent({
      organizationId,
      userId,
      userEmail: `user_${userId}@nexus.internal`,
      userRole: "EDITOR",
      action: "AUTOMATION_RETRIED",
      resourceType: "AUTOMATION_EVENT",
      resourceId: eventId,
      severity: "INFO",
      ipAddress: "server-orchestrator",
      userAgent: "NEXUS-n8n-Client",
      details: { retryCount: existing.retryCount },
    });

    // Re-dispatch webhook
    const triggerPayload: ApprovedContentTriggerPayload = {
      event: "CONTENT_APPROVED",
      eventId: existing.eventId,
      organizationId,
      userId,
      contentId: existing.resourceId,
      versionId: existing.versionId,
      channel: existing.channel,
      timestamp: new Date().toISOString(),
    };

    const result = await getN8nClient().triggerN8nWorkflow(triggerPayload);
    if (!result.success) {
      existing.status = "FAILED";
      existing.error = result.error;
    }

    return { success: true, event: existing, error: result.error };
  }

  public static clearCache(): void {
    eventsCache.clear();
  }
}
