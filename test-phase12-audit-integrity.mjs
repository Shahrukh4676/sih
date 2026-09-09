// ==============================================================================
// NEXUS AI - Phase 12: Tamper-Evident Audit & Blockchain Integrity Test Suite
// ==============================================================================

import assert from "node:assert/strict";
import {
  logAuditEvent,
  verifyAuditChain,
  getAuditLogsByOrg,
  computeLogHash,
  tamperAuditLogForTesting,
  GENESIS_HASH,
} from "./src/lib/services/audit.service.ts";

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
console.log("  NEXUS AI - Phase 12: Tamper-Evident Audit & Blockchain Verification Suite");
console.log("===============================================================================\n");

async function runTests() {
  const TEST_ORG = `org_phase12_${Date.now()}`;
  const TEST_USER = `usr_security_officer`;

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Sequential Hash Chaining & Genesis Block
  // --------------------------------------------------------------------------
  console.log("\x1b[36m[Group 1: Sequential Hash Chaining & Block Construction]\x1b[0m");

  let log1Id, log2Id, log3Id;

  try {
    log1Id = await logAuditEvent({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      userEmail: "ciso@nexus.enterprise",
      userRole: "ADMIN",
      action: "SECURITY_POLICY_INITIALIZED",
      resourceType: "POLICY",
      resourceId: "pol_zero_trust",
      severity: "INFO",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      details: { policyName: "Zero-Trust Enforcement", level: 5 },
    });
    assert.ok(log1Id, "Block 1 must be created");
    pass("Block 1 created with Genesis Hash reference", `ID: ${log1Id}`);
  } catch (err) {
    fail("Block 1 created with Genesis Hash reference", err);
  }

  try {
    log2Id = await logAuditEvent({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      userEmail: "ciso@nexus.enterprise",
      userRole: "ADMIN",
      action: "ACCESS_CREDENTIALS_ROTATED",
      resourceType: "CREDENTIAL",
      resourceId: "cred_oauth_keys",
      severity: "INFO",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      details: { rotationReason: "Periodic 30-day compliance schedule" },
    });
    assert.ok(log2Id, "Block 2 must be created");
    pass("Block 2 created chaining to Block 1", `ID: ${log2Id}`);
  } catch (err) {
    fail("Block 2 created chaining to Block 1", err);
  }

  try {
    log3Id = await logAuditEvent({
      organizationId: TEST_ORG,
      userId: TEST_USER,
      userEmail: "ciso@nexus.enterprise",
      userRole: "ADMIN",
      action: "ARTEFACT_PUBLISHED_TO_LINKEDIN",
      resourceType: "CONTENT",
      resourceId: "cnt_advisory_q3",
      severity: "INFO",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      details: { channel: "linkedin", postId: "urn:li:share:987654321" },
    });
    assert.ok(log3Id, "Block 3 must be created");
    pass("Block 3 created chaining to Block 2", `ID: ${log3Id}`);
  } catch (err) {
    fail("Block 3 created chaining to Block 2", err);
  }

  // Verify internal sequence and hashes
  const logs = await getAuditLogsByOrg(TEST_ORG, 10);
  const sortedLogs = logs.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

  try {
    assert.equal(sortedLogs.length, 3, "Should have 3 logs");
    assert.equal(sortedLogs[0].prevHash, GENESIS_HASH, "Block 1 prevHash must equal GENESIS_HASH");
    assert.equal(sortedLogs[1].prevHash, sortedLogs[0].integrityHash, "Block 2 prevHash must match Block 1 integrityHash");
    assert.equal(sortedLogs[2].prevHash, sortedLogs[1].integrityHash, "Block 3 prevHash must match Block 2 integrityHash");
    assert.equal(sortedLogs[0].sequenceNumber, 1, "Block 1 sequenceNumber must be 1");
    assert.equal(sortedLogs[1].sequenceNumber, 2, "Block 2 sequenceNumber must be 2");
    assert.equal(sortedLogs[2].sequenceNumber, 3, "Block 3 sequenceNumber must be 3");
    pass("Cryptographic hash continuity strictly verified across all 3 chained blocks");
  } catch (err) {
    fail("Cryptographic hash continuity strictly verified across all 3 chained blocks", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Full Cryptographic Chain Verification (Intact State)
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 2: Full Cryptographic Chain Verification]\x1b[0m");

  try {
    const result = await verifyAuditChain(TEST_ORG);
    assert.equal(result.valid, true, "Chain must be mathematically valid");
    assert.equal(result.totalLogsChecked, 3, "Must verify 3 blocks");
    assert.equal(result.genesisHash, sortedLogs[0].integrityHash);
    assert.equal(result.latestHash, sortedLogs[2].integrityHash);
    assert.equal(result.algorithm, "SHA-256 Chained Merkle Sequence");
    pass("verifyAuditChain confirms 100% integrity of untouched ledger", `3/3 blocks verified`);
  } catch (err) {
    fail("verifyAuditChain confirms 100% integrity of untouched ledger", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Tamper Detection Simulation
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 3: Cryptographic Tamper Detection & Forensic Alert]\x1b[0m");

  const TAMPER_ORG = `org_tamper_sim_${Date.now()}`;
  const tLog1 = await logAuditEvent({
    organizationId: TAMPER_ORG,
    userId: "usr_attacker",
    userEmail: "attacker@external.com",
    userRole: "CREATOR",
    action: "UNAUTHORIZED_DOWNLOAD_ATTEMPT",
    resourceType: "DATASET",
    resourceId: "ds_secret",
    severity: "CRITICAL",
    ipAddress: "203.0.113.9",
    userAgent: "curl/7.68.0",
    details: { attemptedFiles: 42 },
  });

  const tLog2 = await logAuditEvent({
    organizationId: TAMPER_ORG,
    userId: "usr_attacker",
    userEmail: "attacker@external.com",
    userRole: "CREATOR",
    action: "EXFILTRATION_PROBE",
    resourceType: "GATEWAY",
    resourceId: "gw_main",
    severity: "CRITICAL",
    ipAddress: "203.0.113.9",
    userAgent: "curl/7.68.0",
    details: { port: 8443 },
  });

  // Verify before tampering
  const cleanCheck = await verifyAuditChain(TAMPER_ORG);
  assert.equal(cleanCheck.valid, true);

  // Now maliciously tamper with Block 1's action (e.g. adversary altered log in database)
  tamperAuditLogForTesting(tLog1, "BENIGN_READ_ACTION_SPOOFED");

  try {
    const tamperedCheck = await verifyAuditChain(TAMPER_ORG);
    assert.equal(tamperedCheck.valid, false, "Chain verification must FAIL on tampered log");
    assert.equal(tamperedCheck.brokenIndex, 0, "Must point precisely to Block 1");
    assert.equal(tamperedCheck.brokenLogId, tLog1, "Must identify the compromised log ID");
    assert.ok(tamperedCheck.compromiseReason?.includes("Tampered log payload detected"), "Must explain failure reason");
    pass("Tamper detection identifies modified log block, payload mutation, and breaks chain", tamperedCheck.compromiseReason);
  } catch (err) {
    fail("Tamper detection identifies modified log block, payload mutation, and breaks chain", err);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: HTTP API Endpoints (/api/audit & /api/audit/verify)
  // --------------------------------------------------------------------------
  console.log("\n\x1b[36m[Group 4: HTTP Audit & Verification API Routes]\x1b[0m");

  const HTTP_ORG = `org_http_audit_${Date.now()}`;

  // Step 4a: Create 3 logs via HTTP
  for (let i = 1; i <= 3; i++) {
    const postRes = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: HTTP_ORG,
        userId: "usr_api_actor",
        userEmail: "api_actor@nexus.ai",
        action: `HTTP_TRANSACTION_STEP_${i}`,
        severity: "INFO",
        details: { step: i, httpRecorded: true },
      }),
    });
    assert.equal(postRes.status, 200, `HTTP post log ${i} should succeed`);
  }
  pass("POST /api/audit sequentially records chained blocks via HTTP");

  try {
    const res = await fetch(`${BASE_URL}/api/audit?organizationId=${HTTP_ORG}&limit=10`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.logs?.length, 3);
    assert.ok(data.logs[0].integrityHash);
    pass("GET /api/audit returns chronological audit records with hash signatures", `Count: ${data.logs.length}`);
  } catch (err) {
    fail("GET /api/audit returns chronological audit records with hash signatures", err);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/audit/verify?organizationId=${HTTP_ORG}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.valid, true);
    assert.equal(data.totalLogsChecked, 3);
    assert.equal(data.algorithm, "SHA-256 Chained Merkle Sequence");
    pass("GET /api/audit/verify validates chain mathematically via HTTP", `Valid: ${data.valid}, Checked: ${data.totalLogsChecked}`);
  } catch (err) {
    fail("GET /api/audit/verify validates chain mathematically via HTTP", err);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/audit/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: HTTP_ORG }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.valid, true);
    pass("POST /api/audit/verify validates chain with JSON body");
  } catch (err) {
    fail("POST /api/audit/verify validates chain with JSON body", err);
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
    console.log("  \x1b[32m✔ PHASE 12 (TAMPER-EVIDENT AUDIT & BLOCKCHAIN) FULLY VERIFIED!\x1b[0m\n");
  }
}

runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
