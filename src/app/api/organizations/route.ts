import { NextRequest, NextResponse } from "next/server";
import { getAllOrganizations, getOrganization, createOrganization } from "@/lib/services/organizations.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const orgId = searchParams.get("id");

    if (orgId) {
      const org = await getOrganization(orgId);
      if (!org) {
        return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, organization: org });
    }

    const organizations = await getAllOrganizations();
    return NextResponse.json({
      success: true,
      organizations,
      count: organizations.length,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[API Organizations GET] Error:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, userId" },
        { status: 400 }
      );
    }

    const org = await createOrganization(name, userId);
    if (!org) {
      return NextResponse.json(
        { success: false, error: "Failed to create organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[API Organizations POST] Error:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to create organization" },
      { status: 500 }
    );
  }
}
