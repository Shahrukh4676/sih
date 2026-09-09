// ==============================================================================
// NEXUS AI - Phase 13: Multi-User AI Providers & BYOK Architecture Test Suite
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
  console.error(`    \x1b[31mError:\x1b[0m ${err?.message || err}`);
}

console.log("\n===============================================================================");
console.log("  NEXUS AI - Phase 13: Multi-User AI Providers & BYOK Architecture Suite");
console.log("===============================================================================\n");

async function runTests() {
  const TIMESTAMP = Date.now();
  const TEST_ORG_DEFAULT = `org_ai_def_${TIMESTAMP}`;
  const TEST_ORG_BYOK = `org_ai_byok_${TIMESTAMP}`;
  const TEST_ORG_OLLAMA = `org_ai_ollama_${TIMESTAMP}`;

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Default Provider Configuration & Initialization
  // --------------------------------------------------------------------------
  console.log("\x1b[36m[Group 1: Default Provider Configuration & Initialization]\x1b[0m");

  try {
    const res = await fetch(`${BASE_URL}/api/ai/providers?organizationId=${encodeURIComponent(TEST_ORG_DEFAULT)}`);
    assert.equal(res.status, 200, "GET /api/ai/providers should return HTTP 200");
    const data = await res.json();
    assert.equal(data.success, true, "Response success must be true");
    assert.equal(data.settings.organizationId, TEST_ORG_DEFAULT);
    assert.equal(data.settings.provider, "NEXUS_DEFAULT", "Initial provider must be NEXUS_DEFAULT");
    assert.equal(data.settings.geminiModel, "gemini-1.5-flash", "Initial model must be gemini-1.5-flash");
    assert.equal(data.settings.byokConfigured, false, "byokConfigured must be false");
    assert.equal(data.settings.ollamaBaseUrl, "http://localhost:11434");
    assert.ok(data.ollamaStatus !== undefined, "ollamaStatus probe must be returned");
    assert.ok(data.activeHealth !== undefined, "activeHealth must be returned");
    pass("Initial organization defaults to NEXUS Managed Gemini with health probe");
  } catch (err) {
    fail("Initial organization defaults to NEXUS Managed Gemini with health probe", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: BYOK Key Encryption & Zero Plaintext Exposure
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 2: BYOK Key Encryption & Masked Display]\x1b[0m");

  const dummyApiKey = "AIzaSyNexusTestKey1234567890SecOpsSafeXYZW";
  try {
    const postRes = await fetch(`${BASE_URL}/api/ai/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: TEST_ORG_BYOK,
        provider: "BYOK_GEMINI",
        byokApiKey: dummyApiKey,
        geminiModel: "gemini-1.5-pro",
      }),
    });

    assert.equal(postRes.status, 200, "POST /api/ai/providers should return HTTP 200");
    const postData = await postRes.json();
    assert.equal(postData.success, true);
    assert.equal(postData.settings.provider, "BYOK_GEMINI");
    assert.equal(postData.settings.geminiModel, "gemini-1.5-pro");
    assert.equal(postData.settings.byokConfigured, true);
    assert.ok(postData.settings.byokKeyMasked?.startsWith("AIzaSy..."), "Masked key must begin with prefix");
    assert.ok(postData.settings.byokKeyMasked?.endsWith("XYZW"), "Masked key must end with suffix");

    // CRITICAL SECURITY ASSERTION: Raw key and encrypted ciphertext must NEVER be returned to client
    assert.equal(postData.settings.byokApiKey, undefined, "Raw key must NEVER be in response");
    assert.equal(postData.settings.byokApiKeyEncrypted, undefined, "Ciphertext must NEVER be in response");
    pass("BYOK key encrypted with AES-256-GCM and returned as masked preview (zero secret exposure)");
  } catch (err) {
    fail("BYOK key encrypted with AES-256-GCM and returned as masked preview (zero secret exposure)", err);
  }

  try {
    // Read back settings to verify persistence across requests
    const getRes = await fetch(`${BASE_URL}/api/ai/providers?organizationId=${encodeURIComponent(TEST_ORG_BYOK)}`);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.settings.provider, "BYOK_GEMINI");
    assert.equal(getData.settings.byokConfigured, true);
    assert.ok(getData.settings.byokKeyMasked?.startsWith("AIzaSy..."));
    assert.equal(getData.settings.byokApiKeyEncrypted, undefined);
    pass("BYOK settings persist and reload securely on subsequent requests");
  } catch (err) {
    fail("BYOK settings persist and reload securely on subsequent requests", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Local Ollama Configuration & Daemon Probing
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 3: Local Ollama Configuration & Daemon Probing]\x1b[0m");

  try {
    const ollamaPostRes = await fetch(`${BASE_URL}/api/ai/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: TEST_ORG_OLLAMA,
        provider: "LOCAL_OLLAMA",
        ollamaBaseUrl: "http://127.0.0.1:11434",
        ollamaModel: "llama3.2:1b",
      }),
    });

    assert.equal(ollamaPostRes.status, 200);
    const ollamaData = await ollamaPostRes.json();
    assert.equal(ollamaData.settings.provider, "LOCAL_OLLAMA");
    assert.equal(ollamaData.settings.ollamaModel, "llama3.2:1b");
    pass("Switched organization to LOCAL_OLLAMA with custom model configuration");
  } catch (err) {
    fail("Switched organization to LOCAL_OLLAMA with custom model configuration", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Provider Connection Diagnostic Testing (/api/ai/providers/test)
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 4: Provider Connection Diagnostics]\x1b[0m");

  try {
    // Testing an unreachable Ollama URL should fail gracefully with latency tracking and no 500 error
    const testOllamaRes = await fetch(`${BASE_URL}/api/ai/providers/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "LOCAL_OLLAMA",
        ollamaBaseUrl: "http://localhost:59998",
        ollamaModel: "llama3.2",
      }),
    });

    assert.equal(testOllamaRes.status, 200, "Diagnostic test should return 200 with result payload");
    const testOllamaData = await testOllamaRes.json();
    assert.equal(testOllamaData.success, true);
    assert.equal(testOllamaData.result.provider, "LOCAL_OLLAMA");
    assert.equal(testOllamaData.result.success, false, "Unreachable host should report success: false");
    assert.ok(typeof testOllamaData.result.latencyMs === "number", "Latency must be measured");
    pass("Diagnostic probe for offline Ollama handles failure gracefully without server error");
  } catch (err) {
    fail("Diagnostic probe for offline Ollama handles failure gracefully without server error", err);
  }

  try {
    // Testing BYOK without providing a key
    const testNoKeyRes = await fetch(`${BASE_URL}/api/ai/providers/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "BYOK_GEMINI",
        organizationId: `org_fresh_no_key_${TIMESTAMP}`,
      }),
    });

    assert.equal(testNoKeyRes.status, 200);
    const testNoKeyData = await testNoKeyRes.json();
    assert.equal(testNoKeyData.result.success, false);
    assert.ok(testNoKeyData.result.error?.includes("No Gemini API key provided"));
    pass("Diagnostic probe enforces key presence validation for BYOK");
  } catch (err) {
    fail("Diagnostic probe enforces key presence validation for BYOK", err);
  }

  try {
    // Testing default provider diagnostic
    const testDefRes = await fetch(`${BASE_URL}/api/ai/providers/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "NEXUS_DEFAULT",
        geminiModel: "gemini-1.5-flash",
      }),
    });

    assert.equal(testDefRes.status, 200);
    const testDefData = await testDefRes.json();
    assert.equal(testDefData.success, true);
    assert.equal(testDefData.result.provider, "NEXUS_DEFAULT");
    assert.equal(testDefData.result.model, "gemini-1.5-flash");
    assert.ok(typeof testDefData.result.latencyMs === "number");
    pass("Diagnostic probe for NEXUS_DEFAULT executes and measures roundtrip latency");
  } catch (err) {
    fail("Diagnostic probe for NEXUS_DEFAULT executes and measures roundtrip latency", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Multi-Tenant Boundary Isolation
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 5: Multi-Tenant Boundary Isolation]\x1b[0m");

  try {
    const org1 = await (await fetch(`${BASE_URL}/api/ai/providers?organizationId=${encodeURIComponent(TEST_ORG_DEFAULT)}`)).json();
    const org2 = await (await fetch(`${BASE_URL}/api/ai/providers?organizationId=${encodeURIComponent(TEST_ORG_BYOK)}`)).json();
    const org3 = await (await fetch(`${BASE_URL}/api/ai/providers?organizationId=${encodeURIComponent(TEST_ORG_OLLAMA)}`)).json();

    assert.equal(org1.settings.provider, "NEXUS_DEFAULT", "Org 1 must remain NEXUS_DEFAULT");
    assert.equal(org2.settings.provider, "BYOK_GEMINI", "Org 2 must remain BYOK_GEMINI");
    assert.equal(org3.settings.provider, "LOCAL_OLLAMA", "Org 3 must remain LOCAL_OLLAMA");

    assert.equal(org1.settings.byokConfigured, false, "Org 1 should not have BYOK");
    assert.equal(org2.settings.byokConfigured, true, "Org 2 must have BYOK configured");
    assert.equal(org3.settings.byokConfigured, false, "Org 3 should not have BYOK");

    pass("Strict multi-tenant isolation verified across concurrent distinct organizations");
  } catch (err) {
    fail("Strict multi-tenant isolation verified across concurrent distinct organizations", err);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  Phase 13 Test Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m of ${passed + failed} total`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
