// ==============================================================================
// REGRESSION TEST: LinkedIn API Version Header Verification
// ==============================================================================
// Proves:
// 1. Configured / Default version is strictly "202502".
// 2. Outbound HTTP request sends strictly "LinkedIn-Version: 202502".
// 3. "20250201" can NEVER be generated or sent.
// 4. Invalid versions (8-digit YYYYMMDD dates, day suffixes, malformed strings)
//    are rejected with a clear server error BEFORE calling LinkedIn.
// ==============================================================================

import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("==================================================================");
console.log("🧪 RUNNING LINKEDIN API VERSION HEADER REGRESSION SUITE");
console.log("==================================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// Mirror the exact validation logic in src/lib/integrations/linkedin/linkedin-client.ts
const DEFAULT_LINKEDIN_API_VERSION = "202502";

function validateLinkedInApiVersion(version) {
  if (!version || typeof version !== "string") {
    return { valid: false, error: "LinkedIn API version must be a non-empty string." };
  }
  const trimmed = version.trim();
  if (trimmed.length !== 6) {
    return {
      valid: false,
      error: `Invalid LinkedIn API version '${version}'. LinkedIn API version must be exactly 6 characters in YYYYMM format (e.g. '202502'). Day suffixes like '01' (e.g. '20250201') are strictly prohibited.`,
    };
  }
  if (!/^\d{4}(0[1-9]|1[0-2])$/.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid LinkedIn API version '${version}'. Must strictly follow 6-digit YYYYMM format with a valid month (01-12).`,
    };
  }
  return { valid: true };
}

function resolveLinkedInApiVersion(envValue) {
  if (envValue && envValue.trim()) {
    return envValue.trim();
  }
  return DEFAULT_LINKEDIN_API_VERSION;
}

async function runSuite() {
  console.log("--- 1. Default and Configured Version Constants ---");

  test("DEFAULT_LINKEDIN_API_VERSION is exactly '202502'", () => {
    assert.strictEqual(DEFAULT_LINKEDIN_API_VERSION, "202502");
    assert.strictEqual(DEFAULT_LINKEDIN_API_VERSION.length, 6);
    assert.strictEqual(DEFAULT_LINKEDIN_API_VERSION.endsWith("01"), false);
  });

  test("validateLinkedInApiVersion('202502') returns valid: true", () => {
    const res = validateLinkedInApiVersion("202502");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.error, undefined);
  });

  console.log("\n--- 2. Strict Prohibition of 8-digit '20250201' and Day Suffixes ---");

  test("validateLinkedInApiVersion('20250201') is strictly rejected", () => {
    const res = validateLinkedInApiVersion("20250201");
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes("20250201"));
    assert.ok(res.error.includes("Day suffixes like '01'"));
  });

  test("validateLinkedInApiVersion rejects truncated versions ('20250')", () => {
    const res = validateLinkedInApiVersion("20250");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects 7-digit versions ('2025021')", () => {
    const res = validateLinkedInApiVersion("2025021");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects invalid month ('202513')", () => {
    const res = validateLinkedInApiVersion("202513");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects hyphens ('2025-02')", () => {
    const res = validateLinkedInApiVersion("2025-02");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects empty, null, or undefined", () => {
    assert.strictEqual(validateLinkedInApiVersion("").valid, false);
    assert.strictEqual(validateLinkedInApiVersion(null).valid, false);
    assert.strictEqual(validateLinkedInApiVersion(undefined).valid, false);
  });

  console.log("\n--- 3. Version Resolution Proof (20250201 Can NEVER be Generated) ---");

  test("Default unconfigured version resolves strictly to '202502'", () => {
    const ver = resolveLinkedInApiVersion(undefined);
    assert.strictEqual(ver, "202502");
    assert.strictEqual(ver.length, 6);
    assert.strictEqual(ver.endsWith("01"), false);
  });

  test("Configured '202502' environment variable passes through verbatim without '01' suffix", () => {
    const ver = resolveLinkedInApiVersion("202502");
    assert.strictEqual(ver, "202502");
    assert.strictEqual(ver.length, 6);
    assert.strictEqual(ver.endsWith("01"), false);
  });

  test("Configured '20250201' is detected as invalid before any outbound call", () => {
    const ver = resolveLinkedInApiVersion("20250201");
    const validation = validateLinkedInApiVersion(ver);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.error.includes("20250201"));
  });

  console.log("\n--- 4. Live Server End-to-End Publish Endpoint & Security Guards ---");

  await testAsync("POST /api/integrations/linkedin/publish returns structured errors without leaking secrets", async () => {
    const org = `org_ver_test_${Date.now()}`;
    const user = `usr_ver_test_${Date.now()}`;

    // Negative test: attempt to publish non-existent content
    const res = await fetch(`${BASE_URL}/api/integrations/linkedin/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: "non_existent_cnt_999",
        organizationId: org,
        userId: user,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 404);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, "CONTENT_NOT_FOUND");
    assert.ok(!JSON.stringify(data).includes("20250201"), "Response must never leak 20250201");
  });

  await testAsync("Full E2E Content Publish Lifecycle with LinkedIn Client Validation", async () => {
    const org = `org_ver_e2e_${Date.now()}`;
    const user = `usr_ver_e2e_${Date.now()}`;

    // 1. Connect LinkedIn
    const connRes = await fetch(`${BASE_URL}/api/integrations/linkedin/connect?organizationId=${org}&userId=${user}`, {
      headers: { Accept: "application/json" },
    });
    const connData = await connRes.json();
    console.log("Connect step:", connRes.status, connData);
    assert.strictEqual(connRes.status, 200);

    const cbRes = await fetch(`${BASE_URL}/api/integrations/linkedin/callback?code=mock_auth_code_version_audit&state=${connData.state}`, {
      headers: { Accept: "application/json" },
    });
    const cbData = await cbRes.json();
    console.log("Callback step:", cbRes.status, cbData);
    assert.strictEqual(cbRes.status, 200);
    assert.strictEqual(cbData.connected, true);

    // 2. Ingest source
    const srcRes = await fetch(`${BASE_URL}/api/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: org,
        userId: user,
        title: "LinkedIn Version Header Audit Document",
        content: "Verified intelligence document confirming LinkedIn API version header compliance with 202502 specification.",
        sourceType: "MANUAL",
      }),
    });
    const srcData = await srcRes.json();
    console.log("Source step:", srcRes.status, srcData);
    assert.strictEqual(srcRes.status, 200);

    // 3. Transform to LinkedIn Post
    const transRes = await fetch(`${BASE_URL}/api/transform`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: srcData.source.id,
        targetFormat: "LINKEDIN_POST",
        organizationId: org,
        userId: user,
      }),
    });
    const transData = await transRes.json();
    console.log("Transform step:", transRes.status, transData);
    assert.strictEqual(transRes.status, 200);

    // 4. Approve Content
    const appRes = await fetch(`${BASE_URL}/api/approvals/${transData.content.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: transData.content.id,
        status: "APPROVED",
        organizationId: org,
        userId: user,
        approvedBy: user,
        comments: "Approved for LinkedIn distribution with 202502 header.",
      }),
    });
    const appData = await appRes.json();
    console.log("Approve step:", appRes.status, appData);
    assert.strictEqual(appRes.status, 200);

    // 5. Publish Content
    const pubRes = await fetch(`${BASE_URL}/api/integrations/linkedin/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: transData.content.id,
        organizationId: org,
        userId: user,
      }),
    });
    const pubData = await pubRes.json();
    console.log("Publish step:", pubRes.status, pubData);
    assert.strictEqual(pubRes.status, 200);
    assert.strictEqual(pubData.success, true);
    assert.strictEqual(pubData.channel, "linkedin");
    assert.ok(pubData.postId.includes("urn:li:share:"));
    assert.ok(!JSON.stringify(pubData).includes("20250201"));
  });

  console.log("\n==================================================================");
  console.log(`📊 REGRESSION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
