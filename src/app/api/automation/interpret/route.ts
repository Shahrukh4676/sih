import { NextRequest, NextResponse } from "next/server";
import { IntentEngine } from "@/lib/ai/intelligence/intent-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Please provide a description of the workflow you want to automate." },
        { status: 400 }
      );
    }

    const lower = prompt.toLowerCase();
    const intent = IntentEngine.inferIntent(prompt);

    // 1. Ingest Trigger & Source
    let triggerType: "NEW_SOURCE_UPLOADED" | "SCHEDULE" | "NEWS_TOPIC_ALERT" = "NEW_SOURCE_UPLOADED";
    let triggerLabel = "When a new document is uploaded";
    let triggerDetails = "Listens for uploaded research papers, whitepapers, or articles";
    let sourceType: "PDF" | "URL" | "TEXT" | "ALL" = "PDF";
    let sourceLabel = "Research Paper / Document (PDF)";

    if (/every|daily|weekly|schedule|monday|morning|weekday/i.test(lower)) {
      triggerType = "SCHEDULE";
      triggerLabel = "Every weekday at 9:00 AM";
      triggerDetails = "Runs on a recurring schedule to prepare content drafts";
      sourceType = "ALL";
      sourceLabel = "Selected content library & sources";
    } else if (/security advisory|cve|vulnerability|threat|zero-day/i.test(lower)) {
      triggerType = "NEWS_TOPIC_ALERT";
      triggerLabel = "When a security advisory is detected";
      triggerDetails = "Monitors verified vulnerability and disclosure feeds";
      sourceType = "TEXT";
      sourceLabel = "Security advisory text & CVE feeds";
    } else if (/url|website|article|link/i.test(lower)) {
      triggerType = "NEW_SOURCE_UPLOADED";
      triggerLabel = "When a new URL is submitted";
      triggerDetails = "Analyzes web articles and company announcements";
      sourceType = "URL";
      sourceLabel = "Webpage or article URL";
    }

    // 2. Output Format & Intelligence
    let outputFormat = intent.recommendedFormat || "LINKEDIN_POST";
    let outputLabel = "LinkedIn post";
    if (outputFormat === "EXECUTIVE_SUMMARY") outputLabel = "Executive summary";
    if (outputFormat === "CYBERSECURITY_ADVISORY") outputLabel = "Security bulletin & LinkedIn post";
    if (outputFormat === "PRESENTATION") outputLabel = "Presentation slide outline";
    if (outputFormat === "X_THREAD") outputLabel = "Executive briefing & thread";

    // 3. Human Approval Gate
    const approvalRequired = !(/publish automatically|no approval|instant publish/i.test(lower));

    // 4. Proposed Automation Name & Description
    let name = "Content Automation";
    let description = "Automatically prepares content and routes it for review.";

    if (triggerType === "SCHEDULE") {
      name = "Weekly Thought Leadership LinkedIn Brief";
      description = "Every weekday, NEXUS prepares a LinkedIn post from your selected content and queues it for approval.";
    } else if (triggerType === "NEWS_TOPIC_ALERT" || /security/i.test(lower)) {
      name = "Security Advisory → LinkedIn Bulletin";
      description = "When a security advisory is detected, NEXUS generates an executive bulletin and LinkedIn post with full validation.";
    } else if (/paper|research|study|whitepaper/i.test(lower)) {
      name = "Research Paper → LinkedIn Post";
      description = "When a research paper is uploaded, NEXUS synthesizes key findings into a professional LinkedIn post and requests approval.";
    } else {
      name = `${outputLabel} Automation`;
      description = `When new content is provided, transform it into a ${outputLabel.toLowerCase()} and submit for review.`;
    }

    // 5. Visual interpretation pipeline stages
    const visualPipeline = [
      {
        stage: "WHEN",
        title: "Trigger Event",
        description: triggerLabel,
      },
      {
        stage: "UNDERSTAND",
        title: "Semantic Analysis",
        description: `Analyze ${sourceLabel.toLowerCase()} and extract key themes`,
      },
      {
        stage: "TRANSFORM",
        title: "AI Transformation",
        description: `Create ${outputLabel} (${intent.tone.toLowerCase()} tone for ${intent.targetAudience.toLowerCase().replace(/_/g, " ")})`,
      },
      {
        stage: "PROTECT",
        title: "Security & Validation",
        description: "Zero-Trust prompt injection protection, PII screening & factual verification",
      },
      {
        stage: "REVIEW",
        title: "Human Approval",
        description: approvalRequired ? "Require human review before publishing" : "Publish directly after checks pass",
      },
      {
        stage: "DISTRIBUTE",
        title: "Distribution",
        description: "Publish to connected LinkedIn account",
      },
    ];

    return NextResponse.json({
      success: true,
      interpreted: {
        name,
        description,
        triggerType,
        triggerLabel,
        triggerDetails,
        sourceType,
        sourceLabel,
        outputFormat,
        outputLabel,
        tone: intent.tone,
        targetAudience: intent.targetAudience,
        communicationObjective: intent.communicationObjective,
        approvalRequired,
        deliveryTarget: ["LINKEDIN"],
        securityCheckRequired: true,
        conditions: [
          { field: "securityStatus", operator: "EQUALS", value: "Passed" },
          { field: "trustScore", operator: "GREATER_THAN", value: "80" },
        ],
        visualPipeline,
        summary: `When ${triggerLabel.toLowerCase()}, NEXUS analyzes the content, creates a ${outputLabel.toLowerCase()}, runs zero-trust security checks, and ${approvalRequired ? "sends it for your approval before publishing" : "publishes directly to LinkedIn"}.`,
      },
    });
  } catch (error: any) {
    console.error("[API Automation Interpret] Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to interpret workflow. Please try phrasing in simple terms." },
      { status: 500 }
    );
  }
}
