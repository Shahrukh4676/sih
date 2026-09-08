// ==============================================================================
// NEXUS AI - POST /api/visuals/[id]/regenerate (Phase 4)
// ==============================================================================
// Multi-version regeneration: Creates Visual VN+1 without overwriting prior versions.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { VisualsService } from "@/lib/services/visuals.service";
import { getContentById } from "@/lib/services/content.service";
import { getSourceById } from "@/lib/services/sources.service";
import { VisualIntelligenceService } from "@/lib/visuals/visual-intelligence";
import { SvgRenderer } from "@/lib/visuals/svg-renderer";
import { StorageService } from "@/lib/services/storage.service";
import { VisualType, BrandProfile } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // 1. Retrieve Existing Visual Asset
    const priorAsset = await VisualsService.getVisualAssetById(id);
    if (!priorAsset) {
      return NextResponse.json({ error: `Visual asset not found: ${id}` }, { status: 404 });
    }

    // 2. Retrieve Parent Content
    const content = await getContentById(priorAsset.contentId);
    if (!content) {
      return NextResponse.json(
        { error: `Associated content not found: ${priorAsset.contentId}` },
        { status: 404 }
      );
    }

    // 3. Retrieve Source Intelligence for Grounding
    const source = content.sourceId ? await getSourceById(content.sourceId) : null;
    const sourceIntelligence = source?.sourceAnalysis || null;

    const targetVisualType = (body.visualType || priorAsset.assetType) as VisualType;
    const brand = (body.brand || priorAsset.visualBrief?.brand) as BrandProfile;
    const newVersionNumber = (priorAsset.version || 1) + 1;

    // 4. Generate New Visual Brief
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
      preferredVisualType: targetVisualType,
      brand,
      customInstructions: body.customInstructions
    });

    // 5. Render SVG via Programmatic Renderer
    const renderResult = SvgRenderer.render(visualBrief);

    const newAssetId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileName = `${visualBrief.visualType.toLowerCase()}_v${newVersionNumber}.svg`;

    // 6. Upload to Firebase Storage (Clean New File)
    const storageResult = await StorageService.uploadVisualAsset({
      organizationId: priorAsset.organizationId,
      assetId: newAssetId,
      fileName,
      data: renderResult.svg,
      mimeType: "image/svg+xml"
    });

    // 7. Persist New Version (Prior asset remains unmodified)
    const newVisualAsset = await VisualsService.createVisualAsset({
      assetId: newAssetId,
      organizationId: priorAsset.organizationId,
      userId: body.userId || priorAsset.userId,
      contentId: priorAsset.contentId,
      sourceId: priorAsset.sourceId,
      version: newVersionNumber,
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

    if (!newVisualAsset) {
      return NextResponse.json({ error: "Failed to persist regenerated visual asset." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      asset: newVisualAsset,
      priorVersion: priorAsset.version || 1,
      newVersion: newVersionNumber,
      preview: {
        dataUri: renderResult.dataUri,
        aspectRatio: renderResult.aspectRatio,
        width: renderResult.width,
        height: renderResult.height
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error regenerating visual asset";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
