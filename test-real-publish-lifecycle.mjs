// ==============================================================================
// TEST: Real Persisted Content Publish Flow & Mock Non-Existent ID Handling
// ==============================================================================

import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const TEST_ORG = `org_real_publish_test_${Date.now()}`;
const TEST_USER = `usr_test_publisher_${Date.now()}`;

console.log("==================================================================");
console.log("🧪 RUNNING REAL PERSISTED CONTENT LIFECYCLE & PUBLISH TEST");
console.log(`🏢 Organization ID: ${TEST_ORG}`);
console.log("==================================================================\n");

async function main() {
  // Step 1: Connect LinkedIn for TEST_ORG
  console.log("Step 1: Connecting LinkedIn OAuth for organization...");
  const connectRes = await fetch(`${BASE_URL}/api/integrations/linkedin/connect?organizationId=${TEST_ORG}&userId=${TEST_USER}`, {
    headers: { Accept: "application/json" },
  });
  const connectData = await connectRes.json();
  assert.strictEqual(connectRes.status, 200);
  assert.ok(connectData.url || connectData.authUrl);

  const state = connectData.state;
  const callbackRes = await fetch(`${BASE_URL}/api/integrations/linkedin/callback?code=mock_auth_code_for_automated_testing_123&state=${state}`, {
    headers: { Accept: "application/json" },
  });
  const callbackData = await callbackRes.json();
  assert.strictEqual(callbackRes.status, 200);
  assert.strictEqual(callbackData.connected, true);
  console.log("  ✓ LinkedIn successfully connected\n");

  // Step 2: Negative Test — Publishing non-existent content ID (like old mock cnt_02_linkedin_agentic_ai)
  console.log("Step 2: Negative Test — Publishing non-existent content ID 'cnt_02_linkedin_agentic_ai'...");
  const negRes = await fetch(`${BASE_URL}/api/integrations/linkedin/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentId: "cnt_02_linkedin_agentic_ai",
      organizationId: TEST_ORG,
      userId: TEST_USER,
    }),
  });
  const negData = await negRes.json();
  assert.strictEqual(negRes.status, 404, "Expected HTTP 404 for non-existent content record");
  assert.strictEqual(negData.success, false);
  assert.strictEqual(negData.code, "CONTENT_NOT_FOUND");
  console.log("  ✓ Non-existent mock content correctly rejected with HTTP 404 and CONTENT_NOT_FOUND\n");

  // Step 3: Ingest real source document
  console.log("Step 3: Ingesting source document into Firestore...");
  const sourceRes = await fetch(`${BASE_URL}/api/sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      title: "Real Production Zero-Day Disclosure",
      type: "TEXT",
      text: "A high-severity vulnerability has been confirmed in Linux kernels >= 6.8 involving eBPF bounds bypass. All enterprise servers must apply patched kernel v6.8.0-38 immediately.",
      author: "NEXUS Core SecOps",
    }),
  });
  const sourceData = await sourceRes.json();
  assert.strictEqual(sourceRes.status, 200);
  const sourceId = sourceData.source.id;
  console.log(`  ✓ Source created with ID: ${sourceId}\n`);

  // Step 4: Transform content and persist to Firestore
  console.log("Step 4: Transforming content into LinkedIn post format...");
  const transformRes = await fetch(`${BASE_URL}/api/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceId,
      organizationId: TEST_ORG,
      userId: TEST_USER,
      targetFormat: "LINKEDIN_POST",
      tone: "Authoritative, educational",
      customInstructions: "Enterprise security alert for CISOs",
    }),
  });
  const transformData = await transformRes.json();
  assert.strictEqual(transformRes.status, 200);
  const realContentId = transformData.content.id;
  console.log(`  ✓ Real content persisted in Firestore with ID: ${realContentId}`);
  assert.ok(realContentId.startsWith("cnt_"));
  assert.strictEqual(transformData.content.status, "GENERATED");
  console.log("  ✓ Status is GENERATED\n");

  // Step 5: Query GET /api/content?organizationId=...
  console.log("Step 5: Verifying GET /api/content returns the real persisted content...");
  const listRes = await fetch(`${BASE_URL}/api/content?organizationId=${TEST_ORG}`);
  const listData = await listRes.json();
  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listData.success, true);
  assert.ok(Array.isArray(listData.contents));
  const foundItem = listData.contents.find((c) => c.id === realContentId);
  assert.ok(foundItem, "Persisted content must be returned by GET /api/content");
  console.log(`  ✓ GET /api/content returned ${listData.contents.length} item(s) including ${realContentId}\n`);

  // Step 6: Verify publishing before approval is rejected
  console.log("Step 6: Verifying publish rejection before human approval...");
  const prematurePublishRes = await fetch(`${BASE_URL}/api/integrations/linkedin/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentId: realContentId,
      organizationId: TEST_ORG,
      userId: TEST_USER,
    }),
  });
  const prematurePublishData = await prematurePublishRes.json();
  assert.strictEqual(prematurePublishRes.status, 400);
  assert.strictEqual(prematurePublishData.code, "UNAPPROVED_CONTENT");
  console.log("  ✓ Unapproved content rejected by approval gate\n");

  // Step 7: Approve the content via /api/approvals/[id]
  console.log("Step 7: Approving content via /api/approvals/[id]...");
  const approveRes = await fetch(`${BASE_URL}/api/approvals/appr_test_${Date.now()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentId: realContentId,
      organizationId: TEST_ORG,
      status: "APPROVED",
      reviewerId: TEST_USER,
      reviewerName: "Compliance Lead",
      comments: "Approved for LinkedIn distribution",
    }),
  });
  const approveData = await approveRes.json();
  assert.strictEqual(approveRes.status, 200);
  console.log("  ✓ Approval submission succeeded in Firestore\n");

  // Step 8: Verify GET /api/content?organizationId=...&status=APPROVED
  console.log("Step 8: Verifying GET /api/content with status=APPROVED filter...");
  const approvedListRes = await fetch(`${BASE_URL}/api/content?organizationId=${TEST_ORG}&status=APPROVED`);
  const approvedListData = await approvedListRes.json();
  assert.strictEqual(approvedListRes.status, 200);
  const approvedItem = approvedListData.contents.find((c) => c.id === realContentId);
  assert.ok(approvedItem, "Newly approved item must be returned when filtering for status=APPROVED");
  console.log(`  ✓ Found approved item in GET /api/content?status=APPROVED\n`);

  // Step 9: Publish the approved content to LinkedIn
  console.log("Step 9: Publishing approved content to LinkedIn (POST /api/integrations/linkedin/publish)...");
  const publishRes = await fetch(`${BASE_URL}/api/integrations/linkedin/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentId: realContentId,
      organizationId: TEST_ORG,
      userId: TEST_USER,
    }),
  });
  const publishData = await publishRes.json();
  assert.strictEqual(publishRes.status, 200);
  assert.strictEqual(publishData.success, true);
  assert.strictEqual(publishData.status, "PUBLISHED");
  assert.ok(publishData.postId);
  assert.ok(publishData.publishedUrl);
  console.log(`  ✓ Successfully published to LinkedIn!`);
  console.log(`    Post URN: ${publishData.postId}`);
  console.log(`    URL: ${publishData.publishedUrl}\n`);

  // Step 10: Verify content status is now PUBLISHED in Firestore
  console.log("Step 10: Verifying document status in Firestore updated to PUBLISHED...");
  const checkRes = await fetch(`${BASE_URL}/api/content/${realContentId}`);
  const checkData = await checkRes.json();
  assert.strictEqual(checkRes.status, 200);
  const fetchedStatus = checkData.content?.status || checkData.status;
  assert.strictEqual(fetchedStatus, "PUBLISHED");
  console.log("  ✓ Verified Firestore document status is PUBLISHED\n");

  // Step 11: Verify publishing queue (status=APPROVED) no longer contains published item
  console.log("Step 11: Verifying item is cleared from the Ready-to-Publish queue...");
  const queueRes = await fetch(`${BASE_URL}/api/content?organizationId=${TEST_ORG}&status=APPROVED`);
  const queueData = await queueRes.json();
  const queueItem = queueData.contents.find((c) => c.id === realContentId);
  assert.strictEqual(queueItem, undefined, "Item must not be in APPROVED queue after being published");
  console.log("  ✓ Queue clean: Item is no longer in APPROVED status\n");

  console.log("==================================================================");
  console.log("🎉 ALL REAL PERSISTED CONTENT LIFECYCLE TESTS PASSED (11/11)!");
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
