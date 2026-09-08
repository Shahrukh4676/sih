import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/services/linkedin.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const records = await LinkedInService.getPublishingRecordsByOrg(
      organizationId,
      isNaN(limitParam) ? 50 : limitParam
    );

    return NextResponse.json({
      success: true,
      records,
      count: records.length,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Publishing Records] Error fetching records:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to fetch publishing records" },
      { status: 500 }
    );
  }
}
