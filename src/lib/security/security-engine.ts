// ==============================================================================
// NEXUS AI - Security Intelligence & Content Safety Engine (Phase 5)
// ==============================================================================
// Independent, zero-cost, deterministic security screening layer.
// Performs pre-ingestion screening, prompt injection classification, PII/Secret
// detection with strict evidence masking, and output validation.
// ==============================================================================

import {
  SecurityFinding,
  SecurityDecision,
  SecurityRiskLevel,
  SecurityDecisionAction,
  SecurityFindingType
} from "@/types";
import { StructuredSourceIntelligence } from "../ai/types";

export class SecurityEngine {
  /**
   * Scans raw source content and produces a comprehensive SecurityDecision
   */
  public static scanSource(
    text: string,
    context?: { organizationId?: string; userId?: string; sourceId?: string }
  ): SecurityDecision {
    if (!text || typeof text !== "string") {
      return {
        decision: "ALLOW",
        riskLevel: "LOW",
        reasons: ["Empty or non-text source provided."],
        requiresHumanReview: false,
        findings: [],
        summary: "No content to screen.",
        checkedAt: new Date().toISOString()
      };
    }

    const findings: SecurityFinding[] = [];

    // 1. Detect Secrets (Credentials, API keys, Private keys)
    findings.push(...this.detectSecrets(text));

    // 2. Detect Prompt Injections & Adversarial Instructions
    findings.push(...this.detectPromptInjection(text));

    // 3. Detect Sensitive Data / PII
    findings.push(...this.detectSensitiveData(text));

    // 4. Calculate Risk & Formulate Decision
    return this.makeSecurityDecision(findings);
  }

