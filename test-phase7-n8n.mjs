// ==============================================================================
// NEXUS AI — Phase 7: n8n Workflow Integration Verification Test Suite
// ==============================================================================
// Comprehensive HTTP test suite testing all Phase 7 n8n integration requirements:
// 1. Status & Configuration Endpoint (GET /api/automation/status)
// 2. Source Ingestion & Transformation (POST /api/sources & /api/transform)
// 3. Content Retrieval Endpoint for n8n Inspection (GET /api/content/[id])
// 4. Approval Signoff Trigger & Event Creation (POST /api/approvals/[id])
// 5. Executions List Endpoint (GET /api/automation/executions)
// 6. Server-Side Idempotency Enforcement (Duplicate Trigger Gate)
// 7. Callback Secret Authentication Gate (HTTP 401 on missing/bad secret)
// 8. Unknown Event Rejection (HTTP 404)
// 9. Valid Asynchronous Callback Processing (POST /api/automation/callback)
// 10. Callback Idempotency Protection (Duplicate Result Safe)
// 11. Single Execution Detail API (GET /api/automation/executions/[id])
// 12. Execution Retry API (POST /api/automation/executions/[id]/retry)
// 13. WhatsApp Approval Command Integration
// 14. Multi-Tenant Organization Isolation
// ==============================================================================

import fs from "node:fs";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

