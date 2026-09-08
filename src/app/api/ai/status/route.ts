import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/ai.service";

export async function GET() {
  try {
    const status = await AIService.getStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error checking AI status";
    return NextResponse.json(
      {
        provider: "unknown",
        available: false,
        error: msg
      },
      { status: 500 }
    );
  }
}
