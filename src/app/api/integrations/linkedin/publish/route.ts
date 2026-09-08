import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contentId,
      versionId = "v1",
      organizationId,
      eventId,
      userId,
      securityDecision,
      overrideContent,
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

    const result = await LinkedInService.publishApprovedContent({
      contentId,
      versionId,
      organizationId,
      userId: effectiveUserId,
      eventId,
      securityDecision,
      overrideContent,
    });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        CONTENT_NOT_FOUND: 404,
        CROSS_TENANT_ACCESS_DENIED: 403,
        UNAPPROVED_CONTENT: 400,
        SECURITY_BLOCKED: 403,
        CONTENT_TOO_LONG: 422,
        LINKEDIN_NOT_CONNECTED: 400,
        LINKEDIN_TOKEN_EXPIRED: 401,
        LINKEDIN_TOKEN_INVALID: 401,
        LINKEDIN_PERMISSION_DENIED: 403,
      };

      const httpStatus = statusMap[result.errorCode || ""] || 400;

      return NextResponse.json(
        {
          success: false,
          status: result.status,
          errorCode: result.errorCode,
          code: result.errorCode,
          error: result.error,
        },
        { status: httpStatus }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      channel: "linkedin",
      postId: result.externalPostId,
      externalPostId: result.externalPostId,
      postUrl: result.publishedUrl,
      publishedUrl: result.publishedUrl,
      recordId: result.recordId,
      publishedAt: new Date().toISOString(),
      duplicate: result.duplicate || false,
      idempotent: result.duplicate || false,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[LinkedIn Publish] Server error during publish:", errorObj);
    return NextResponse.json(
      { success: false, status: "FAILED", error: errorObj?.message || "Internal publish error" },
      { status: 500 }
    );
  }
}
