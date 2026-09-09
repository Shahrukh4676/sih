import { NextRequest, NextResponse } from "next/server";
import { getAuditLogsByOrg } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const limitParam = searchParams.get("limit");
    const maxLimit = limitParam ? parseInt(limitParam, 10) : 50;

    const logs = await getAuditLogsByOrg(organizationId, maxLimit);

    const res = NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Audit API] Error fetching audit logs:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId = "org_primary",
      userId = "usr_admin",
      userEmail = "admin@nexus.ai",
      userRole = "ADMIN",
      action,
      resourceType = "SYSTEM",
      resourceId = "sys_default",
      severity = "INFO",
      ipAddress = "127.0.0.1",
      userAgent = "NEXUS-Client",
      details = {},
    } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Missing required field: action" },
        { status: 400 }
      );
    }

    const { logAuditEvent } = await import("@/lib/services/audit.service");
    const logId = await logAuditEvent({
      organizationId,
      userId,
      userEmail,
      userRole,
      action,
      resourceType,
      resourceId,
      severity,
      ipAddress,
      userAgent,
      details,
    });

    const res = NextResponse.json({
      success: true,
      logId,
      action,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[Audit API] Error logging audit event:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to record audit event" },
      { status: 500 }
    );
  }
}

