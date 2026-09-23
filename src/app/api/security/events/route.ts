import { NextRequest, NextResponse } from "next/server";
import { SecurityService } from "@/lib/services/security.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const events = await SecurityService.getSecurityEventsByOrg(organizationId, isNaN(limitParam) ? 50 : limitParam);

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[API Security Events GET] Error:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to fetch security events" },
      { status: 500 }
    );
  }
}
