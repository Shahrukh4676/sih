import { NextRequest, NextResponse } from "next/server";
import { NewsService } from "@/lib/services/news.service";
import { SupportedOutputFormat } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headerOrg = req.headers.get("x-organization-id");
    const {
      newsId,
      organizationId = headerOrg || "org_primary",
      userId = "usr_creator",
      userEmail = "user@nexus.ai",
      targetFormat = "LINKEDIN_POST",
      tone = "PROFESSIONAL",
      targetAudience = "TECHNICAL",
      customInstructions,
    } = body;

    if (!newsId) {
      return NextResponse.json({ success: false, error: "Missing required parameter: newsId" }, { status: 400 });
    }

    const validFormats: SupportedOutputFormat[] = [
      "LINKEDIN_POST",
      "X_THREAD",
      "EXECUTIVE_SUMMARY",
      "CYBERSECURITY_ADVISORY",
      "PRESENTATION",
    ];

    if (!validFormats.includes(targetFormat)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid targetFormat '${targetFormat}'. Supported formats: ${validFormats.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await NewsService.transformNewsToArtefact({
      newsId,
      organizationId,
      userId,
      userEmail,
      targetFormat,
      tone,
      targetAudience,
      customInstructions,
    });

    return NextResponse.json({
      success: true,
      content: result.content,
      sourceId: result.sourceId,
      newsItem: result.newsItem,
      message: `Successfully synthesized news into ${targetFormat.replace("_", " ")}`,
    });
  } catch (error: any) {
    console.error("[API News Transform] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to transform news intelligence" },
      { status: 500 }
    );
  }
}
