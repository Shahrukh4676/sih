// ==============================================================================
// NEXUS AI - POST /api/visuals/generate (Phase 4)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getContentById } from "@/lib/services/content.service";
import { getSourceById } from "@/lib/services/sources.service";
import { VisualIntelligenceService } from "@/lib/visuals/visual-intelligence";
import { SvgRenderer } from "@/lib/visuals/svg-renderer";
import { StorageService } from "@/lib/services/storage.service";
import { VisualsService } from "@/lib/services/visuals.service";
import { VisualType, BrandProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contentId,
      visualType,
      brand,
      organizationId = "org_default",
      userId = "usr_anonymous",
      customInstructions
    } = body;

    if (!contentId) {
      return NextResponse.json({ error: "Missing required field: contentId" }, { status: 400 });
    }

    // 1. Retrieve Content
    const content = await getContentById(contentId);
    if (!content) {
      return NextResponse.json({ error: `Content not found: ${contentId}` }, { status: 404 });
    }

    // 2. Multi-tenant boundary verification
    if (content.organizationId && organizationId !== "org_default" && content.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have access to this organization's content." },
        { status: 403 }
      );
    }

    const orgId = content.organizationId || organizationId;

    // 3. Retrieve Source Intelligence for strict grounding
    const source = content.sourceId ? await getSourceById(content.sourceId) : null;
    const sourceIntelligence = source?.sourceAnalysis || null;

    // 4. Generate Grounded Visual Brief
    const visualBrief = VisualIntelligenceService.generateBrief({
      content: {
        id: content.id,
        title: content.title,
        content: content.currentVersion?.body || content.content || "",
        outputFormat: content.outputFormat,
        targetAudience: content.targetAudience,
        tone: content.tone
      },
      sourceIntelligence,
      preferredVisualType: visualType as VisualType,
      brand: brand as BrandProfile,
      customInstructions
    });

    // 5. Render SVG via Programmatic Zero-Cost Engine
    const renderResult = SvgRenderer.render(visualBrief);

    const assetId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileName = `${visualBrief.visualType.toLowerCase()}_v1.svg`;

    // 6. Upload to Firebase Storage with Organization Segregation
    const storageResult = await StorageService.uploadVisualAsset({
      organizationId: orgId,
      assetId,
      fileName,
      data: renderResult.svg,
      mimeType: "image/svg+xml"
    });

    // 7. Persist Metadata in Firestore
    const visualAsset = await VisualsService.createVisualAsset({
      assetId,
      organizationId: orgId,
      userId,
      contentId,
      sourceId: content.sourceId || "",
      version: 1,
      assetType: visualBrief.visualType,
      fileName,
      storagePath: storageResult.storagePath,
      publicUrl: storageResult.publicUrl,
      svgContent: renderResult.svg,
      mimeType: "image/svg+xml",
      width: visualBrief.width,
      height: visualBrief.height,
      aspectRatio: visualBrief.aspectRatio,
      visualBrief,
      altText: visualBrief.accessibilityText,
      generationMethod: "SVG_TEMPLATE",
      status: "GENERATED"
    });

    if (!visualAsset) {
      return NextResponse.json({ error: "Failed to persist visual asset metadata." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      asset: visualAsset,
      preview: {
        dataUri: renderResult.dataUri,
        aspectRatio: renderResult.aspectRatio,
        width: renderResult.width,
        height: renderResult.height
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating visual asset";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