function resolveSecret(key) {
  if (process.env[key]) return process.env[key];
  try {
    if (fs.existsSync(".env.local")) {
      const match = fs.readFileSync(".env.local", "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match && match[1]) return match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {}
  return "";
}

const N8N_CALLBACK_SECRET = resolveSecret("N8N_CALLBACK_SECRET");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    testsPassed++;
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🚀 NEXUS AI — PHASE 7 n8n WORKFLOW INTEGRATION TEST SUITE");
  console.log("==================================================================\n");

  const orgA = `org_test_phase7_${Date.now()}`;
  const orgB = `org_test_phase7_b_${Date.now()}`;
  const userA = "usr_tester_phase7";
  const userB = "usr_other_tenant";
  let contentAId = "";
  let eventAId = "";

  // ----------------------------------------------------------------------------
  // Test 1: Status & Configuration Endpoint
  // ----------------------------------------------------------------------------
  console.log("TEST 1: Status & Configuration Endpoint (GET /api/automation/status)");
  try {
    const res = await fetch(`${BASE_URL}/api/automation/status`);
    assert(res.status === 200, `Status endpoint returned HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Returned success=true");
    assert(data.workflow.id === "uunidN8XWaIcA5xY", `Workflow ID is correct: ${data.workflow.id}`);
    assert(data.workflow.name.includes("Approved Content Orchestration"), `Workflow Name is: ${data.workflow.name}`);
    assert(data.workflow.cloudBaseUrl.includes("app.n8n.cloud"), `Cloud Base URL is: ${data.workflow.cloudBaseUrl}`);
    assert(data.workflow.webhookUrl.includes("/webhook/nexus/content-approved"), `Webhook URL is: ${data.workflow.webhookUrl}`);
    assert(typeof data.stats.total === "number", "Stats contains total count");
  } catch (err) {
    console.error("  Error in Test 1:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 2: Ingest Source & Transform Content for Approval
  // ----------------------------------------------------------------------------
  console.log("\nTEST 2: Ingest Source & Transform Content");
  try {
    // 1. Ingest source
    const sourceRes = await fetch(`${BASE_URL}/api/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Enterprise Cybersecurity Advisory Q3",
        type: "DOCUMENT",
        content: "Enterprise security alert: Apache Log4j zero-day vulnerability detected in border gateway services. Immediate patch and egress inspection required for all production Kubernetes clusters.",
        organizationId: orgA,
        userId: userA,
      }),
    });
    assert(sourceRes.status === 200, `Source creation returned HTTP ${sourceRes.status}`);
    const sourceData = await sourceRes.json();
    const sourceId = sourceData.source?.id || sourceData.id;
    assert(Boolean(sourceId), `Source created with ID: ${sourceId}`);

    // 2. Transform into LinkedIn post
    const transformRes = await fetch(`${BASE_URL}/api/transform`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId,
        outputType: "LINKEDIN_POST",
        targetAudience: "EXECUTIVE",
        tone: "PROFESSIONAL",
        organizationId: orgA,
        userId: userA,
      }),
    });
    assert(transformRes.status === 200, `Transform API returned HTTP ${transformRes.status}`);
    const transformData = await transformRes.json();
    contentAId = transformData.content?.id || transformData.contentId || transformData.id;
    assert(Boolean(contentAId), `Transformed content created with ID: ${contentAId}`);
  } catch (err) {
    console.error("  Error in Test 2:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 3: Content Retrieval Endpoint (GET /api/content/[id])
  // ----------------------------------------------------------------------------
  console.log("\nTEST 3: Content Retrieval Endpoint for n8n Inspection (GET /api/content/[id])");
  try {
    const res = await fetch(`${BASE_URL}/api/content/${contentAId}`);
    assert(res.status === 200, `Content endpoint returned HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Returned success=true");
    assert(data.content !== undefined, "Contains nested 'content' object for n8n JSON nodes");
    assert(data.id === contentAId, "Contains top-level 'id' property matching contentAId");
    assert(typeof data.title === "string", `Contains top-level 'title': ${data.title}`);
    assert(typeof data.status === "string", `Content status is '${data.status}'`);
    assert(data.organizationId === orgA, `Contains top-level 'organizationId': ${data.organizationId}`);
  } catch (err) {
    console.error("  Error in Test 3:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 4: Approvals Decision Endpoint Triggers n8n Workflow
  // ----------------------------------------------------------------------------
  console.log("\nTEST 4: Approvals Decision Endpoint Triggers n8n Workflow (POST /api/approvals/[id])");
  try {
    const res = await fetch(`${BASE_URL}/api/approvals/appr_test_${Date.now()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: contentAId,
        status: "APPROVED",
        reviewerId: userA,
        reviewerName: "Compliance Officer",
        comments: "Authorized for multi-channel distribution.",
      }),
    });
    assert(res.status === 200, `Approval decision returned HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Approval submission succeeded");

    // Allow async non-blocking n8n trigger to register
    await new Promise((resolve) => setTimeout(resolve, 400));
  } catch (err) {
    console.error("  Error in Test 4:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 5: List Executions & Verify Triggered Event
  // ----------------------------------------------------------------------------
  console.log("\nTEST 5: List Executions (GET /api/automation/executions)");
  try {
    let executions = [];
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(`${BASE_URL}/api/automation/executions?organizationId=${orgA}`);
      assert(res.status === 200, `Executions list returned HTTP ${res.status}`);
      const data = await res.json();
      assert(data.success === true, "Returned success=true");
      if (Array.isArray(data.executions) && data.executions.length > 0) {
        executions = data.executions;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    assert(executions.length > 0, `Found ${executions.length} executions`);

    const matched = executions.find((e) => e.resourceId === contentAId);
    assert(matched !== undefined, `Found execution matching content ${contentAId}`);
    eventAId = matched.eventId || matched.id;
    assert(eventAId.startsWith("evt_"), `Valid eventId format: ${eventAId}`);
    assert(["TRIGGERED", "RUNNING", "COMPLETED"].includes(matched.status), `Event status is: ${matched.status}`);
    assert(matched.workflowName.includes("Approved Content Orchestration"), "Workflow name matches n8n workflow");
    assert(matched.channel === "linkedin", `Target channel is: ${matched.channel}`);
  } catch (err) {
    console.error("  Error in Test 5:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 6: Server-Side Idempotency Protection
  // ----------------------------------------------------------------------------
  console.log("\nTEST 6: Server-Side Idempotency Gate (Duplicate Trigger Ignored)");
  try {
    const res = await fetch(`${BASE_URL}/api/approvals/appr_test_duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: contentAId,
        status: "APPROVED",
        reviewerId: userA,
        reviewerName: "Compliance Officer",
      }),
    });
    assert(res.status === 200, `Duplicate approval returned HTTP ${res.status}`);

    // Verify executions list still only has 1 event for this content
    const listRes = await fetch(`${BASE_URL}/api/automation/executions?organizationId=${orgA}`);
    const listData = await listRes.json();
    const matches = listData.executions.filter((e) => e.resourceId === contentAId);
    assert(matches.length === 1, `Idempotency enforced: only 1 execution created (found ${matches.length})`);
  } catch (err) {
    console.error("  Error in Test 6:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 7: Callback Rejection without Secret (401 Unauthorized)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 7: Callback Rejection without Secret (HTTP 401)");
  try {
    const res = await fetch(`${BASE_URL}/api/automation/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: eventAId,
        workflow: "NEXUS — Approved Content Orchestration",
        status: "COMPLETED",
      }),
    });
    assert(res.status === 401, `Rejected callback without secret with HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === false, "Returned success=false");
    assert(data.error?.includes("secret") || data.error?.includes("Unauthorized"), `Error message indicates secret requirement: ${data.error}`);
  } catch (err) {
    console.error("  Error in Test 7:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 8: Callback Rejection for Unknown Event (404 Not Found)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 8: Callback Rejection for Unknown Event (HTTP 404)");
  try {
    const res = await fetch(`${BASE_URL}/api/automation/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NEXUS-CALLBACK-SECRET": N8N_CALLBACK_SECRET,
      },
      body: JSON.stringify({
        eventId: "evt_unknown_99999999",
        workflow: "NEXUS — Approved Content Orchestration",
        status: "COMPLETED",
      }),
    });
    assert(res.status === 404, `Rejected unknown eventId with HTTP ${res.status}`);
  } catch (err) {
    console.error("  Error in Test 8:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 9: Valid Asynchronous Callback Processing (HTTP 200)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 9: Valid Asynchronous Callback from n8n Cloud (HTTP 200)");
  try {
    const res = await fetch(`${BASE_URL}/api/automation/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NEXUS-CALLBACK-SECRET": N8N_CALLBACK_SECRET,
      },
      body: JSON.stringify({
        eventId: eventAId,
        workflow: "NEXUS — Approved Content Orchestration",
        status: "COMPLETED",
        result: {
          state: "READY_FOR_DISTRIBUTION",
          channel: "linkedin",
          routedAt: new Date().toISOString(),
          branch: "test-linkedin-branch",
        },
      }),
    });
    assert(res.status === 200, `Callback processed successfully with HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Returned success=true");
    assert(data.event.status === "COMPLETED", `Event status updated to COMPLETED: ${data.event.status}`);
    assert(data.event.result?.state === "READY_FOR_DISTRIBUTION", `Result state is READY_FOR_DISTRIBUTION: ${data.event.result?.state}`);
    assert(typeof data.event.completedAt === "string", `Completed timestamp recorded: ${data.event.completedAt}`);
  } catch (err) {
    console.error("  Error in Test 9:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 10: Callback Idempotency Protection
  // ----------------------------------------------------------------------------
  console.log("\nTEST 10: Callback Idempotency Protection (Duplicate Ignored)");
  try {
    const res = await fetch(`${BASE_URL}/api/automation/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NEXUS-CALLBACK-SECRET": N8N_CALLBACK_SECRET,
      },
      body: JSON.stringify({
        eventId: eventAId,
        workflow: "NEXUS — Approved Content Orchestration",
        status: "COMPLETED",
      }),
    });
    assert(res.status === 200, `Duplicate callback returned HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Returned success=true");
    assert(data.duplicate === true, "Identified as duplicate callback (duplicate=true)");
  } catch (err) {
    console.error("  Error in Test 10:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 11: Single Execution Detail API (GET /api/automation/executions/[id])
  // ----------------------------------------------------------------------------
  console.log("\nTEST 11: Single Execution Detail (GET /api/automation/executions/[id])");
  try {
    const res = await fetch(`${BASE_URL}/api/automation/executions/${eventAId}`);
    assert(res.status === 200, `Execution detail returned HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Returned success=true");
    assert(data.eventId === eventAId, `Event ID matches: ${data.eventId}`);
    assert(data.status === "COMPLETED", `Status is COMPLETED: ${data.status}`);
    assert(data.result?.state === "READY_FOR_DISTRIBUTION", "State is READY_FOR_DISTRIBUTION");
  } catch (err) {
    console.error("  Error in Test 11:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 12: Execution Retry API (POST /api/automation/executions/[id]/retry)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 12: Execution Retry API (POST /api/automation/executions/[id]/retry)");
  try {
    // Cross-tenant retry rejection
    const crossRes = await fetch(`${BASE_URL}/api/automation/executions/${eventAId}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgB,
        userId: userB,
      }),
    });
    assert(crossRes.status === 400, `Cross-tenant retry rejected with HTTP ${crossRes.status}`);

    // Authorized retry
    const authRes = await fetch(`${BASE_URL}/api/automation/executions/${eventAId}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgA,
        userId: userA,
      }),
    });
    assert(authRes.status === 200, `Authorized retry returned HTTP ${authRes.status}`);
    const data = await authRes.json();
    assert(data.success === true, "Retry succeeded");
    assert(data.execution?.retryCount === 1, `Retry count incremented to ${data.execution?.retryCount}`);
  } catch (err) {
    console.error("  Error in Test 12:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 13: WhatsApp Approval Integration Dispatches Automation
  // ----------------------------------------------------------------------------
  console.log("\nTEST 13: WhatsApp Command Center Approval Trigger Integration");
  try {
    const waPhone = `1555${Math.floor(1000000 + Math.random() * 9000000)}`;

    // 1. Generate code for authenticated user
    const linkRes = await fetch(`${BASE_URL}/api/whatsapp/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgA,
        userId: userA,
      }),
    });
    const linkData = await linkRes.json();
    assert(linkData.success === true, "Generated WhatsApp linking code");
    const code = linkData.data.code;
    assert(Boolean(code), `Linking code received: ${code}`);

    // 2. User sends linking code via WhatsApp message
    const linkMsgRes = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "entry_1",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "15550000000", phone_number_id: "phone_1" },
                  messages: [
                    {
                      from: waPhone,
                      id: `wamid.link_${Date.now()}`,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      type: "text",
                      text: { body: code },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    });
    assert(linkMsgRes.status === 200, "Device linking message accepted");

    // 3. User sends transformation request
    const transRes = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "entry_1",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "15550000000", phone_number_id: "phone_1" },
                  messages: [
                    {
                      from: waPhone,
                      id: `wamid.trans_${Date.now()}`,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      type: "text",
                      text: { body: "Turn this into a LinkedIn post: Cloud infrastructure telemetry reveals a 34% increase in credential-stuffing attacks across SaaS platforms in Q3 2026. Enterprise DevSecOps teams should enforce passkeys and automated rate-limiting to mitigate unauthorized credential access." },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    });
    const transData = await transRes.json();
    assert(transData.results?.[0]?.success === true, "WhatsApp content transformation succeeded");
    assert(Boolean(transData.results?.[0]?.contentId), `Content created via WhatsApp: ${transData.results?.[0]?.contentId}`);

    // 4. User sends "Approve" via WhatsApp
    const approveMsgRes = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "entry_1",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "15550000000", phone_number_id: "phone_1" },
                  messages: [
                    {
                      from: waPhone,
                      id: `wamid.wa_p7_appr_${Date.now()}`,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      type: "text",
                      text: { body: "Approve" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    });

    assert(approveMsgRes.status === 200, "WhatsApp approval processed with HTTP 200");

    // Allow async trigger to register
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Verify executions list has a new event from WhatsApp approval
    const execRes = await fetch(`${BASE_URL}/api/automation/executions?organizationId=${orgA}`);
    const execData = await execRes.json();
    assert(execData.executions.length >= 2, `Executions list includes WhatsApp triggered event (total: ${execData.executions.length})`);
  } catch (err) {
    console.error("  Error in Test 13:", err.message);
  }

  // ----------------------------------------------------------------------------
  // Test 14: Multi-Tenant Organization Isolation
  // ----------------------------------------------------------------------------
  console.log("\nTEST 14: Multi-Tenant Organization Isolation");
  try {
    const resA = await fetch(`${BASE_URL}/api/automation/executions?organizationId=${orgA}`);
    const dataA = await resA.json();

    const resB = await fetch(`${BASE_URL}/api/automation/executions?organizationId=${orgB}`);
    const dataB = await resB.json();

    assert(dataA.executions.length > 0, `Tenant A has ${dataA.executions.length} executions`);
    assert(dataB.executions.length === 0, `Tenant B has 0 executions (strict tenant isolation verified)`);
  } catch (err) {
    console.error("  Error in Test 14:", err.message);
  }

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`📊 PHASE 7 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("==================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL PHASE 7 n8n WORKFLOW INTEGRATION TESTS PASSED!\n");
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal test execution failure:", err);
  process.exit(1);
});
