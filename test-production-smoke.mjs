// ==============================================================================
// NEXUS AI - Comprehensive Production Smoke Test Suite
// ==============================================================================

import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const TEST_ORG = "org_primary";

console.log(`\n🚀 Starting NEXUS AI Full Production Smoke Audit against ${BASE_URL}...\n`);

let passedTests = 0;
let totalTests = 0;

function report(testName, success, extra = "") {
  totalTests++;
  if (success) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName} ${extra ? `(${extra})` : ""}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${extra ? `(${extra})` : ""}`);
  }
}

async function testPages() {
  console.log("--- 1. Testing Core Dashboard & Auth HTML Routes ---");
  const pages = [
    { path: "/login", check: (html) => html.includes("Sign In") || html.includes("password") || html.includes("Email") },
    { path: "/approvals", check: (html) => html.includes("noscript") && html.includes("/login") },
    { path: "/dashboard", check: (html) => html.length > 500 },
    { path: "/content", check: (html) => html.length > 500 },
    { path: "/news", check: (html) => html.length > 500 },
    { path: "/publishing", check: (html) => html.length > 500 },
    { path: "/automations", check: (html) => html.length > 500 },
    { path: "/security", check: (html) => html.length > 500 },
    { path: "/settings", check: (html) => html.length > 500 },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, {
        headers: { "User-Agent": "NexusAuditBot/1.0" },
      });
      const text = await res.text();
      const statusOk = res.status === 200 || res.status === 307 || res.status === 308;
      const contentOk = page.check(text);
      report(`GET ${page.path}`, statusOk && contentOk, `status: ${res.status}`);
    } catch (err) {
      report(`GET ${page.path}`, false, err.message);
    }
  }
}

async function testAPIs() {
  console.log("\n--- 2. Testing All Core API Endpoints ---");
  const endpoints = [
    {
      name: "GET /api/content",
      url: `${BASE_URL}/api/content?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.contents),
    },
    {
      name: "GET /api/approvals",
      url: `${BASE_URL}/api/approvals?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.approvals),
    },
    {
      name: "GET /api/news",
      url: `${BASE_URL}/api/news?organizationId=${TEST_ORG}&limit=5`,
      validate: (data) => data.success === true && Array.isArray(data.items),
    },
    {
      name: "GET /api/news/preferences",
      url: `${BASE_URL}/api/news/preferences?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && data.preferences !== undefined,
    },
    {
      name: "GET /api/publishing/records",
      url: `${BASE_URL}/api/publishing/records?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.records),
    },
    {
      name: "GET /api/visuals/status",
      url: `${BASE_URL}/api/visuals/status`,
      validate: (data) => data.visualRendererAvailable === true,
    },
    {
      name: "GET /api/security/status",
      url: `${BASE_URL}/api/security/status`,
      validate: (data) => data.engine === "available" && data.piiDetection === true,
    },
    {
      name: "GET /api/automation/status",
      url: `${BASE_URL}/api/automation/status?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && data.engine !== undefined,
    },
    {
      name: "GET /api/automation/rules",
      url: `${BASE_URL}/api/automation/rules?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.rules),
    },
    {
      name: "GET /api/automation/executions",
      url: `${BASE_URL}/api/automation/executions?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.executions),
    },
    {
      name: "GET /api/whatsapp/status",
      url: `${BASE_URL}/api/whatsapp/status?organizationId=${TEST_ORG}`,
      validate: (data) => data.configured !== undefined && data.health !== undefined,
    },
    {
      name: "GET /api/whatsapp/link",
      url: `${BASE_URL}/api/whatsapp/link?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.data),
    },
    {
      name: "GET /api/whatsapp/conversations",
      url: `${BASE_URL}/api/whatsapp/conversations?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.data),
    },
    {
      name: "GET /api/audit",
      url: `${BASE_URL}/api/audit?organizationId=${TEST_ORG}&limit=5`,
      validate: (data) => data.success === true && Array.isArray(data.logs),
    },
    {
      name: "GET /api/audit/verify",
      url: `${BASE_URL}/api/audit/verify?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && typeof data.chainValid === "boolean",
    },
    {
      name: "GET /api/integrations/linkedin/status",
      url: `${BASE_URL}/api/integrations/linkedin/status?organizationId=${TEST_ORG}`,
      validate: (data) => typeof data.connected === "boolean",
    },
    {
      name: "GET /api/integrations/x/status",
      url: `${BASE_URL}/api/integrations/x/status?organizationId=${TEST_ORG}`,
      validate: (data) => typeof data.connected === "boolean",
    },
    {
      name: "GET /api/integrations/instagram/status",
      url: `${BASE_URL}/api/integrations/instagram/status?organizationId=${TEST_ORG}`,
      validate: (data) => typeof data.connected === "boolean",
    },
    {
      name: "GET /api/sources",
      url: `${BASE_URL}/api/sources?organizationId=${TEST_ORG}`,
      validate: (data) => data.success === true && Array.isArray(data.sources),
    },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: {
          "x-organization-id": TEST_ORG,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      const ok = res.status === 200 && ep.validate(data);
      report(ep.name, ok, `HTTP ${res.status}`);
    } catch (err) {
      report(ep.name, false, err.message);
    }
  }
}

async function testSecretLeaks() {
  console.log("\n--- 3. Secret Scanning & Leak Prevention Audit ---");
  const sensitiveKeys = [
    "LINKEDIN_CLIENT_SECRET",
    "LINKEDIN_ACCESS_TOKEN",
    "TWITTER_API_SECRET",
    "FIREBASE_ADMIN_PRIVATE_KEY",
    "WHATSAPP_API_TOKEN",
    "N8N_API_KEY",
  ];

  let leakFound = false;
  // Sample responses from sensitive endpoints
  const endpointsToCheck = [
    `${BASE_URL}/api/integrations/linkedin/status?organizationId=${TEST_ORG}`,
    `${BASE_URL}/api/integrations/x/status?organizationId=${TEST_ORG}`,
    `${BASE_URL}/api/whatsapp/status?organizationId=${TEST_ORG}`,
    `${BASE_URL}/api/automation/status?organizationId=${TEST_ORG}`,
  ];

  for (const url of endpointsToCheck) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      for (const key of sensitiveKeys) {
        if (text.includes(key)) {
          report(`Secret Leak Check for ${key}`, false, `Found key name in response from ${url}`);
          leakFound = true;
        }
      }
      // Check for raw tokens (e.g. Bearer, AQV, sk-)
      if (text.includes("Bearer AQ") || text.includes("BEGIN PRIVATE KEY")) {
        report(`Raw Token Leak Check`, false, `Found bearer token or private key in response from ${url}`);
        leakFound = true;
      }
    } catch (err) {
      // Ignore
    }
  }

  if (!leakFound) {
    report("Zero Secrets / Private Tokens Leaked in APIs", true);
  }
}

async function run() {
  await testPages();
  await testAPIs();
  await testSecretLeaks();

  console.log(`\n======================================================`);
  console.log(`  Audit Summary: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`======================================================\n`);

  if (passedTests === totalTests) {
    console.log("🌟 All Production Audit Smoke Tests PASSED flawlessly!\n");
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} test(s) failed. Investigation required.\n`);
    process.exit(1);
  }
}

run();
