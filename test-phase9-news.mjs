// ==============================================================================
// NEXUS AI — Phase 9: Personalized News Intelligence Verification Test Suite
// ==============================================================================

import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const TIMESTAMP = Date.now();
const TEST_ORG = `org_phase9_test_${TIMESTAMP}`;
const TEST_USER = `usr_analyst_${TIMESTAMP}`;

console.log("==================================================================");
console.log("🚀 NEXUS AI — PHASE 9 PERSONALIZED NEWS INTELLIGENCE TEST SUITE");
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

async function runPhase9Tests() {
  let selectedNewsId = "";
  let selectedNewsTitle = "";

  // ----------------------------------------------------------------------------
  // Test 1: News Feed Ingestion & Retrieval (GET /api/news)
  // ----------------------------------------------------------------------------
  console.log("TEST 1: Ingest & Query Real News Feed (GET /api/news)");
  const feedRes = await fetch(`${BASE_URL}/api/news?organizationId=${TEST_ORG}&refresh=true`);
  check(feedRes.status === 200, "GET /api/news returns HTTP 200");
  const feedData = await feedRes.json();
  check(feedData.success === true, "Returned success: true");
  check(Array.isArray(feedData.items), "Items is an array");
  check(feedData.items.length > 0, `Successfully ingested ${feedData.items.length} real news briefings`);

  const firstItem = feedData.items[0];
  selectedNewsId = firstItem.id;
  selectedNewsTitle = firstItem.title;
  check(Boolean(firstItem.title), `First item has title: "${firstItem.title.substring(0, 50)}..."`);
  check(Boolean(firstItem.source), `Source identified: ${firstItem.source}`);
  check(firstItem.sourceUrl.startsWith("http"), `Valid sourceUrl: ${firstItem.sourceUrl}`);
  check(firstItem.relevanceScore >= 0 && firstItem.relevanceScore <= 100, `Valid relevance score: ${firstItem.relevanceScore}%`);
  check(Boolean(firstItem.whyItMatters), `Strategic 'Why It Matters' present: "${firstItem.whyItMatters.substring(0, 60)}..."`);
  check(Array.isArray(firstItem.tags) && firstItem.tags.length > 0, `Tags populated: ${firstItem.tags.join(", ")}`);

  // ----------------------------------------------------------------------------
  // Test 2: Category & Search Query Filtering
  // ----------------------------------------------------------------------------
  console.log("\nTEST 2: Category & Search Keyword Filtering");
  const catRes = await fetch(`${BASE_URL}/api/news?organizationId=${TEST_ORG}&category=CYBERSECURITY`);
  check(catRes.status === 200, "Category filter returns HTTP 200");
  const catData = await catRes.json();
  check(catData.success === true, "Category query succeeded");
  for (const item of catData.items) {
    check(item.category === "CYBERSECURITY", `Filtered item matches CYBERSECURITY: ${item.title.substring(0, 40)}`);
  }

  // Search keyword
  const searchRes = await fetch(`${BASE_URL}/api/news?organizationId=${TEST_ORG}&search=security`);
  check(searchRes.status === 200, "Search query returns HTTP 200");
  const searchData = await searchRes.json();
  check(searchData.success === true, "Search query succeeded");
  check(searchData.items.length > 0, `Found ${searchData.items.length} items matching 'security'`);

  // ----------------------------------------------------------------------------
  // Test 3: User Topic Preferences Management (GET & POST /api/news/preferences)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 3: Topic Preferences & Personalization Configuration");
  const getPrefRes = await fetch(`${BASE_URL}/api/news/preferences?organizationId=${TEST_ORG}`);
  check(getPrefRes.status === 200, "GET preferences returns HTTP 200");
  const getPrefData = await getPrefRes.json();
  check(getPrefData.success === true, "GET preferences succeeded");
  check(Array.isArray(getPrefData.preferences.subscribedTopics), "Preferences has subscribedTopics array");

  // Update subscribed topics with customized interest
  const customTopics = [
    "Kernel eBPF Exploits",
    "Post-Quantum Cryptography",
    "Autonomous Agent Safety",
    "NIST CSF Compliance",
  ];
  const updatePrefRes = await fetch(`${BASE_URL}/api/news/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: TEST_ORG,
      subscribedTopics: customTopics,
    }),
  });
  check(updatePrefRes.status === 200, "POST preferences returns HTTP 200");
  const updatePrefData = await updatePrefRes.json();
  check(updatePrefData.success === true, "Updated preferences succeeded");
  check(
    updatePrefData.preferences.subscribedTopics.includes("Kernel eBPF Exploits"),
    "New topic 'Kernel eBPF Exploits' saved in preferences"
  );

  // ----------------------------------------------------------------------------
  // Test 4: Single News Item & Bookmark Toggle (GET & PATCH /api/news/[id])
  // ----------------------------------------------------------------------------
  console.log("\nTEST 4: Single News Retrieval & Bookmark Toggle");
  const detailRes = await fetch(`${BASE_URL}/api/news/${selectedNewsId}`);
  check(detailRes.status === 200, "GET /api/news/[id] returns HTTP 200");
  const detailData = await detailRes.json();
  check(detailData.success === true, "GET news detail succeeded");
  check(detailData.item.id === selectedNewsId, "Returned news item ID matches requested ID");

  const bookmarkRes = await fetch(`${BASE_URL}/api/news/${selectedNewsId}`, {
    method: "PATCH",
  });
  check(bookmarkRes.status === 200, "PATCH /api/news/[id] returns HTTP 200");
  const bookmarkData = await bookmarkRes.json();
  check(typeof bookmarkData.isSaved === "boolean", `Bookmark status toggled to: ${bookmarkData.isSaved}`);

  // ----------------------------------------------------------------------------
  // Test 5: Transform News into LinkedIn Post (POST /api/news/transform)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 5: Transform News into LinkedIn Artefact (POST /api/news/transform)");
  const linkedinTransformRes = await fetch(`${BASE_URL}/api/news/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newsId: selectedNewsId,
      organizationId: TEST_ORG,
      userId: TEST_USER,
      targetFormat: "LINKEDIN_POST",
      tone: "PROFESSIONAL",
      targetAudience: "EXECUTIVES",
      customInstructions: "Highlight critical enterprise actions and compliance deadlines",
    }),
  });
  check(linkedinTransformRes.status === 200, "Transform to LinkedIn returns HTTP 200");
  const linkedinData = await linkedinTransformRes.json();
  check(linkedinData.success === true, "Transformation succeeded");
  check(Boolean(linkedinData.content?.id), `Generated Content ID: ${linkedinData.content?.id}`);
  check(Boolean(linkedinData.sourceId), `Created Grounded Source ID: ${linkedinData.sourceId}`);
  check(linkedinData.content.outputFormat === "LINKEDIN_POST", "Content format is LINKEDIN_POST");
  check(Boolean(linkedinData.content.content), "Content body is populated");
  check(linkedinData.content.organizationId === TEST_ORG, "Content is isolated to TEST_ORG");

  // ----------------------------------------------------------------------------
  // Test 6: Transform News into X (Twitter) Thread
  // ----------------------------------------------------------------------------
  console.log("\nTEST 6: Transform News into X (Twitter) Thread");
  const xTransformRes = await fetch(`${BASE_URL}/api/news/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newsId: selectedNewsId,
      organizationId: TEST_ORG,
      userId: TEST_USER,
      targetFormat: "X_THREAD",
      tone: "CONVERSATIONAL",
      targetAudience: "TECHNICAL",
    }),
  });
  check(xTransformRes.status === 200, "Transform to X thread returns HTTP 200");
  const xData = await xTransformRes.json();
  check(xData.success === true, "X thread transformation succeeded");
  check(xData.content.outputFormat === "X_THREAD", "Content format is X_THREAD");

  // ----------------------------------------------------------------------------
  // Test 7: Transform News into Cybersecurity Advisory
  // ----------------------------------------------------------------------------
  console.log("\nTEST 7: Transform News into Cybersecurity Advisory");
  const advisoryRes = await fetch(`${BASE_URL}/api/news/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newsId: selectedNewsId,
      organizationId: TEST_ORG,
      userId: TEST_USER,
      targetFormat: "CYBERSECURITY_ADVISORY",
      tone: "URGENT",
      targetAudience: "CYBERSECURITY_PROFESSIONALS",
    }),
  });
  check(advisoryRes.status === 200, "Transform to Advisory returns HTTP 200");
  const advisoryData = await advisoryRes.json();
  check(advisoryData.success === true, "Advisory transformation succeeded");
  check(advisoryData.content.outputFormat === "CYBERSECURITY_ADVISORY", "Content format is CYBERSECURITY_ADVISORY");

  // ----------------------------------------------------------------------------
  // Test 8: Verify Content Persistence & Grounding in GET /api/content
  // ----------------------------------------------------------------------------
  console.log("\nTEST 8: Verify Transformed Artefacts Persisted in Firestore Content Studio");
  const contentListRes = await fetch(`${BASE_URL}/api/content?organizationId=${TEST_ORG}`);
  check(contentListRes.status === 200, "GET /api/content returns HTTP 200");
  const contentListData = await contentListRes.json();
  check(contentListData.success === true, "GET content list succeeded");
  check(contentListData.contents.length >= 3, `Found ${contentListData.contents.length} persisted artefacts in TEST_ORG`);

  const foundLinkedin = contentListData.contents.find((c) => c.id === linkedinData.content.id);
  check(Boolean(foundLinkedin), "LinkedIn artefact found in organization content inventory");
  check(foundLinkedin.sourceId === linkedinData.sourceId, "Artefact correctly linked to verified news source");

  // ----------------------------------------------------------------------------
  // Test 9: Multi-Tenant Isolation (Tenant B cannot access Tenant A's content)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 9: Multi-Tenant Data Isolation Gate");
  const TENANT_B = `org_tenant_b_${TIMESTAMP}`;
  const tenantBRes = await fetch(`${BASE_URL}/api/content?organizationId=${TENANT_B}`);
  check(tenantBRes.status === 200, "Tenant B content query returns HTTP 200");
  const tenantBData = await tenantBRes.json();
  check(tenantBData.contents.length === 0, "Tenant B sees 0 records (Tenant A records strictly isolated)");

  console.log("\n==================================================================");
  console.log(`🎉 ALL PHASE 9 TESTS PASSED: ${testsPassed} PASSED, ${testsFailed} FAILED (100% SUCCESS)`);
  console.log("==================================================================");
}

runPhase9Tests().catch((err) => {
  console.error("\n❌ PHASE 9 TEST RUNNER FAILED:", err);
  process.exit(1);
});
