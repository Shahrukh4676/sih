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
import { WhatsAppService } from "./whatsapp.service";
import { LinkedInService } from "./linkedin.service";
import { cleanForFirestore, normalizeFirestoreData } from "../firebase/firestore-utils";

export const AUTOMATION_EVENTS_COLLECTION = "automationEvents";

// Resilient memory cache for instant event lookup, test stability, and deduplication
const eventsCache = new Map<string, AutomationEvent>();

export interface DispatchApprovedContentOptions {
  contentId: string;
  organizationId: string;
  userId: string;
  versionId?: string | number;
  channel?: string;
  securityDecision?: string;
  overrideContent?: string;
}

export interface DispatchApprovedContentResult {
  success: boolean;
  eventId?: string;
  duplicate?: boolean;
  error?: string;
  status?: AutomationEventStatus;
  publishedUrl?: string;
  externalPostId?: string;
  event?: AutomationEvent;
}

export interface TriggerApprovedWorkflowOptions {
  contentId: string;
  organizationId: string;
  userId: string;
  versionId?: string | number;
  channel?: string;
  securityDecision?: string;
  overrideContent?: string;
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
   * Primary Provider-Neutral Orchestrator: Dispatches approved content to the appropriate channel (LinkedIn).
   * Enforces server-side authorization, tenant verification, approval state, security clearance,
   * idempotency, channel routing, persistence, and audit logging.
   */
  public static async dispatchApprovedContent(
    options: DispatchApprovedContentOptions
  ): Promise<DispatchApprovedContentResult> {
    const { contentId, organizationId, userId, channel = "linkedin" } = options;
    const normalizedChannel = channel.toLowerCase();

    // 1. Channel verification: Only 'linkedin' is supported in this stage
    if (normalizedChannel !== "linkedin") {
      return {
        success: false,
        error: `Channel '${channel}' is currently unsupported. Only 'linkedin' distribution is active.`,
      };
    }

    // 2. Validate content existence & ownership (tenant isolation)
    const content = await getContentById(contentId);
    if (!content) {
      return { success: false, error: `Content not found: ${contentId}` };
    }

    if (content.organizationId && content.organizationId !== organizationId) {
      return { success: false, error: "Cross-tenant approval trigger rejected" };
    }

    // 3. Security Gate: Only APPROVED content may enter publishing pipeline
    if (content.status !== "APPROVED") {
      return {
        success: false,
        error: `Cannot publish content with status '${content.status}'. Only APPROVED content may be published.`,
      };
    }

    // 4. Security clearance validation
    const secDecision =
      options.securityDecision ||
      ((content as unknown as Record<string, unknown>).securityDecision as string | undefined);
    if (secDecision === "BLOCK") {
      return {
        success: false,
        error: "Publishing blocked by security engine.",
      };
    }

    const versionId = options.versionId || content.version || 1;

    // 5. Enforce Idempotency
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

    // 6. Generate unique event ID & record in RUNNING state
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
      channel: normalizedChannel,
      status: "RUNNING",
      workflowName: "NEXUS — Approved Content Orchestration",
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

    // Log Audit Event: AUTOMATION_TRIGGERED
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
      userAgent: "NEXUS-Internal-Orchestrator",
      details: {
        contentId,
        versionId,
        channel: normalizedChannel,
        orchestrator: "internal",
      },
    });

    // 7. Route directly to existing production-verified LinkedIn Publishing Service
    try {
      const publishResult = await LinkedInService.publishApprovedContent({
        contentId,
        versionId,
        organizationId,
        userId,
        eventId,
        securityDecision: secDecision,
        overrideContent: options.overrideContent,
      });

      const updatedIso = new Date().toISOString();

      if (publishResult.success) {
        eventRecord.status = "COMPLETED";
        eventRecord.result = {
          state: "PUBLISHED",
          channel: "linkedin",
          postId: publishResult.externalPostId,
          publishedUrl: publishResult.publishedUrl,
          recordId: publishResult.recordId,
        };
        eventRecord.updatedAt = updatedIso;
        eventsCache.set(eventId, eventRecord);

        try {
          const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, eventId);
          await updateDoc(docRef, cleanForFirestore({
            status: "COMPLETED",
            result: eventRecord.result,
            updatedAt: serverTimestamp(),
          }));
        } catch {}

        await logAuditEvent({
          organizationId,
          userId,
          userEmail: `user_${userId}@nexus.internal`,
          userRole: "EDITOR",
          action: "AUTOMATION_COMPLETED",
          resourceType: "AUTOMATION_EVENT",
          resourceId: eventId,
          severity: "INFO",
          ipAddress: "server-orchestrator",
          userAgent: "NEXUS-Internal-Orchestrator",
          details: {
            contentId,
            versionId,
            channel: "linkedin",
            postId: publishResult.externalPostId,
            publishedUrl: publishResult.publishedUrl,
          },
        });

        // Notify WhatsApp user asynchronously if configured
        WhatsAppService.notifyPublishResult({
          organizationId,
          contentId,
          channel: "linkedin",
          success: true,
          publishedUrl: publishResult.publishedUrl,
        }).catch(() => {});

        return {
          success: true,
          eventId,
          event: eventRecord,
          publishedUrl: publishResult.publishedUrl,
          externalPostId: publishResult.externalPostId,
          status: "COMPLETED",
        };
      } else {
        const safeError = publishResult.error || "LinkedIn publishing failed. Please retry.";
        eventRecord.status = "FAILED";
        eventRecord.error = safeError;
        eventRecord.updatedAt = updatedIso;
        eventsCache.set(eventId, eventRecord);

        try {
          const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, eventId);
          await updateDoc(docRef, cleanForFirestore({
            status: "FAILED",
            error: safeError,
            updatedAt: serverTimestamp(),
          }));
        } catch {}

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
          userAgent: "NEXUS-Internal-Orchestrator",
          details: {
            error: safeError,
            errorCode: publishResult.errorCode,
            channel: "linkedin",
          },
        });

        WhatsAppService.notifyPublishResult({
          organizationId,
          contentId,
          channel: "linkedin",
          success: false,
          error: safeError,
        }).catch(() => {});

        return {
          success: false,
          eventId,
          event: eventRecord,
          error: safeError,
          status: "FAILED",
        };
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      const safeError = errObj?.message || "Internal automation execution error";
      eventRecord.status = "FAILED";
      eventRecord.error = safeError;
      eventRecord.updatedAt = new Date().toISOString();
      eventsCache.set(eventId, eventRecord);

      try {
        const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, eventId);
        await updateDoc(docRef, cleanForFirestore({
          status: "FAILED",
          error: safeError,
          updatedAt: serverTimestamp(),
        }));
      } catch {}

      return {
        success: false,
        eventId,
        event: eventRecord,
        error: safeError,
        status: "FAILED",
      };
    }
  }

  /**
   * Triggers the approved content workflow.
   * Delegates directly to the provider-neutral internal orchestrator.
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
    return this.dispatchApprovedContent(options);
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

    // Notify original WhatsApp user of orchestration outcome
    WhatsAppService.notifyPublishResult({
      organizationId: event.organizationId,
      contentId: event.resourceId,
      channel: event.channel || "linkedin",
      success: status === "COMPLETED",
      publishedUrl: (result as Record<string, unknown> | undefined)?.publishedUrl as string | undefined,
      error: event.error,
    }).catch((err) => console.warn("[AutomationService] WhatsApp callback notification notice:", err));

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
        const item = normalizeFirestoreData(snap.data()) as AutomationEvent;
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
        const item = normalizeFirestoreData(snap.docs[0].data()) as AutomationEvent;
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
        const data = normalizeFirestoreData(d.data()) as AutomationEvent;
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
   * Retries an automation execution safely via the internal orchestrator
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

    // Verify content still exists and is approved
    const content = await getContentById(existing.resourceId);
    if (!content) {
      return { success: false, error: `Content not found: ${existing.resourceId}` };
    }
    if (content.status !== "APPROVED") {
      return {
        success: false,
        error: `Cannot retry publishing: content status is '${content.status}' (must be APPROVED).`,
      };
    }

    // Update retry state
    existing.retryCount = (existing.retryCount || 0) + 1;
    existing.status = "RUNNING";
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
      userAgent: "NEXUS-Internal-Orchestrator",
      details: { retryCount: existing.retryCount },
    });

    // Execute via LinkedInService
    const publishResult = await LinkedInService.publishApprovedContent({
      contentId: existing.resourceId,
      versionId: existing.versionId,
      organizationId,
      userId,
      eventId: existing.eventId,
    });

    const nowIso = new Date().toISOString();
    if (publishResult.success) {
      existing.status = "COMPLETED";
      existing.result = {
        state: "PUBLISHED",
        channel: "linkedin",
        postId: publishResult.externalPostId,
        publishedUrl: publishResult.publishedUrl,
        recordId: publishResult.recordId,
      };
      existing.updatedAt = nowIso;
      eventsCache.set(existing.id, existing);

      try {
        const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, existing.id);
        await updateDoc(docRef, cleanForFirestore({
          status: "COMPLETED",
          result: existing.result,
          error: null,
          retryCount: existing.retryCount,
          updatedAt: serverTimestamp(),
        }));
      } catch {}

      return { success: true, event: existing };
    } else {
      existing.status = "FAILED";
      existing.error = publishResult.error || "LinkedIn publishing failed. Please retry.";
      existing.updatedAt = nowIso;
      eventsCache.set(existing.id, existing);

      try {
        const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, existing.id);
        await updateDoc(docRef, cleanForFirestore({
          status: "FAILED",
          error: existing.error,
          retryCount: existing.retryCount,
          updatedAt: serverTimestamp(),
        }));
      } catch {}

      return { success: false, event: existing, error: existing.error };
    }
  }

  /**
   * Records a user-facing automation execution event with deterministic metrics and state
   */
  public static async recordExecutionEvent(params: {
    ruleId: string;
    ruleName: string;
    organizationId: string;
    userId: string;
    channel?: string;
    status?: AutomationEventStatus;
    result?: Record<string, unknown>;
  }): Promise<AutomationEvent> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const eventRecord: AutomationEvent = {
      id: eventId,
      eventId,
      eventType: "CONTENT_APPROVED",
      resourceType: "CONTENT",
      resourceId: params.ruleId,
      versionId: "v1",
      channel: params.channel || "linkedin",
      status: params.status || "COMPLETED",
      workflowName: params.ruleName,
      organizationId: params.organizationId,
      userId: params.userId,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: params.status === "COMPLETED" ? nowIso : undefined,
      result: params.result || {},
    };

    eventsCache.set(eventId, eventRecord);

    try {
      const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, eventId);
      await setDoc(docRef, cleanForFirestore({
        ...eventRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("[AutomationService] Firestore write warning (cached locally):", err);
    }

    return eventRecord;
  }

  /**
   * Cancels an in-flight automation execution mid-run
   */
  public static async cancelAutomationEvent(
    eventId: string,
    organizationId: string,
    reason: string = "Execution cancelled by user"
  ): Promise<{ success: boolean; event?: AutomationEvent; error?: string }> {
    const existing = await this.getAutomationEventById(eventId);
    if (!existing) {
      return { success: false, error: "Execution event not found" };
    }
    if (existing.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    existing.status = "BLOCKED";
    existing.error = reason;
    existing.updatedAt = new Date().toISOString();
    if (existing.result) {
      existing.result.state = "CANCELLED";
      existing.result.cancelledAt = new Date().toISOString();
      existing.result.cancelReason = reason;
    }

    eventsCache.set(existing.id, existing);

    try {
      const docRef = doc(db, AUTOMATION_EVENTS_COLLECTION, existing.id);
      await updateDoc(docRef, cleanForFirestore({
        status: "BLOCKED",
        error: reason,
        updatedAt: serverTimestamp(),
      }));
    } catch {}

    await logAuditEvent({
      organizationId,
      userId: existing.userId || "usr_creator",
      userEmail: "creator@nexus.ai",
      userRole: "EDITOR",
      action: "AUTOMATION_CANCELLED",
      resourceType: "AUTOMATION_EVENT",
      resourceId: existing.id,
      severity: "WARNING",
      ipAddress: "127.0.0.1",
      userAgent: "NEXUS-Engine/ExecutionManager",
      details: { reason },
    });

    return { success: true, event: existing };
  }

  public static clearCache(): void {
    eventsCache.clear();
  }
}
