import { NextRequest, NextResponse } from "next/server";
import { verifyAuditChain } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const result = await verifyAuditChain(organizationId);

    const res = NextResponse.json({
      success: true,
      ...result,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Audit Verify] Error validating audit chain:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to verify audit chain" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty
    }

    const organizationId =
      (body.organizationId as string) ||
      req.headers.get("x-organization-id") ||
      "org_primary";

    const result = await verifyAuditChain(organizationId);

    const res = NextResponse.json({
      success: true,
      ...result,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Audit Verify] Error validating audit chain:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to verify audit chain" },
      { status: 500 }
    );
  }
}
