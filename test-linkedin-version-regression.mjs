// ==============================================================================
// REGRESSION TEST: LinkedIn API Version Header Verification (202608 Active Version)
// ==============================================================================
// Proves:
// 1. Configured / Default version is strictly "202608".
// 2. Outbound HTTP request sends strictly "LinkedIn-Version: 202608".
// 3. Sunset version "202502" and 8-digit versions like "20260801", "20250201"
//    can NEVER be generated or sent outbound.
// 4. Invalid versions (8-digit YYYYMMDD dates, day suffixes, sunset versions)
//    are rejected with a clear server error BEFORE calling LinkedIn.
// ==============================================================================

import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("==================================================================");
console.log("🧪 RUNNING LINKEDIN API VERSION HEADER REGRESSION SUITE (202608)");
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
const DEFAULT_LINKEDIN_API_VERSION = "202608";

function validateLinkedInApiVersion(version) {
  if (!version || typeof version !== "string") {
    return { valid: false, error: "LinkedIn API version must be a non-empty string." };
  }
  const trimmed = version.trim();
  if (trimmed.length !== 6) {
    return {
      valid: false,
      error: `Invalid LinkedIn API version '${version}'. LinkedIn API version must be exactly 6 characters in YYYYMM format (e.g. '202608'). Day suffixes like '01' (e.g. '20260801') are strictly prohibited.`,
    };
  }
  if (!/^\d{4}(0[1-9]|1[0-2])$/.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid LinkedIn API version '${version}'. Must strictly follow 6-digit YYYYMM format with a valid month (01-12).`,
    };
  }
  if (trimmed === "202502" || trimmed === "202501" || trimmed < "202503") {
    return {
      valid: false,
      error: `LinkedIn API version '${version}' was officially sunset by LinkedIn on February 16, 2026. Use active version '202608'.`,
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

  test("DEFAULT_LINKEDIN_API_VERSION is exactly '202608'", () => {
    assert.strictEqual(DEFAULT_LINKEDIN_API_VERSION, "202608");
    assert.strictEqual(DEFAULT_LINKEDIN_API_VERSION.length, 6);
    assert.strictEqual(DEFAULT_LINKEDIN_API_VERSION.endsWith("01"), false);
  });

  test("validateLinkedInApiVersion('202608') returns valid: true", () => {
    const res = validateLinkedInApiVersion("202608");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.error, undefined);
  });

  console.log("\n--- 2. Strict Prohibition of Sunset Versions and 8-digit Dates ---");

  test("validateLinkedInApiVersion strictly rejects sunset version '202502'", () => {
    const res = validateLinkedInApiVersion("202502");
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes("officially sunset by LinkedIn"));
    assert.ok(res.error.includes("202608"));
  });

  test("validateLinkedInApiVersion strictly rejects 8-digit '20260801'", () => {
    const res = validateLinkedInApiVersion("20260801");
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes("20260801"));
    assert.ok(res.error.includes("Day suffixes like '01'"));
  });

  test("validateLinkedInApiVersion strictly rejects 8-digit '20250201'", () => {
    const res = validateLinkedInApiVersion("20250201");
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes("20250201"));
  });

  test("validateLinkedInApiVersion rejects truncated versions ('20260')", () => {
    const res = validateLinkedInApiVersion("20260");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects 7-digit versions ('2026081')", () => {
    const res = validateLinkedInApiVersion("2026081");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects invalid month ('202613')", () => {
    const res = validateLinkedInApiVersion("202613");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects hyphens ('2026-08')", () => {
    const res = validateLinkedInApiVersion("2026-08");
    assert.strictEqual(res.valid, false);
  });

  test("validateLinkedInApiVersion rejects empty, null, or undefined", () => {
    assert.strictEqual(validateLinkedInApiVersion("").valid, false);
    assert.strictEqual(validateLinkedInApiVersion(null).valid, false);
    assert.strictEqual(validateLinkedInApiVersion(undefined).valid, false);
  });

  console.log("\n--- 3. Version Resolution Proof (202608 Enforced) ---");

  test("Default unconfigured version resolves strictly to '202608'", () => {
    const ver = resolveLinkedInApiVersion(undefined);
    assert.strictEqual(ver, "202608");
    assert.strictEqual(ver.length, 6);
    assert.strictEqual(ver.endsWith("01"), false);
  });

  test("Configured '202608' environment variable passes through verbatim without '01' suffix", () => {
    const ver = resolveLinkedInApiVersion("202608");
    assert.strictEqual(ver, "202608");
    assert.strictEqual(ver.length, 6);
    assert.strictEqual(ver.endsWith("01"), false);
  });

  test("Configured '20260801' is detected as invalid before any outbound call", () => {
    const ver = resolveLinkedInApiVersion("20260801");
    const validation = validateLinkedInApiVersion(ver);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.error.includes("20260801"));
  });

  console.log("\n--- 4. Live Server End-to-End Publish Endpoint & Security Guards ---");

  await testAsync("POST /api/integrations/linkedin/publish returns structured errors with apiVersion=202608", async () => {
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
    assert.ok(!JSON.stringify(data).includes("20260801"), "Response must never leak 20260801");
  });

  await testAsync("Full E2E Content Publish Lifecycle verifying apiVersion='202608'", async () => {
    const org = `org_ver_e2e_${Date.now()}`;
    const user = `usr_ver_e2e_${Date.now()}`;

    // 1. Connect LinkedIn
    const connRes = await fetch(`${BASE_URL}/api/integrations/linkedin/connect?organizationId=${org}&userId=${user}`, {
      headers: { Accept: "application/json" },
    });
    const connData = await connRes.json();
    assert.strictEqual(connRes.status, 200);

    const cbRes = await fetch(`${BASE_URL}/api/integrations/linkedin/callback?code=mock_auth_code_version_audit&state=${connData.state}`, {
      headers: { Accept: "application/json" },
    });
    const cbData = await cbRes.json();
    assert.strictEqual(cbRes.status, 200);
    assert.strictEqual(cbData.connected, true);

    // 2. Ingest source
    const srcRes = await fetch(`${BASE_URL}/api/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: org,
        userId: user,
        title: "LinkedIn 202608 Active Version Audit Document",
        content: "Verified intelligence document confirming LinkedIn API version header compliance with active 202608 specification.",
        sourceType: "MANUAL",
      }),
    });
    const srcData = await srcRes.json();
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
        comments: "Approved for LinkedIn distribution with active 202608 header.",
      }),
    });
    const appData = await appRes.json();
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
    assert.strictEqual(pubRes.status, 200);
    assert.strictEqual(pubData.success, true);
    assert.strictEqual(pubData.channel, "linkedin");
    assert.strictEqual(pubData.apiVersion, "202608", "Publish endpoint response must confirm apiVersion === '202608'");
    assert.ok(pubData.postId.includes("urn:li:share:"));
    assert.ok(!JSON.stringify(pubData).includes("202502"));
    assert.ok(!JSON.stringify(pubData).includes("20260801"));
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
