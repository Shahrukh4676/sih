# NEXUS AI — Phase 7 Engineering & Architecture Report
## Connecting NEXUS AI to Existing n8n Cloud Workflow

---

### Executive Summary

In **Phase 7**, NEXUS AI achieved end-to-end integration with the external, pre-existing orchestration workflow hosted on **n8n Cloud**.

> [!IMPORTANT]
> **Key Architectural Mandates Upheld:**
> - **External Workflow Integration Only**: The n8n workflow (*NEXUS — Approved Content Orchestration*, ID: `uunidN8XWaIcA5xY`) was created externally in n8n Cloud. No workflow nodes, n8n Data Tables, or workflow JSON files were recreated or duplicated inside the Next.js application codebase.
> - **Zero Added Cost**: Direct integration with the existing free-tier n8n Cloud instance with zero paid middleware or automation subscriptions.
> - **Strict Distribution Boundary**: Content state transitions to `READY_FOR_DISTRIBUTION`. Real publishing to live social networks (e.g. LinkedIn API, X/Twitter API) is deliberately reserved for **Phase 8**.

---

### 1. Architectural Architecture & Round-Trip Flow

```
                                  NEXUS AI Platform                                     n8n Cloud (External)
┌───────────────────────────────────────────────────────────────────────────┐    ┌─────────────────────────────────┐
│                                                                           │    │                                 │
│ 1. Content Approval Gate                                                  │    │                                 │
│    (UI Approval Center / WhatsApp "Approve <ID>")                         │    │                                 │
│                     ↓                                                     │    │                                 │
│ 2. Idempotency & Tenant Verification                                      │    │                                 │
│    (AutomationService.hasActiveOrCompletedEvent)                          │    │                                 │
│                     ↓                                                     │    │                                 │
│ 3. Create Automation Event Record (status: QUEUED)                        │    │                                 │
│                     ↓                                                     │    │                                 │
│ 4. N8nClient.triggerApprovedContentWorkflow()                             │    │                                 │
│    POST https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved  ───────►  NEXUS — Approved Content       │
│    Headers: X-NEXUS-SIGNATURE, x-nexus-signature                          │    │  Orchestration (uunidN8XWaIcA5xY│
│    Payload: { event: "CONTENT_APPROVED", eventId, contentId, channel }    │    │                │                │
│                     ↓                                                     │    │  - Validate input & secret      │
│    (Event status transitions to TRIGGERED)                                │    │  - GET /api/content/[id] ◄──┐   │
│                                                                           │    │  - Verify approval & org    │   │
│ 5. Content Retrieval Endpoint                                             │    │  - Channel routing test     │   │
│    GET /api/content/[id] ────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                           │    │  - State: READY_FOR_DISTR   │
│ 6. Asynchronous Callback Endpoint                                         │    │                │                │
│    POST /api/automation/callback ◄─────────────────────────────────────────────────────── Callback Trigger       │
│    Header: X-NEXUS-CALLBACK-SECRET: <secret>                              │    │                                 │
│    Payload: { eventId, workflow: "content-approved", status: "COMPLETED", │    │                                 │
│               result: { state: "READY_FOR_DISTRIBUTION", channel } }      │    │                                 │
│                     ↓                                                     │    │                                 │
│ 7. Callback Verification & Audit Logging                                  │    │                                 │
│    (Event status -> COMPLETED, logs AUTOMATION_COMPLETED audit event)     │    │                                 │
│                     ↓                                                     │    │                                 │
│ 8. Real-time UI & State Reflection                                        │    │                                 │
│    (/automations & /automations/[id])                                     │    │                                 │
│                                                                           │    │                                 │
└───────────────────────────────────────────────────────────────────────────┘    └─────────────────────────────────┘
```

---

### 2. Environment Variables & Secret Configuration

The following variables have been added to `.env.example` and configured in `.env.local`:

```env
# ==============================================================================
# Phase 7 — External n8n Cloud Workflow Integration
# ==============================================================================
N8N_BASE_URL=https://shahrukh24.app.n8n.cloud
N8N_WORKFLOW_ID=uunidN8XWaIcA5xY
N8N_CONTENT_APPROVED_WEBHOOK=https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved
N8N_WEBHOOK_SECRET=nexus_webhook_shared_secret_2026_phase7_secure
N8N_CALLBACK_SECRET=nexus_callback_shared_secret_2026_phase7_secure
```

