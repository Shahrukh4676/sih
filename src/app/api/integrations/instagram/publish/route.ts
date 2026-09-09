import { NextRequest, NextResponse } from "next/server";
import { InstagramService } from "@/lib/services/instagram.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contentId,
      versionId = "v1",
      organizationId,
      userId,
      overrideCaption,
      imageUrl,
      tags,
    } = body;

    if (!contentId || !organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: contentId, organizationId" },
        { status: 400 }
      );
    }

    const effectiveUserId =
      userId ||
      req.headers.get("x-user-id") ||
      undefined;

    const result = await InstagramService.publishToInstagram({
      contentId,
      versionId,
      organizationId,
      userId: effectiveUserId,
      overrideCaption,
      imageUrl,
      tags,
    });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        CONTENT_NOT_FOUND: 404,
        CONTENT_NOT_APPROVED: 400,
        EMPTY_CONTENT: 400,
        INSTAGRAM_NOT_CONNECTED: 400,
        INSTAGRAM_API_ERROR: 500,
      };

      const httpStatus = statusMap[result.errorCode || ""] || 400;

      return NextResponse.json(
        {
          success: false,
          status: result.status,
          errorCode: result.errorCode,
          error: result.error,
        },
        { status: httpStatus }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      channel: "instagram",
      postId: result.externalPostId,
      externalPostId: result.externalPostId,
      postUrl: result.publishedUrl,
      publishedUrl: result.publishedUrl,
      recordId: result.recordId,
      publishedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Instagram Publish] Server error during publish:", errorObj);
    return NextResponse.json(
      { success: false, status: "FAILED", error: errorObj?.message || "Internal publish error" },
      { status: 500 }
    );
  }
}
