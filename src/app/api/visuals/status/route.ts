// ==============================================================================
// NEXUS AI - GET /api/visuals/status (Phase 4)
// ==============================================================================

import { NextResponse } from "next/server";
import { StorageService } from "@/lib/services/storage.service";

export async function GET() {
  const storageAvailable = await StorageService.isStorageAvailable();

  return NextResponse.json({
    visualRendererAvailable: true,
    engine: "modular-svg-renderer",
    cost: "₹0 - Programmatic Free First",
    supportedVisualTypes: [
      "SOCIAL_CARD",
      "INFOGRAPHIC",
      "QUOTE_CARD",
      "EXECUTIVE_BRIEF",
      "ADVISORY_ALERT"
    ],
    supportedAspectRatios: ["1.91:1", "1:1", "4:5", "9:16", "16:9"],
    storageAvailable,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sih-5172e.firebasestorage.app"
  });
}