> [!CAUTION]
> **Production Deployment Requirement:**
> Before deploying to Netlify, configure `N8N_BASE_URL`, `N8N_CONTENT_APPROVED_WEBHOOK`, `N8N_WEBHOOK_SECRET`, and `N8N_CALLBACK_SECRET` in the Netlify dashboard under **Site Configuration > Environment variables**. These secrets are strictly kept on the server and are never exposed to client-side bundles.

---

### 3. Core NEXUS-Side Integrations

#### A. Event Model (`src/types/index.ts`)
```typescript
export type AutomationEventStatus =
  | 'QUEUED'
  | 'TRIGGERED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'DUPLICATE';

export interface AutomationEvent {
  id: string;
  eventId: string; // e.g. "evt_1788..."
  organizationId: string;
  userId: string;
  eventType: 'CONTENT_APPROVED';
  resourceType: 'CONTENT';
  resourceId: string; // contentId
  versionId: string | number;
  channel: string; // "linkedin", "x", "instagram", "whatsapp"
  status: AutomationEventStatus;
  workflowName?: string;
  webhookUrl?: string;
  executionId?: string;
  retryCount?: number;
  result?: {
    state?: string; // e.g. "READY_FOR_DISTRIBUTION"
    channel?: string;
    [key: string]: unknown;
  };
  error?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### B. Trigger Client (`src/lib/automation/n8n-client.ts`)
- **Header Authentication**: Sends both canonical and fallback signature headers (`X-NEXUS-SIGNATURE`, `x-nexus-signature`, `X-Webhook-Secret`, `Authorization: Bearer <secret>`).
- **Resilience & Timeout**: 10-second timeout with `AbortController`. Does not block the client UI or user approval request.
- **Callback Secret Verification**: Validates inbound requests from n8n against `N8N_CALLBACK_SECRET` with case-insensitive inspection across header variants.

#### C. Automation Service (`src/lib/services/automation.service.ts`)
- **Server-Side Idempotency Gate**: `hasActiveOrCompletedEvent(contentId, version)` checks Firestore to guarantee duplicate triggers are not spawned if an active or completed event already exists.
- **Race Condition Prevention**: Prevents late network timeout errors from overwriting an event that has already been verified and marked `COMPLETED` via callback.
- **Multi-Tenant Isolation**: Every event is indexed by `organizationId`, preventing cross-tenant data leaks.

#### D. Content Retrieval API for n8n (`GET /api/content/[id]`)
- Exposes `{ success: true, content, ...content }`, supplying both a nested `content` object and flattened root fields so n8n JSON expressions (e.g. `{{ $json.content.body }}` or `{{ $json.body }}`) resolve seamlessly.

#### E. Callback Endpoint (`POST /api/automation/callback`)
- Authenticates callback secrets.
- Verifies target event existence and checks callback idempotency (`duplicate: true` on redundant calls).
- Updates event state to `COMPLETED` with result `{ state: "READY_FOR_DISTRIBUTION", channel }`.
- Records an audit log event (`AUTOMATION_COMPLETED`).

#### F. Trigger Touchpoints
1. **Web UI Approval Center**: Submitting approval decision in `/approvals` calls `POST /api/approvals/[id]`, which dispatches the n8n trigger asynchronously.
2. **WhatsApp Command Center**: Replying `"Approve <ID>"` to the WhatsApp bot invokes `AutomationService.triggerApprovedContentWorkflow` after updating the approval status.

---

### 4. Firestore Multi-Tenant Security Rules (`firestore.rules`)

```javascript
match /automationEvents/{eventId} {
  allow read: if isAuthenticated() && (
    resource == null || resource.data.organizationId == request.auth.token.organizationId
  );
  allow create: if isAuthenticated() && isCreatorOrAbove() &&
    request.resource.data.organizationId == request.auth.token.organizationId;
  allow update: if isAuthenticated() && (
    isAdmin() || resource.data.organizationId == request.auth.token.organizationId
  );
  // Audit trail immutability: deletion strictly forbidden
  allow delete: if false;
}
```

---

### 5. Automations Frontend UI

1. **Live n8n Cloud Workflow Card (`/automations`)**:
   - Displays real-time connection status (`CONNECTED (Cloud Webhook)`), metrics (Total, Completed, In Progress, Failed), and active cloud endpoint info.
   - Includes **Open n8n** external link to `https://shahrukh24.app.n8n.cloud`.
