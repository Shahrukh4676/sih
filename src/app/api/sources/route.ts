import { NextRequest, NextResponse } from "next/server";
import { extractTextFromSource } from "@/lib/extractors/source-extractor";
import { createSource, getSourcesByOrg } from "@/lib/services/sources.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      req.headers.get("x-organization-id") ||
      searchParams.get("organizationId") ||
      "org_primary";

    const sources = await getSourcesByOrg(organizationId);

    return NextResponse.json({
      success: true,
      sources,
      count: sources.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrieving sources";
    console.error("[Sources API] GET error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headerOrg = req.headers.get("x-organization-id");
    const contentType = req.headers.get("content-type") || "";
    let rawText = "";
    let fileName = undefined;
    let mimeType = "text/plain";
    let organizationId = headerOrg || "org_primary";
    let userId = "usr_anonymous";
    let sourceType: any = "TEXT";

    let originUrl: string | undefined = undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      rawText = body.text || body.content || "";
      fileName = body.fileName;
      mimeType = body.mimeType || "text/plain";
      organizationId = headerOrg || body.organizationId || organizationId;
      userId = body.userId || userId;
      sourceType = body.type || (fileName ? "DOCUMENT" : "TEXT");

      if (body.url) {
        const targetUrl = String(body.url).trim();
        originUrl = targetUrl;
        sourceType = "URL";
        // Basic SSRF protection
        try {
          const parsed = new URL(targetUrl);
          const hostname = parsed.hostname.toLowerCase();
          if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "::1" ||
            hostname.startsWith("10.") ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("169.254.") ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
          ) {
            return NextResponse.json(
              { success: false, error: "SSRF Protection: Access to private networks is forbidden." },
              { status: 400 }
            );
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const resp = await fetch(targetUrl, {
            signal: controller.signal,
            headers: { "User-Agent": "NexusAI-ContentIntelligence/2.0" },
          });
          clearTimeout(timeoutId);

          if (!resp.ok) {
            return NextResponse.json(
              { success: false, error: `Failed to fetch remote URL: HTTP ${resp.status}` },
              { status: 400 }
            );
          }

          const html = await resp.text();
          // Extract text by stripping script/style/tags
          rawText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
        } catch (fetchErr: any) {
          return NextResponse.json(
            { success: false, error: `Unable to read remote URL: ${fetchErr?.message || "Timeout or unreachable"}` },
            { status: 400 }
          );
        }
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      organizationId =
        headerOrg || (formData.get("organizationId") as string) || organizationId;
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
        { success: false, error: "Source content is empty. Provide text or valid document." },
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
      return NextResponse.json(
        { success: false, error: "Failed to persist source in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: createdSource,
      extractionSummary: extraction.metadata
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error processing source ingestion";
    console.error("[Sources API] POST error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
