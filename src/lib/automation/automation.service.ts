// ==============================================================================
// NEXUS AI - Provider-Neutral Automation Service
// ==============================================================================
// Exposes the core internal automation orchestrator decoupled from external
// workflow platforms (e.g. n8n, Activepieces). Dispatches approved content
// through internal security, tenant isolation, idempotency gates, and direct
// social publishing channels (LinkedIn API 202608).
// ==============================================================================

import "server-only";
import {
  AutomationService,
  DispatchApprovedContentOptions,
  DispatchApprovedContentResult,
  TriggerApprovedWorkflowOptions,
  CallbackPayload,
  AUTOMATION_EVENTS_COLLECTION,
} from "../services/automation.service";
import { AutomationEvent } from "@/types";

/**
 * Dispatches approved content to the internal automation engine.
 * Validates tenant ownership, approval status, security clearance,
 * idempotency, and routes directly to the production-verified LinkedIn publisher.
 */
export async function dispatchApprovedContent(
  options: DispatchApprovedContentOptions
): Promise<DispatchApprovedContentResult> {
  return AutomationService.dispatchApprovedContent(options);
}

/**
 * Backward-compatible dispatch method.
 */
export async function triggerApprovedContentWorkflow(
  options: TriggerApprovedWorkflowOptions
): Promise<{
  success: boolean;
  eventId?: string;
  duplicate?: boolean;
  error?: string;
  event?: AutomationEvent;
}> {
  return AutomationService.dispatchApprovedContent(options);
}

export {
  AutomationService,
  AUTOMATION_EVENTS_COLLECTION,
  type DispatchApprovedContentOptions,
  type DispatchApprovedContentResult,
  type TriggerApprovedWorkflowOptions,
  type CallbackPayload,
};
