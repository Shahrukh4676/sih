import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, getOrganizationUsers, getUserProfile } from "@/lib/services/users.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const uid = searchParams.get("uid");
    const organizationId = searchParams.get("organizationId");

    if (uid) {
      const user = await getUserProfile(uid);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, user });
    }

    if (organizationId) {
      const users = await getOrganizationUsers(organizationId);
      return NextResponse.json({ success: true, users, count: users.length });
    }

    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("[API Users GET] Error:", errorObj);
    return NextResponse.json(
      { success: false, error: errorObj?.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