2. **Interactive Manual Test Modal**:
   - Allows users and testers to simulate content approval and dispatch directly to the n8n Cloud webhook.
3. **Live Workflow Executions Stream**:
   - Renders active executions with status badges (`COMPLETED`, `IN PROGRESS`, `FAILED`), target channels, relative timestamps, and detail links.
4. **Dedicated Execution Detail Page (`/automations/[id]`)**:
   - Visual 3-stage lifecycle timeline (`QUEUED` → `TRIGGERED` → `COMPLETED / READY_FOR_DISTRIBUTION`).
   - JSON viewer for trigger payload, callback results, and error logs.
   - Safe retry action triggering a new attempt with cross-tenant defense.

---

### 6. Automated & End-to-End Verification

#### A. Automated Phase 7 Test Suite (`test-phase7-n8n.mjs`)
Running `node test-phase7-n8n.mjs`:
```
==================================================================
🚀 NEXUS AI — PHASE 7 n8n WORKFLOW INTEGRATION TEST SUITE
==================================================================

TEST 1: Status & Configuration Endpoint (GET /api/automation/status)
  ✓ PASSED: Status endpoint returned HTTP 200
  ✓ PASSED: Returned success=true
  ✓ PASSED: Workflow ID is correct: uunidN8XWaIcA5xY
  ✓ PASSED: Workflow Name is: NEXUS — Approved Content Orchestration
  ✓ PASSED: Cloud Base URL is: https://shahrukh24.app.n8n.cloud
  ✓ PASSED: Webhook URL is: https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved
  ✓ PASSED: Stats contains total count

TEST 2: Ingest Source & Transform Content
  ✓ PASSED: Source creation returned HTTP 200
  ✓ PASSED: Source created with ID: src_1788843837640_mr5lo
  ✓ PASSED: Transform API returned HTTP 200
  ✓ PASSED: Transformed content created with ID: cnt_1788843839408_xs9j7

TEST 3: Content Retrieval Endpoint for n8n Inspection (GET /api/content/[id])
  ✓ PASSED: Content endpoint returned HTTP 200
  ✓ PASSED: Returned success=true
  ✓ PASSED: Contains nested 'content' object for n8n JSON nodes
  ✓ PASSED: Contains top-level 'id' property matching contentAId
  ✓ PASSED: Contains top-level 'title': Analysis: Enterprise security alert: Apache Log4j zero-day vulnerability detected in border gateway services. 
  ✓ PASSED: Content status is 'GENERATED'
  ✓ PASSED: Contains top-level 'organizationId': org_test_phase7_1788843835642

TEST 4: Approvals Decision Endpoint Triggers n8n Workflow (POST /api/approvals/[id])
  ✓ PASSED: Approval decision returned HTTP 200
  ✓ PASSED: Approval submission succeeded

TEST 5: List Executions (GET /api/automation/executions)
  ✓ PASSED: Executions list returned HTTP 200
  ✓ PASSED: Returned success=true
  ✓ PASSED: Found 1 executions
  ✓ PASSED: Found execution matching content cnt_1788843839408_xs9j7
  ✓ PASSED: Valid eventId format: evt_1788843844149_kk46l
  ✓ PASSED: Event status is: TRIGGERED
  ✓ PASSED: Workflow name matches n8n workflow
  ✓ PASSED: Target channel is: linkedin

TEST 6: Server-Side Idempotency Gate (Duplicate Trigger Ignored)
  ✓ PASSED: Duplicate approval returned HTTP 200
  ✓ PASSED: Idempotency enforced: only 1 execution created (found 1)

TEST 7: Callback Rejection without Secret (HTTP 401)
  ✓ PASSED: Rejected callback without secret with HTTP 401
  ✓ PASSED: Returned success=false
  ✓ PASSED: Error message indicates secret requirement: Unauthorized: Invalid callback secret

TEST 8: Callback Rejection for Unknown Event (HTTP 404)
  ✓ PASSED: Rejected unknown eventId with HTTP 404

TEST 9: Valid Asynchronous Callback from n8n Cloud (HTTP 200)
  ✓ PASSED: Callback processed successfully with HTTP 200
  ✓ PASSED: Returned success=true
  ✓ PASSED: Event status updated to COMPLETED: COMPLETED
  ✓ PASSED: Result state is READY_FOR_DISTRIBUTION: READY_FOR_DISTRIBUTION
  ✓ PASSED: Completed timestamp recorded: 2026-09-08T05:04:12.637Z

TEST 10: Callback Idempotency Protection (Duplicate Ignored)
  ✓ PASSED: Duplicate callback returned HTTP 200
  ✓ PASSED: Returned success=true
  ✓ PASSED: Identified as duplicate callback (duplicate=true)

TEST 11: Single Execution Detail (GET /api/automation/executions/[id])
  ✓ PASSED: Execution detail returned HTTP 200
  ✓ PASSED: Returned success=true
  ✓ PASSED: Event ID matches: evt_1788843844149_kk46l
  ✓ PASSED: Status is COMPLETED: COMPLETED
  ✓ PASSED: State is READY_FOR_DISTRIBUTION

TEST 12: Execution Retry API (POST /api/automation/executions/[id]/retry)
  ✓ PASSED: Cross-tenant retry rejected with HTTP 400
  ✓ PASSED: Authorized retry returned HTTP 200
  ✓ PASSED: Retry succeeded
  ✓ PASSED: Retry count incremented to 1

TEST 13: WhatsApp Command Center Approval Trigger Integration
  ✓ PASSED: Generated WhatsApp linking code
  ✓ PASSED: Linking code received: NX-GZRJD3
  ✓ PASSED: Device linking message accepted
  ✓ PASSED: WhatsApp content transformation succeeded
  ✓ PASSED: Content created via WhatsApp: cnt_1788843870368_azw3b
  ✓ PASSED: WhatsApp approval processed with HTTP 200
  ✓ PASSED: Executions list includes WhatsApp triggered event (total: 2)

TEST 14: Multi-Tenant Organization Isolation
  ✓ PASSED: Tenant A has 2 executions
  ✓ PASSED: Tenant B has 0 executions (strict tenant isolation verified)

==================================================================
📊 PHASE 7 TEST SUMMARY: 60 PASSED, 0 FAILED
==================================================================
🎉 ALL PHASE 7 n8n WORKFLOW INTEGRATION TESTS PASSED!
```

