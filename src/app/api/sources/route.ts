import { NextRequest, NextResponse } from "next/server";
import { extractTextFromSource } from "@/lib/extractors/source-extractor";
import { createSource } from "@/lib/services/sources.service";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let rawText = "";
    let fileName = undefined;
    let mimeType = "text/plain";
    let organizationId = "org_default";
    let userId = "usr_anonymous";
    let sourceType: any = "TEXT";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      rawText = body.text || body.content || "";
      fileName = body.fileName;
      mimeType = body.mimeType || "text/plain";
      organizationId = body.organizationId || organizationId;
      userId = body.userId || userId;
      sourceType = body.type || (fileName ? "DOCUMENT" : "TEXT");
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      organizationId = (formData.get("organizationId") as string) || organizationId;
      userId = (formData.get("userId") as string) || userId;

      if (file) {
        fileName = file.name;
        mimeType = file.type || "application/octet-stream";
        sourceType = "DOCUMENT";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extraction = await extractTextFromSource(buffer, mimeType, fileName);
        rawText = extraction.text;
      } else {
        rawText = (formData.get("text") as string) || "";
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Source content is empty. Provide text or valid document." },
        { status: 400 }
      );
    }

    const extraction = await extractTextFromSource(rawText, mimeType, fileName);

    const createdSource = await createSource({
      organizationId,
      userId,
      title: fileName || rawText.split("\n")[0]?.slice(0, 80) || "Ingested Source Intelligence",
      type: sourceType,
      rawContent: rawText,
      originalFileName: fileName,
      extractedText: extraction.text,
      metadata: extraction.metadata as unknown as Record<string, unknown>,
      processingStatus: "EXTRACTED"
    });

    if (!createdSource) {
      return NextResponse.json({ error: "Failed to persist source in database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      source: createdSource,
      extractionSummary: extraction.metadata
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error processing source ingestion";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
