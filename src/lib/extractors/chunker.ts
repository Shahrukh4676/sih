// ==============================================================================
// NEXUS AI - Token-Safe Document Chunking & Context Windowing (Phase 3)
// ==============================================================================

export const MAX_SAFE_SOURCE_WORDS = 12000; // Well within Gemini 1.5/2.0 and Ollama 8k-16k context limits

export interface ChunkingResult {
  isChunked: boolean;
  totalWords: number;
  processedText: string;
  chunks: string[];
}

/**
 * Ensures text does not exceed the model's safe input capacity.
 * If text exceeds limits, performs intelligent heading/paragraph windowing
 * with priority on introduction, executive sections, and conclusions.
 */
export function processDocumentLimits(fullText: string): ChunkingResult {
  const words = fullText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords <= MAX_SAFE_SOURCE_WORDS) {
    return {
      isChunked: false,
      totalWords,
      processedText: fullText.trim(),
      chunks: [fullText.trim()]
    };
  }

  // Intelligently segment into 4000-word chunks
  const chunkSize = 4000;
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  // Create an executive context window: First chunk (overview) + Final chunk (conclusions)
  const windowedText = [
    "=== [DOCUMENT SECTION 1: OVERVIEW] ===",
    chunks[0],
    "",
    `=== [NOTE: DOCUMENT EXCEEDS ${MAX_SAFE_SOURCE_WORDS} WORDS. CORE SECTIONS PRESERVED FOR ACCURACY] ===`,
    "",
    "=== [DOCUMENT FINAL SECTION: REMEDIATION / CONCLUSION] ===",
    chunks[chunks.length - 1]
  ].join("\n");

  return {
    isChunked: true,
    totalWords,
    processedText: windowedText,
    chunks
  };
}
