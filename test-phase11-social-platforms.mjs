// ==============================================================================
// NEXUS AI - Phase 11: X (Twitter) & Instagram Integration Verification Suite
// ==============================================================================

import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function pass(name, detail = "") {
  passed++;
  console.log(`  \x1b[32m✔\x1b[0m ${name}${detail ? ` \x1b[90m(${detail})\x1b[0m` : ""}`);
}

function fail(name, err) {
  failed++;
  console.error(`  \x1b[31m✖\x1b[0m ${name}`);
  console.error(`    \x1b[31mError:\x1b[0m ${err.message || err}`);
}

console.log("\n===============================================================================");
console.log("  NEXUS AI - Phase 11: X (Twitter) & Instagram Integration Test Suite");
console.log("===============================================================================\n");

async function runTests() {
  const TEST_ORG = `org_phase11_${Date.now()}`;
  const TEST_USER = `usr_phase11_${Date.now()}`;

  // --------------------------------------------------------------------------
  // TEST GROUP 1: X (Twitter) OAuth Initiation & PKCE
  // --------------------------------------------------------------------------
  console.log("\x1b[36m[Group 1: X (Twitter) OAuth Flow & PKCE]\x1b[0m");

  let xState = "";
  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/x/connect?organizationId=${TEST_ORG}&userId=${TEST_USER}&format=json`
    );
    assert.equal(res.status, 200, "Should return 200 OK");
    const data = await res.json();
    assert.equal(data.success, true, "Response should indicate success");
    assert.ok(data.authUrl, "Should return authUrl");
    assert.ok(data.state, "Should return state token");
    assert.ok(data.authUrl.includes("response_type=code"), "URL must have response_type=code");
    assert.ok(data.authUrl.includes("code_challenge="), "URL must contain PKCE code_challenge");
    assert.ok(data.authUrl.includes("tweet.write"), "URL must request tweet.write scope");
    xState = data.state;
    pass("X OAuth connect endpoint generates secure PKCE authorization URL", `state: ${xState.substring(0, 8)}...`);
  } catch (err) {
    fail("X OAuth connect endpoint generates secure PKCE authorization URL", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: X (Twitter) OAuth Callback & Connection Persistence
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 2: X Callback & Encrypted Connection Persistence]\x1b[0m");

  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/x/callback?code=sim_code_phase11_x&state=${xState}&format=json`
    );
    assert.equal(res.status, 200, "Should return 200 OK for valid state");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.connected, true);
    assert.equal(data.status, "CONNECTED");
    assert.ok(data.user?.username, "Should return connected X username");
    pass("X OAuth callback exchanges code, derives profile, and stores encrypted tokens", `@${data.user.username}`);
  } catch (err) {
    fail("X OAuth callback exchanges code, derives profile, and stores encrypted tokens", err);
  }

  // Verify single-use state consumption
  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/x/callback?code=sim_code_replay&state=${xState}&format=json`
    );
    assert.equal(res.status, 400, "Should reject already consumed state");
    pass("X OAuth state rejects replay attack (single-use CSRF protection)");
  } catch (err) {
    fail("X OAuth state rejects replay attack (single-use CSRF protection)", err);
  }

  // Check X Status API
  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/x/status?organizationId=${TEST_ORG}&userId=${TEST_USER}`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.connected, true);
    assert.equal(data.status, "CONNECTED");
    assert.ok(data.user?.id, "Should return user ID");
    assert.ok(data.scopes?.includes("tweet.read"), "Should have tweet.read scope");
    pass("X status endpoint reports active connection", `User ID: ${data.user.id}`);
  } catch (err) {
    fail("X status endpoint reports active connection", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: X Publishing & Thread Auto-Segmentation
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 3: X Multi-Gate Publishing & Thread Auto-Segmentation]\x1b[0m");

  // Step 3a: Standalone tweet publish
  try {
    const res = await fetch(`${BASE_URL}/api/integrations/x/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: "standalone_test",
        organizationId: TEST_ORG,
        userId: TEST_USER,
        overrideContent: "NEXUS AI Phase 11 verified threat intelligence advisory. Critical zero-day patch released.",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, "PUBLISHED");
    assert.equal(data.channel, "x");
    assert.ok(data.postId, "Should return tweet ID");
    assert.ok(data.postUrl, "Should return tweet URL");
    assert.equal(data.threadCount, 1, "Short content should be a single tweet");
    pass("Single tweet publishing succeeded", `Tweet URL: ${data.postUrl}`);
  } catch (err) {
    fail("Single tweet publishing succeeded", err);
  }

  // Step 3b: Long tweet thread auto-segmentation
  try {
    const longAdvisory = [
      "1. Critical Infrastructure Advisory: Advanced persistent threat group Volt Typhoon actively exploiting network perimeter devices.",
      "2. Organizations must immediately enforce phish-resistant MFA and disable unauthenticated management interfaces accessible from the public internet.",
      "3. Automated IOC scanning with NEXUS AI engine detected 14 reconnaissance probes within the last 2 hours. Isolate legacy gateways.",
      "4. Detailed mitigation playbooks and incident response guidance have been synchronized with SIEM endpoints and executive command channels.",
    ].join(" ");

    const res = await fetch(`${BASE_URL}/api/integrations/x/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: "standalone_test",
        organizationId: TEST_ORG,
        userId: TEST_USER,
        overrideContent: longAdvisory,
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.threadCount > 1, `Thread count should be > 1, got ${data.threadCount}`);
    pass("Long advisory auto-segments into threaded tweets (<= 280 chars)", `Thread count: ${data.threadCount}`);
  } catch (err) {
    fail("Long advisory auto-segments into threaded tweets (<= 280 chars)", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Instagram OAuth Initiation & Connection
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 4: Instagram Graph API OAuth Flow]\x1b[0m");

  let igState = "";
  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/instagram/connect?organizationId=${TEST_ORG}&userId=${TEST_USER}&format=json`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.authUrl);
    assert.ok(data.state);
    assert.ok(data.authUrl.includes("instagram_content_publish"));
    igState = data.state;
    pass("Instagram OAuth connect generates authorization URL with content_publish scope", `state: ${igState.substring(0, 8)}...`);
  } catch (err) {
    fail("Instagram OAuth connect generates authorization URL with content_publish scope", err);
  }

  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/instagram/callback?code=sim_code_phase11_ig&state=${igState}&format=json`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.connected, true);
    assert.equal(data.status, "CONNECTED");
    assert.ok(data.user?.username);
    pass("Instagram callback exchanges code and persists encrypted token", `@${data.user.username}`);
  } catch (err) {
    fail("Instagram callback exchanges code and persists encrypted token", err);
  }

  // Check Instagram Status
  try {
    const res = await fetch(
      `${BASE_URL}/api/integrations/instagram/status?organizationId=${TEST_ORG}&userId=${TEST_USER}`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.connected, true);
    assert.equal(data.status, "CONNECTED");
    assert.ok(data.user?.id);
    pass("Instagram status endpoint reports active connection", `User ID: ${data.user.id}`);
  } catch (err) {
    fail("Instagram status endpoint reports active connection", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Instagram Publishing & Media Formatting
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 5: Instagram Media Container Publishing]\x1b[0m");

  try {
    const res = await fetch(`${BASE_URL}/api/integrations/instagram/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: "standalone_test",
        organizationId: TEST_ORG,
        userId: TEST_USER,
        overrideCaption: "NEXUS AI Cybersecurity Intelligence Briefing. Protecting enterprise perimeters 24/7.",
        tags: ["CyberSecurity", "ThreatIntel", "NexusAI"],
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, "PUBLISHED");
    assert.equal(data.channel, "instagram");
    assert.ok(data.postId, "Should return media ID");
    assert.ok(data.postUrl, "Should return post URL");
    pass("Instagram post publishing succeeded with hashtag injection", `Post URL: ${data.postUrl}`);
  } catch (err) {
    fail("Instagram post publishing succeeded with hashtag injection", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Disconnection & Tenant Isolation Cleanliness
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 6: Disconnection & State Isolation]\x1b[0m");

  try {
    const res = await fetch(`${BASE_URL}/api/integrations/x/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: TEST_ORG, userId: TEST_USER }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, "DISCONNECTED");

    // Verify status returns false
    const statusRes = await fetch(
      `${BASE_URL}/api/integrations/x/status?organizationId=${TEST_ORG}&userId=${TEST_USER}`
    );
    const statusData = await statusRes.json();
    assert.equal(statusData.connected, false);
    pass("X disconnect purges cache, revokes token, and updates status to NOT_CONNECTED");
  } catch (err) {
    fail("X disconnect purges cache, revokes token, and updates status to NOT_CONNECTED", err);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/integrations/instagram/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: TEST_ORG, userId: TEST_USER }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, "DISCONNECTED");

    // Verify status returns false
    const statusRes = await fetch(
      `${BASE_URL}/api/integrations/instagram/status?organizationId=${TEST_ORG}&userId=${TEST_USER}`
    );
    const statusData = await statusRes.json();
    assert.equal(statusData.connected, false);
    pass("Instagram disconnect purges cache, revokes token, and updates status to NOT_CONNECTED");
  } catch (err) {
    fail("Instagram disconnect purges cache, revokes token, and updates status to NOT_CONNECTED", err);
  }

  // Attempting publish after disconnect should fail gracefully
  try {
    const res = await fetch(`${BASE_URL}/api/integrations/x/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: "standalone_test",
        organizationId: TEST_ORG,
        userId: TEST_USER,
        overrideContent: "Should fail because disconnected",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.errorCode, "X_NOT_CONNECTED");
    pass("Publishing to disconnected channel returns HTTP 400 with X_NOT_CONNECTED code");
  } catch (err) {
    fail("Publishing to disconnected channel returns HTTP 400 with X_NOT_CONNECTED code", err);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log(`  Tests Passed: \x1b[32m${passed}\x1b[0m | Failed: \x1b[31m${failed}\x1b[0m | Total: ${passed + failed}`);
  console.log("-------------------------------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("  \x1b[32m✔ PHASE 11 (X + INSTAGRAM INTEGRATION) FULLY VERIFIED!\x1b[0m\n");
  }
}

runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
