import { NextRequest, NextResponse } from "next/server";
import { NewsService } from "@/lib/services/news.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";
    const preferences = await NewsService.getPreferences(organizationId);
    return NextResponse.json({ success: true, preferences });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId =
      req.headers.get("x-organization-id") ||
      body.organizationId ||
      "org_primary";
    const { subscribedTopics, customFeeds } = body;

    if (!Array.isArray(subscribedTopics)) {
      return NextResponse.json(
        { success: false, error: "subscribedTopics must be an array of strings" },
        { status: 400 }
      );
    }

    const preferences = await NewsService.updatePreferences(
      organizationId,
      subscribedTopics,
      customFeeds
    );

    return NextResponse.json({
      success: true,
      preferences,
      message: "Preferences updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}
