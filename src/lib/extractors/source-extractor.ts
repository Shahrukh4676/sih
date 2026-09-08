// ==============================================================================
// NEXUS AI - Unified Source Extraction Service (Phase 3)
// ==============================================================================

import { processDocumentLimits, ChunkingResult } from "./chunker";

export interface ExtractionMetadata {
  originalFileName?: string;
  mimeType: string;
  charCount: number;
  wordCount: number;
  estimatedReadTimeMinutes: number;
  isChunked: boolean;
}

export interface ExtractedSourceResult {
  text: string;
  metadata: ExtractionMetadata;
  chunkingInfo: ChunkingResult;
}

/**
 * Normalizes text content: strips null bytes, handles carriage returns,
 * and collapses excessive blank lines.
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\0/g, "") // remove null bytes
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Lightweight text extractor from raw string, TXT, PDF text buffer, or DOCX text.
 */
export async function extractTextFromSource(
  input: string | Buffer,
  mimeType: string = "text/plain",
  fileName?: string
): Promise<ExtractedSourceResult> {
  let rawText = "";

  if (typeof input === "string") {
    rawText = input;
  } else if (Buffer.isBuffer(input)) {
    if (mimeType.includes("text") || mimeType.includes("json") || mimeType.includes("markdown")) {
      rawText = input.toString("utf-8");
    } else if (mimeType.includes("pdf")) {
      // Basic text stream extractor from PDF buffers
      rawText = extractPdfTextStream(input);
    } else if (mimeType.includes("wordprocessingml") || mimeType.includes("docx")) {
      // Basic text extractor from DOCX XML
      rawText = extractDocxXmlText(input);
    } else {
      rawText = input.toString("utf-8");
    }
  }

  const normalized = normalizeExtractedText(rawText);
  const chunkingInfo = processDocumentLimits(normalized);
  const words = chunkingInfo.processedText.split(/\s+/).filter(Boolean);

  const metadata: ExtractionMetadata = {
    originalFileName: fileName,
    mimeType,
    charCount: chunkingInfo.processedText.length,
    wordCount: words.length,
    estimatedReadTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
    isChunked: chunkingInfo.isChunked
  };

  return {
    text: chunkingInfo.processedText,
    metadata,
    chunkingInfo
  };
}

/**
 * Parses printable text streams out of a PDF buffer without native binary dependencies
 */
function extractPdfTextStream(buf: Buffer): string {
  const rawStr = buf.toString("latin1");
  const textChunks: string[] = [];
  
  // Look for text within BT (begin text) and ET (end text) operators or literal strings ( ... )
  const textPattern = /\(([^)]+)\)\s*T[jJ]/g;
  let match;
  while ((match = textPattern.exec(rawStr)) !== null) {
    textChunks.push(match[1]);
  }

  if (textChunks.length > 0) {
    return textChunks.join(" ");
  }

  // Fallback to extracting printable ASCII strings
  return rawStr.replace(/[^\x20-\x7E\n\t]/g, " ");
}

/**
 * Parses text out of a DOCX (ZIP) XML document stream
 */
function extractDocxXmlText(buf: Buffer): string {
  const rawStr = buf.toString("utf-8");
  // Extract text tags <w:t>...</w:t> commonly found in document.xml
  const matches = rawStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  if (matches && matches.length > 0) {
    return matches
      .map((tag) => tag.replace(/<[^>]+>/g, ""))
      .join(" ");
  }
  return rawStr.replace(/<[^>]+>/g, " ");
}
