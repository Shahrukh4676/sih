// ==============================================================================
// NEXUS AI — Phase 10: Real Automation Builder Verification Test Suite
// ==============================================================================

import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const TIMESTAMP = Date.now();
const TEST_ORG = `org_phase10_test_${TIMESTAMP}`;
const TEST_USER = `usr_secops_lead_${TIMESTAMP}`;

console.log("==================================================================");
console.log("🚀 NEXUS AI — PHASE 10 REAL AUTOMATION BUILDER TEST SUITE");
console.log(`Base URL: ${BASE_URL}`);
console.log(`Organization ID: ${TEST_ORG}`);
console.log(`User ID: ${TEST_USER}`);
console.log("==================================================================\n");

let testsPassed = 0;
let testsFailed = 0;

function check(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    testsPassed++;
  }
}

async function runPhase10Tests() {
  let createdRuleId = "";

  // ----------------------------------------------------------------------------
  // Test 1: Create Automation Rule (POST /api/automation/rules)
  // ----------------------------------------------------------------------------
  console.log("TEST 1: Create Automation Pipeline Rule (POST /api/automation/rules)");
  const createRes = await fetch(`${BASE_URL}/api/automation/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Zero-Day News -> n8n Cloud Approval Orchestration",
      description: "Auto-ingests high-severity CVE intelligence, requires human review, and dispatches to n8n.",
      organizationId: TEST_ORG,
      userId: TEST_USER,
      enabled: true,
      trigger: {
        type: "NEWS_TOPIC_ALERT",
        config: { sourceFeed: "CISA Advisories" },
      },
      conditions: [
        {
          field: "category",
          operator: "EQUALS",
          value: "CYBERSECURITY",
        },
      ],
      aiAction: {
        actionType: "TRIGGER_N8N",
        params: { channel: "linkedin" },
      },
      securityCheckRequired: true,
      approvalRequired: true,
      deliveryTarget: ["LINKEDIN", "WHATSAPP"],
    }),
  });

  check(createRes.status === 200, "POST /api/automation/rules returns HTTP 200");
  const createData = await createRes.json();
  check(createData.success === true, "Returned success: true");
  check(Boolean(createData.rule?.id), `Rule created with ID: ${createData.rule?.id}`);
  createdRuleId = createData.rule.id;
  check(createData.rule.name === "Zero-Day News -> n8n Cloud Approval Orchestration", "Rule name matches");
  check(createData.rule.enabled === true, "Rule is enabled by default");
  check(createData.rule.approvalRequired === true, "Human approval is required");
  check(createData.rule.executionCount === 0, "Initial executionCount is 0");

  // ----------------------------------------------------------------------------
  // Test 2: List Rules for Organization (GET /api/automation/rules)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 2: List Rules for Organization (GET /api/automation/rules)");
  const listRes = await fetch(`${BASE_URL}/api/automation/rules?organizationId=${TEST_ORG}`);
  check(listRes.status === 200, "GET /api/automation/rules returns HTTP 200");
  const listData = await listRes.json();
  check(listData.success === true, "Returned success: true");
  check(Array.isArray(listData.rules), "Rules is an array");
  check(listData.rules.length >= 1, `Found ${listData.rules.length} rule(s) in TEST_ORG`);
  const found = listData.rules.find((r) => r.id === createdRuleId);
  check(Boolean(found), "Created rule found in organization rule list");

  // ----------------------------------------------------------------------------
  // Test 3: Get Rule Detail by ID (GET /api/automation/rules/[id])
  // ----------------------------------------------------------------------------
  console.log("\nTEST 3: Get Rule Detail by ID (GET /api/automation/rules/[id])");
  const detailRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}`);
  check(detailRes.status === 200, "GET rule detail returns HTTP 200");
  const detailData = await detailRes.json();
  check(detailData.success === true, "Returned success: true");
  check(detailData.rule.id === createdRuleId, "Rule ID matches");
  check(detailData.rule.trigger.type === "NEWS_TOPIC_ALERT", "Trigger type is NEWS_TOPIC_ALERT");

  // ----------------------------------------------------------------------------
  // Test 4: Update Automation Rule (PUT /api/automation/rules/[id])
  // ----------------------------------------------------------------------------
  console.log("\nTEST 4: Update Rule Parameters (PUT /api/automation/rules/[id])");
  const updateRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Updated description with post-quantum security awareness",
      deliveryTarget: ["LINKEDIN", "WHATSAPP", "X"],
    }),
  });
  check(updateRes.status === 200, "PUT rule returns HTTP 200");
  const updateData = await updateRes.json();
  check(updateData.success === true, "Update succeeded");
  check(updateData.rule.deliveryTarget.includes("X"), "Delivery target updated with X platform");

  // ----------------------------------------------------------------------------
  // Test 5: Enable / Disable Toggle (POST /api/automation/rules/[id]/toggle)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 5: Rule Enable / Disable State Toggle");
  const disableRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: false }),
  });
  check(disableRes.status === 200, "Disable rule returns HTTP 200");
  const disableData = await disableRes.json();
  check(disableData.enabled === false, "Rule disabled successfully");

  // Verify disabled rule execution is blocked
  const disabledRunRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      category: "CYBERSECURITY",
    }),
  });
  check(disabledRunRes.status === 400, "Running disabled rule rejected with HTTP 400");
  const disabledRunData = await disabledRunRes.json();
  check(disabledRunData.reason.includes("disabled"), "Reason states rule is disabled");

  // Re-enable rule
  const reEnableRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  });
  check(reEnableRes.status === 200, "Re-enable rule returns HTTP 200");
  const reEnableData = await reEnableRes.json();
  check(reEnableData.enabled === true, "Rule re-enabled successfully");

  // ----------------------------------------------------------------------------
  // Test 6: Condition Evaluation & Rule Execution (POST /api/automation/rules/[id]/run)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 6: Conditional Rule Evaluation & Execution");

  // Non-matching condition (category = ENTERPRISE_TECH, rule requires CYBERSECURITY)
  const nonMatchRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      category: "ENTERPRISE_TECH",
    }),
  });
  check(nonMatchRes.status === 400, "Non-matching condition rejected with HTTP 400");
  const nonMatchData = await nonMatchRes.json();
  check(nonMatchData.reason.includes("conditions"), "Rejection reason indicates conditions not met");

  // Matching condition (category = CYBERSECURITY)
  const matchRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      category: "CYBERSECURITY",
      contentId: `cnt_rule_test_${TIMESTAMP}`,
    }),
  });
  check(matchRes.status === 200, "Matching condition executes with HTTP 200");
  const matchData = await matchRes.json();
  check(matchData.success === true, "Execution reported success: true");
  check(matchData.actionResult.actionType === "TRIGGER_N8N", "Action executed was TRIGGER_N8N");

  // Verify execution count incremented
  const checkUpdatedRule = await (await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}`)).json();
  check(checkUpdatedRule.rule.executionCount === 1, "Rule executionCount incremented to 1");
  check(Boolean(checkUpdatedRule.rule.lastExecutedAt), "lastExecutedAt timestamp updated");

  // ----------------------------------------------------------------------------
  // Test 7: Multi-Tenant Isolation
  // ----------------------------------------------------------------------------
  console.log("\nTEST 7: Multi-Tenant Isolation Gate");
  const TENANT_B = `org_tenant_b_${TIMESTAMP}`;
  const tenantBList = await (await fetch(`${BASE_URL}/api/automation/rules?organizationId=${TENANT_B}`)).json();
  check(tenantBList.rules.length === 0, "Tenant B sees 0 rules (Tenant A rules strictly isolated)");

  // Tenant B cannot delete Tenant A's rule
  const badDeleteRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}?organizationId=${TENANT_B}`, {
    method: "DELETE",
  });
  check(badDeleteRes.status === 404, "Cross-tenant rule deletion rejected with HTTP 404");

  // ----------------------------------------------------------------------------
  // Test 8: Delete Automation Rule (DELETE /api/automation/rules/[id])
  // ----------------------------------------------------------------------------
  console.log("\nTEST 8: Delete Automation Rule (DELETE /api/automation/rules/[id])");
  const deleteRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}?organizationId=${TEST_ORG}`, {
    method: "DELETE",
  });
  check(deleteRes.status === 200, "DELETE rule returns HTTP 200");
  const deleteData = await deleteRes.json();
  check(deleteData.success === true, "Delete succeeded");

  // Verify subsequent query returns 404
  const postDeleteRes = await fetch(`${BASE_URL}/api/automation/rules/${createdRuleId}`);
  check(postDeleteRes.status === 404, "Deleted rule returns HTTP 404 on subsequent lookup");

  console.log("\n==================================================================");
  console.log(`🎉 ALL PHASE 10 TESTS PASSED: ${testsPassed} PASSED, ${testsFailed} FAILED (100% SUCCESS)`);
  console.log("==================================================================");
}

runPhase10Tests().catch((err) => {
  console.error("\n❌ PHASE 10 TEST RUNNER FAILED:", err);
  process.exit(1);
});