  /**
   * Scans generated AI output for leaked secrets, leaked PII, system prompt leakage, and grounding anomalies
   */
  public static validateGeneratedContent(
    content: string,
    sourceAnalysis?: StructuredSourceIntelligence | null
  ): SecurityDecision {
    if (!content) {
      return {
        decision: "ALLOW",
        riskLevel: "LOW",
        reasons: ["Empty content."],
        requiresHumanReview: false,
        findings: [],
        summary: "No generated content to validate.",
        checkedAt: new Date().toISOString()
      };
    }

    const findings: SecurityFinding[] = [];

    // 1. Check for Leaked Secrets in AI Output
    const secrets = this.detectSecrets(content);
    if (secrets.length > 0) {
      findings.push(
        ...secrets.map((s) => ({
          ...s,
          description: `AI Output Security Violation: Potential credential leakage detected in generated text. (${s.description})`,
          recommendedAction: "BLOCK immediately and quarantine content from review queue."
        }))
      );
    }

    // 2. Check for Leaked PII in Output
    const pii = this.detectSensitiveData(content);
    if (pii.length > 0) {
      findings.push(
        ...pii.map((p) => ({
          ...p,
          description: `AI Output Privacy Violation: PII appeared in generated output. (${p.description})`,
          recommendedAction: "Submit for Human-in-the-Loop review and redact sensitive entities before publishing."
        }))
      );
    }

    // 3. Check for System Prompt / Developer leakage in output
    const sysPromptRegex = /(?:you are an ai assistant|i am programmed to|my instructions are|system prompt revealed|as an ai model developed by)/i;
    const sysMatch = content.match(sysPromptRegex);
    if (sysMatch) {
      findings.push({
        id: `fnd_${Date.now()}_sysleak`,
        type: "UNSAFE_INSTRUCTION",
        severity: "HIGH",
        description: "AI Output Integrity Alert: System persona or instruction leakage detected in response.",
        evidence: sysMatch[0],
        recommendedAction: "Regenerate artefact with stricter system XML boundary isolation."
      });
    }

    // 4. Source Grounding Validation (Deterministic check)
    if (sourceAnalysis) {
      const sourceTopicWords = (sourceAnalysis.main_topic || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const titleWords = (sourceAnalysis.title || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const allAnchors = [...sourceTopicWords, ...titleWords];

      const contentLower = content.toLowerCase();
      const hasTopicAnchor = allAnchors.some((anchor) => contentLower.includes(anchor));

      if (allAnchors.length > 0 && !hasTopicAnchor) {
        findings.push({
          id: `fnd_${Date.now()}_grounding`,
          type: "UNSUPPORTED_CLAIM",
          severity: "MEDIUM",
          description: "Source-Grounding Validation Notice: Generated content does not explicitly anchor to primary source topic.",
          evidence: `Expected anchors from source: ${allAnchors.slice(0, 3).join(", ")}`,
          recommendedAction: "Review content for factual drift or hallucination against source intelligence."
        });
      }
    }

    return this.makeSecurityDecision(findings);
  }

  /**
   * Scans for adversarial instructions, jailbreak attempts, and prompt injection signatures
   */
  public static detectPromptInjection(text: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    const injectionPatterns: Array<{ regex: RegExp; description: string }> = [
      {
        regex: /\b(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|prompts|commands)\b/i,
        description: "Instruction Override Attempt (Ignore previous instructions)"
      },
      {
        regex: /\b(?:system\s+prompt|developer\s+mode|developer\s+message|reveal\s+(?:system\s+)?(?:instructions|prompt|secrets))\b/i,
        description: "System Prompt Extraction Attempt"
      },
      {
        regex: /\b(?:DAN:\s*|do\s+anything\s+now|you\s+are\s+now\s+in\s+jailbreak\s+mode|override\s+(?:all\s+)?(?:rules|safeguards))\b/i,
        description: "Jailbreak / Persona Override Pattern"
      },
      {
        regex: /\b(?:execute\s+(?:powershell|bash|cmd|command|script)|rm\s+-rf|DROP\s+TABLE)\b/i,
        description: "Arbitrary Command Execution Attempt"
      },
      {
        regex: /<(?:system_instruction|assistant_instruction|admin_override)>/i,
        description: "Fabricated XML Boundary Tag Injection"
      }
    ];

    injectionPatterns.forEach((pattern, idx) => {
      const match = text.match(pattern.regex);
      if (match) {
        const matchedSnippet = match[0];
        findings.push({
          id: `fnd_inj_${Date.now()}_${idx}`,
          type: "PROMPT_INJECTION",
          severity: "HIGH",
          description: `Prompt Injection Detected: ${pattern.description}. Source text contains adversarial control directives.`,
          evidence: `"${matchedSnippet.slice(0, 60)}"`,
          location: `Index ~${match.index}`,
          recommendedAction: "Flag for human review. Source content must be quarantined inside passive data boundaries."
        });
      }
    });

    return findings;
  }

  /**
   * Detects PII and sensitive privacy entities, strictly masking evidence before returning
   */
  public static detectSensitiveData(text: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // 1. Email addresses
    const emailRegex = /\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g;
    let emailMatch: RegExpExecArray | null;
    let emailCount = 0;
    while ((emailMatch = emailRegex.exec(text)) !== null && emailCount < 3) {
      emailCount++;
      const userPart = emailMatch[1];
      const domainPart = emailMatch[2];
      const maskedEmail = `${userPart.charAt(0)}***@${domainPart}`;
      findings.push({
        id: `fnd_pii_email_${Date.now()}_${emailCount}`,
        type: "PII",
        severity: "MEDIUM",
        description: "Personal Identifiable Information (PII): Email address detected.",
        evidence: maskedEmail,
        location: `Index ~${emailMatch.index}`,
        recommendedAction: "Redact or obtain consent prior to external publishing."
      });
    }

    // 2. Phone numbers (e.g. +1 555-123-4567, 555-123-4567)
    const phoneRegex = /\b(?:\+?[0-9]{1,3}[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
    let phoneMatch: RegExpExecArray | null;
    let phoneCount = 0;
    while ((phoneMatch = phoneRegex.exec(text)) !== null && phoneCount < 3) {
      phoneCount++;
      const raw = phoneMatch[0];
      const lastFour = raw.slice(-4);
      const maskedPhone = `***-***-${lastFour}`;
      findings.push({
        id: `fnd_pii_phone_${Date.now()}_${phoneCount}`,
        type: "PII",
        severity: "MEDIUM",
        description: "Personal Identifiable Information (PII): Phone number detected.",
        evidence: maskedPhone,
        location: `Index ~${phoneMatch.index}`,
        recommendedAction: "Redact prior to external distribution."
      });
    }

    // 3. Credit / Debit card patterns (16 digits)
    const ccRegex = /\b(?:\d{4}[-\s]?){3}(\d{4})\b/g;
    let ccMatch: RegExpExecArray | null;
    while ((ccMatch = ccRegex.exec(text)) !== null) {
      const lastFour = ccMatch[1];
      findings.push({
        id: `fnd_pii_cc_${Date.now()}`,
        type: "PII",
        severity: "CRITICAL",
        description: "Payment Card Information Detected: 16-digit card sequence found.",
        evidence: `****-****-****-${lastFour}`,
        location: `Index ~${ccMatch.index}`,
        recommendedAction: "BLOCK and purge immediately from storage."
      });
    }

    // 4. SSN / Government ID patterns (XXX-XX-XXXX)
    const ssnRegex = /\b\d{3}[-\s]\d{2}[-\s](\d{4})\b/g;
    let ssnMatch: RegExpExecArray | null;
    while ((ssnMatch = ssnRegex.exec(text)) !== null) {
      const lastFour = ssnMatch[1];
      findings.push({
        id: `fnd_pii_ssn_${Date.now()}`,
        type: "PII",
        severity: "HIGH",
        description: "Government Identifier Detected (SSN/National ID pattern).",
        evidence: `***-**-${lastFour}`,
        location: `Index ~${ssnMatch.index}`,
        recommendedAction: "Redact immediately to maintain privacy compliance."
      });
    }

    return findings;
  }

  /**
   * Detects secret-like patterns (API keys, private keys, passwords, JWTs, AWS keys).
   * NEVER logs or stores the raw secret. Only returns masked evidence.
   */
  public static detectSecrets(text: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // 1. Explicit Key-Value assignments (API_KEY=..., PASSWORD=..., SECRET=...)
    const kvRegex = /\b(API_KEY|APIKEY|ACCESS_KEY|SECRET_KEY|SECRET|PASSWORD|PASSWD|TOKEN|AUTH_TOKEN)\s*[:=]\s*["']?([a-zA-Z0-9_\-.~+/=]{8,})["']?/gi;
    let kvMatch: RegExpExecArray | null;
    while ((kvMatch = kvRegex.exec(text)) !== null) {
      const keyName = kvMatch[1].toUpperCase();
      findings.push({
        id: `fnd_sec_kv_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        description: `Exposed Credential Detected: Explicit key assignment for ${keyName}.`,
        evidence: `${keyName}=********`,
        location: `Index ~${kvMatch.index}`,
        recommendedAction: "BLOCK content and revoke/rotate exposed credential immediately."
      });
    }

    // 2. Bearer Tokens
    const bearerRegex = /\bBearer\s+([a-zA-Z0-9_\-\.]{15,})\b/gi;
    let bearerMatch: RegExpExecArray | null;
    while ((bearerMatch = bearerRegex.exec(text)) !== null) {
      findings.push({
        id: `fnd_sec_bearer_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        description: "Exposed Authentication Token: HTTP Bearer authorization token detected.",
        evidence: "Bearer **********",
        location: `Index ~${bearerMatch.index}`,
        recommendedAction: "BLOCK processing, invalidate token, and notify security team."
      });
    }

    // 3. Private Keys (RSA / OpenSSH / Generic)
    const privateKeyRegex = /-----BEGIN\s+(?:RSA|OPENSSH|DSA|EC|PGP)?\s*PRIVATE\s+KEY-----/i;
    const pkMatch = text.match(privateKeyRegex);
    if (pkMatch) {
      findings.push({
        id: `fnd_sec_pk_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        description: "Private Cryptographic Key Detected: Unencrypted private key block found.",
        evidence: "-----BEGIN PRIVATE KEY... [REDACTED]-----",
        location: `Index ~${pkMatch.index}`,
        recommendedAction: "BLOCK immediately and initiate cryptographic key rotation protocol."
      });
    }

    // 4. AWS Access Key IDs (AKIA...)
    const awsRegex = /\b(AKIA[0-9A-Z]{16})\b/g;
    let awsMatch: RegExpExecArray | null;
    while ((awsMatch = awsRegex.exec(text)) !== null) {
      findings.push({
        id: `fnd_sec_aws_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        description: "AWS Cloud Credential Detected: IAM Access Key ID pattern identified.",
        evidence: "AKIA****************",
        location: `Index ~${awsMatch.index}`,
        recommendedAction: "BLOCK content and trigger AWS IAM credential rotation."
      });
    }

    // 5. GitHub Personal Access Tokens (ghp_...)
    const githubRegex = /\b(ghp_[a-zA-Z0-9]{36})\b/g;
    let ghMatch: RegExpExecArray | null;
    while ((ghMatch = githubRegex.exec(text)) !== null) {
      findings.push({
        id: `fnd_sec_gh_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        description: "GitHub Access Token Detected: Personal Access Token (PAT) identified.",
        evidence: "ghp_****************",
        location: `Index ~${ghMatch.index}`,
        recommendedAction: "BLOCK content and revoke GitHub token immediately."
      });
    }

    // 6. JSON Web Tokens (JWT)
    const jwtRegex = /\b(eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})\b/g;
    let jwtMatch: RegExpExecArray | null;
    while ((jwtMatch = jwtRegex.exec(text)) !== null) {
      findings.push({
        id: `fnd_sec_jwt_${Date.now()}`,
        type: "SECRET",
        severity: "CRITICAL",
        description: "JSON Web Token (JWT) Detected: Signed identity token found.",
        evidence: "eyJ********.eyJ********.[REDACTED]",
        location: `Index ~${jwtMatch.index}`,
        recommendedAction: "BLOCK content and inspect signing authority for token revocation."
      });
    }

    return findings;
  }

  /**
   * Deterministic Risk Calculation and Decision Engine
   */
  public static makeSecurityDecision(findings: SecurityFinding[]): SecurityDecision {
    const reasons: string[] = [];
    let riskLevel: SecurityRiskLevel = "LOW";
    let decision: SecurityDecisionAction = "ALLOW";
    let requiresHumanReview = false;

    const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
    const highCount = findings.filter((f) => f.severity === "HIGH").length;
    const mediumCount = findings.filter((f) => f.severity === "MEDIUM").length;

    // Rule 1: Any CRITICAL finding (Secret or Payment Card data) -> BLOCK
    if (criticalCount > 0) {
      riskLevel = "CRITICAL";
      decision = "BLOCK";
      requiresHumanReview = true;
      findings
        .filter((f) => f.severity === "CRITICAL")
        .forEach((f) => reasons.push(`Critical Violation: ${f.description}`));
    }
    // Rule 2: Multiple distinct categories of HIGH findings (e.g. Prompt Injection + SSN, or Unsafe Commands) -> BLOCK
    else if (
      findings.some((f) => f.type === "PROMPT_INJECTION") &&
      findings.some((f) => f.type === "PII" && f.severity === "HIGH")
    ) {
      riskLevel = "CRITICAL";
      decision = "BLOCK";
      requiresHumanReview = true;
      reasons.push("Multiple distinct high-severity security findings detected (Adversarial Injection + Government PII).");
      findings
        .filter((f) => f.severity === "HIGH")
        .forEach((f) => reasons.push(`High Threat: ${f.description}`));
    }
    // Rule 3: Prompt Injection Detected -> HIGH, REVIEW (Source documents are data; never executed as instructions)
    else if (findings.some((f) => f.type === "PROMPT_INJECTION") || highCount > 0) {
      riskLevel = "HIGH";
      decision = "REVIEW";
      requiresHumanReview = true;
      findings
        .filter((f) => f.severity === "HIGH")
        .forEach((f) => reasons.push(`High Security Threat: ${f.description}`));
    }
    // Rule 4: Potential PII or Grounding notice -> REVIEW
    else if (mediumCount > 0) {
      riskLevel = "MEDIUM";
      decision = "REVIEW";
      requiresHumanReview = true;
      findings
        .filter((f) => f.severity === "MEDIUM")
        .forEach((f) => reasons.push(`Privacy/Compliance Notice: ${f.description}`));
    }
    // Rule 5: Clean source
    else {
      riskLevel = "LOW";
      decision = "ALLOW";
      requiresHumanReview = false;
      reasons.push("All AI-assisted security screening checks passed clean.");
    }

    const summary = `${decision}: Risk evaluated as ${riskLevel} (${findings.length} findings).`;

    return {
      decision,
      riskLevel,
      reasons,
      requiresHumanReview,
      findings,
      summary,
      checkedAt: new Date().toISOString()
    };
  }
}