#### B. Full Regression Test Matrix
| Test Suite | Total Tests | Passed | Result |
|---|---|---|---|
| Phase 4 Visual Intelligence Engine (`test-phase4-visuals.mjs`) | 14 | 14 | 100% PASS |
| Phase 5 Security Intelligence & Safety (`test-phase5-security.mjs`) | 10 | 10 | 100% PASS |
| Phase 6 WhatsApp Command Center (`test-phase6-whatsapp.mjs`) | 40 | 40 | 100% PASS |
| Phase 7 n8n Cloud Workflow Integration (`test-phase7-n8n.mjs`) | 60 | 60 | 100% PASS |
| Production Build Verification (`npm run build`) | 33 Routes | 33 Routes | 100% PASS |

---

### 7. Known Limitations & Phase 8 Readiness

1. **Simulated Publishing Target**:
   - In Phase 7, the n8n Cloud test branches route to LinkedIn/X/Instagram/WhatsApp test nodes and transition the content state to `READY_FOR_DISTRIBUTION`.
   - Direct external OAuth publishing to live LinkedIn, X, and Meta Graph APIs is scheduled for **Phase 8: Direct Social Media Distribution**.
2. **Phase 8 Readiness**:
   - The platform now has complete approval-to-orchestration wiring.
   - All approved assets carry canonical metadata, versioning, visual SVG attachments, and distribution channels ready for social API publishing.
