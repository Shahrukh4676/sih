import "server-only";
import { getSecret } from "@/lib/server-env";
import {
  AIProvider,
  StructuredSourceIntelligence,
  TransformationOptions,
  TransformationResult,
  ProviderHealth
} from "./types";
import { buildSourceAnalysisPrompt } from "./prompts/source-analysis.prompt";
import { buildTransformationPrompt } from "./prompts/transformation.prompts";

export class GeminiProvider implements AIProvider {
  public readonly name = "gemini";
  private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  private get apiKey(): string {
    return getSecret("GEMINI_API_KEY");
  }

  private get model(): string {
    return getSecret("GEMINI_MODEL", "gemini-1.5-flash");
  }

  constructor() {
    // Empty constructor ensures zero environment reads or evaluations occur at module load / build time
  }

  public async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.name,
        available: false,
        model: this.model,
        error: "Gemini API key is not configured in server environment."
      };
    }

    try {
      // Lightweight model metadata query to verify key validity without spending prompt quota
      const res = await fetch(`${this.baseUrl}/models/${this.model}?key=${this.apiKey}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${res.status} from Gemini API`;
        return {
          provider: this.name,
          available: false,
          model: this.model,
          error: errMsg
        };
      }

      return {
        provider: this.name,
        available: true,
        model: this.model
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting Gemini API";
      return {
        provider: this.name,
        available: false,
        model: this.model,
        error: msg
      };
    }
  }

  public async analyzeSource(
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<StructuredSourceIntelligence> {
    if (!this.apiKey) {
      throw new Error("[Gemini Provider] Missing Gemini API key. Configure in server environment variables.");
    }

    const prompt = buildSourceAnalysisPrompt(text, metadata);
    const rawJson = await this.generateStructuredContent(prompt);
    
    try {
      const parsed = JSON.parse(rawJson);
      return {
        ...parsed,
        analyzedAt: new Date().toISOString(),
        providerUsed: `gemini:${this.model}`
      } as StructuredSourceIntelligence;
    } catch (err) {
      console.error("[Gemini Provider] Failed to parse analysis JSON. Attempting recovery...");
      const recovered = this.tryRecoverJson(rawJson);
      if (recovered) {
        return {
          ...recovered,
          analyzedAt: new Date().toISOString(),
          providerUsed: `gemini:${this.model}`
        } as StructuredSourceIntelligence;
      }
      throw new Error("[Gemini Provider] Model returned malformed non-JSON output.");
    }
  }

  public async transformContent(
    sourceAnalysis: StructuredSourceIntelligence,
    options: TransformationOptions
  ): Promise<TransformationResult> {
    if (!this.apiKey) {
      throw new Error("[Gemini Provider] Missing Gemini API key. Configure in server environment variables.");
    }

    const prompt = buildTransformationPrompt(sourceAnalysis, options);
    const rawJson = await this.generateStructuredContent(prompt);

    try {
      const parsed = JSON.parse(rawJson);
      const content = parsed.content || "";
      const words = content.split(/\s+/).filter(Boolean);

      return {
        title: parsed.title || sourceAnalysis.title || "Generated Transformation",
        content,
        outputType: options.outputType,
        slides: parsed.slides,
        sourceReferences: parsed.sourceReferences || [],
        metadata: {
          wordCount: words.length,
          characterCount: content.length,
          estimatedReadTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
          tags: parsed.metadata?.tags || []
        },
        providerUsed: this.name,
        modelUsed: this.model
      };
    } catch (err) {
      console.error("[Gemini Provider] Failed to parse transformation JSON. Attempting recovery...");
      const recovered = this.tryRecoverJson(rawJson);
      if (recovered && recovered.content) {
        const words = (recovered.content as string).split(/\s+/).filter(Boolean);
        return {
          title: recovered.title || "Transformed Output",
          content: recovered.content,
          outputType: options.outputType,
          slides: recovered.slides,
          sourceReferences: recovered.sourceReferences || [],
          metadata: {
            wordCount: words.length,
            characterCount: recovered.content.length,
            estimatedReadTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
            tags: recovered.metadata?.tags || []
          },
          providerUsed: this.name,
          modelUsed: this.model
        };
      }
      throw new Error("[Gemini Provider] Transformation output was not valid JSON.");
    }
  }

  /**
   * Internal generator using response_mime_type: "application/json"
   */
  private async generateStructuredContent(prompt: string): Promise<string> {
    const endpoint = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message = errorJson.error?.message || `Gemini API returned status ${res.status}`;
      throw new Error(`[Gemini Provider Error] ${message}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("[Gemini Provider Error] Model returned empty content or was blocked by safety filters.");
    }

    return candidateText;
  }

  private tryRecoverJson(raw: string): Record<string, any> | null {
    try {
      // Find outermost curly brackets
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        const sliced = raw.slice(start, end + 1);
        return JSON.parse(sliced);
      }
      return null;
    } catch {
      return null;
    }
  }
}
