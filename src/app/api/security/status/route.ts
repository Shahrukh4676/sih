// ==============================================================================
// NEXUS AI - GET /api/security/status (Phase 5)
// ==============================================================================

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    engine: "available",
    promptInjectionDetection: true,
    piiDetection: true,
    secretDetection: true,
    outputValidation: true,
    riskDecisionEngine: "deterministic-matrix",
    cost: "₹0 - Built-in Zero-Cost Defense Layer",
    supportedFindingTypes: [
      "PROMPT_INJECTION",
      "PII",
      "SECRET",
      "UNSAFE_INSTRUCTION",
      "UNSUPPORTED_CLAIM"
    ]
  });
}
