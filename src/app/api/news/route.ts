import { NextRequest, NextResponse } from "next/server";
import { NewsService } from "@/lib/services/news.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const organizationId = searchParams.get("organizationId") || "org_primary";
    const category = searchParams.get("category") || undefined;
    const searchQuery = searchParams.get("search") || searchParams.get("q") || undefined;
    const forceRefresh = searchParams.get("refresh") === "true";
    const limitParam = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 30;

    const result = await NewsService.getNews(organizationId, {
      category,
      searchQuery,
      forceRefresh,
      limit: limitParam,
    });

    return NextResponse.json({
      success: true,
      items: result.items,
      preferences: result.preferences,
      total: result.items.length,
    });
  } catch (error: any) {
    console.error("[API News GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch news feed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId = "org_primary", customFeedUrl, topics } = body;

    if (customFeedUrl) {
      const prefs = await NewsService.getPreferences(organizationId);
      const updatedFeeds = Array.from(new Set([...(prefs.customFeeds || []), customFeedUrl]));
      const updatedPrefs = await NewsService.updatePreferences(organizationId, prefs.subscribedTopics, updatedFeeds);
      const synced = await NewsService.syncFeeds(organizationId);
      return NextResponse.json({
        success: true,
        message: `Successfully added custom feed: ${customFeedUrl}`,
        preferences: updatedPrefs,
        syncedCount: synced.length,
      });
    }

    if (topics && Array.isArray(topics)) {
      const updatedPrefs = await NewsService.updatePreferences(organizationId, topics);
      return NextResponse.json({
        success: true,
        message: "Preferences updated successfully",
        preferences: updatedPrefs,
      });
    }

    // Default trigger sync
    const synced = await NewsService.syncFeeds(organizationId);
    return NextResponse.json({
      success: true,
      message: "Feeds synced successfully",
      syncedCount: synced.length,
    });
  } catch (error: any) {
    console.error("[API News POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update news configuration" },
      { status: 500 }
    );
  }
}
