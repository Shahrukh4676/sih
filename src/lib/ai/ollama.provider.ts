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

export class OllamaProvider implements AIProvider {
  public readonly name = "ollama";

  private customBaseUrl?: string;
  private customModel?: string;

  private get baseUrl(): string {
    return (this.customBaseUrl || getSecret("OLLAMA_BASE_URL", "http://localhost:11434")).replace(/\/$/, "");
  }

  private get model(): string {
    return this.customModel || getSecret("OLLAMA_MODEL", "llama3.2");
  }

  constructor(customBaseUrl?: string, customModel?: string) {
    this.customBaseUrl = customBaseUrl;
    this.customModel = customModel;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        return {
          provider: this.name,
          available: false,
          model: this.model,
          error: `Ollama server responded with status ${res.status}`
        };
      }

      const data = await res.json().catch(() => ({}));
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
      const modelFound = models.some((m: string) => m.includes(this.model) || this.model.includes(m));

      return {
        provider: this.name,
        available: true,
        model: this.model,
        error: !modelFound && models.length > 0 ? `Model '${this.model}' not pulled in local Ollama instance.` : undefined
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ollama daemon not reachable at " + this.baseUrl;
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
    const prompt = buildSourceAnalysisPrompt(text, metadata);
    const rawJson = await this.generateStructuredContent(prompt);

    try {
      const parsed = JSON.parse(rawJson);
      return {
        ...parsed,
        analyzedAt: new Date().toISOString(),
        providerUsed: `ollama:${this.model}`
      } as StructuredSourceIntelligence;
    } catch (err) {
      console.error("[Ollama Provider] Failed to parse analysis JSON. Attempting recovery...");
      const recovered = this.tryRecoverJson(rawJson);
      if (recovered) {
        return {
          ...recovered,
          analyzedAt: new Date().toISOString(),
          providerUsed: `ollama:${this.model}`
        } as StructuredSourceIntelligence;
      }
      throw new Error("[Ollama Provider] Failed to produce valid JSON source intelligence.");
    }
  }

  public async transformContent(
    sourceAnalysis: StructuredSourceIntelligence,
    options: TransformationOptions
  ): Promise<TransformationResult> {
    const prompt = buildTransformationPrompt(sourceAnalysis, options);
    const rawJson = await this.generateStructuredContent(prompt);

    try {
      const parsed = JSON.parse(rawJson);
      const content = parsed.content || "";
      const words = content.split(/\s+/).filter(Boolean);

      return {
        title: parsed.title || sourceAnalysis.title || "Transformed Output",
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
      console.error("[Ollama Provider] Failed to parse transformation JSON. Attempting recovery...");
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
      throw new Error("[Ollama Provider] Failed to produce valid JSON transformation.");
    }
  }

  private async generateStructuredContent(prompt: string): Promise<string> {
    const endpoint = `${this.baseUrl}/api/generate`;

    const requestBody = {
      model: this.model,
      prompt,
      format: "json",
      stream: false,
      options: {
        temperature: 0.2
      }
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`[Ollama Provider Error] Status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const responseText = data.response;

    if (!responseText) {
      throw new Error("[Ollama Provider Error] Model returned empty response.");
    }

    return responseText;
  }

  private tryRecoverJson(raw: string): Record<string, any> | null {
    try {
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
