// ==============================================================================
// NEXUS AI - Phase 13: Multi-User AI Provider Service
// ==============================================================================
// Supports:
// 1. NEXUS AI Managed Gemini (Free-tier, cloud-hosted)
// 2. BYOK Gemini (User's personal Google AI Studio Key, AES-256-GCM encrypted)
// 3. Local Ollama (100% offline, local daemon detection)
// ==============================================================================

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { encryptToken, decryptToken } from "../security/token-encryption";
import { cleanForFirestore } from "../firebase/firestore-utils";
import { GeminiProvider } from "../ai/gemini.provider";
import { OllamaProvider } from "../ai/ollama.provider";
import { AIProvider } from "../ai/types";
import { getSecret } from "../server-env";

export const ORG_AI_SETTINGS_COLLECTION = "orgAiSettings";

export type AIProviderMode = "NEXUS_DEFAULT" | "BYOK_GEMINI" | "LOCAL_OLLAMA";

export interface OrgAISettings {
  organizationId: string;
  provider: AIProviderMode;
  geminiModel: string;
  byokConfigured: boolean;
  byokKeyMasked?: string;
  byokApiKeyEncrypted?: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  updatedAt?: string;
}

// In-memory cache for fast lookups and stable unit tests
const aiSettingsCache = new Map<string, OrgAISettings>();

/**
 * Retrieves the AI Provider configuration for an organization
 */
export async function getOrgAISettings(organizationId: string): Promise<OrgAISettings> {
  const orgId = organizationId || "org_primary";

  if (aiSettingsCache.has(orgId)) {
    return aiSettingsCache.get(orgId)!;
  }

  const defaultSettings: OrgAISettings = {
    organizationId: orgId,
    provider: "NEXUS_DEFAULT",
    geminiModel: "gemini-1.5-flash",
    byokConfigured: false,
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    updatedAt: new Date().toISOString(),
  };

  try {
    const ref = doc(db, ORG_AI_SETTINGS_COLLECTION, orgId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as OrgAISettings;
      const merged: OrgAISettings = {
        ...defaultSettings,
        ...data,
        byokConfigured: Boolean(data.byokApiKeyEncrypted),
      };
      aiSettingsCache.set(orgId, merged);
      return merged;
    }
  } catch (err) {
    console.warn("[AIProviderService] Firestore read warning:", err);
  }

  aiSettingsCache.set(orgId, defaultSettings);
  return defaultSettings;
}

/**
 * Updates an organization's AI Provider configuration
 */
export async function saveOrgAISettings(params: {
  organizationId: string;
  provider: AIProviderMode;
  byokApiKey?: string;
  geminiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}): Promise<OrgAISettings> {
  const { organizationId, provider, byokApiKey, geminiModel, ollamaBaseUrl, ollamaModel } = params;
  const current = await getOrgAISettings(organizationId);

  let encryptedKey = current.byokApiKeyEncrypted;
  let maskedKey = current.byokKeyMasked;

  if (byokApiKey && byokApiKey.trim().length > 0) {
    const trimmed = byokApiKey.trim();
    encryptedKey = encryptToken(trimmed);
    const prefix = trimmed.slice(0, 6);
    const suffix = trimmed.slice(-4);
    maskedKey = `${prefix}...${suffix}`;
  }

  const updated: OrgAISettings = {
    organizationId,
    provider: provider || current.provider,
    geminiModel: geminiModel || current.geminiModel || "gemini-1.5-flash",
    byokConfigured: Boolean(encryptedKey),
    byokApiKeyEncrypted: encryptedKey,
    byokKeyMasked: maskedKey,
    ollamaBaseUrl: ollamaBaseUrl || current.ollamaBaseUrl || "http://localhost:11434",
    ollamaModel: ollamaModel || current.ollamaModel || "llama3.2",
    updatedAt: new Date().toISOString(),
  };

  aiSettingsCache.set(organizationId, updated);

  try {
    const ref = doc(db, ORG_AI_SETTINGS_COLLECTION, organizationId);
    await setDoc(
      ref,
      cleanForFirestore({
        ...updated,
        serverUpdatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn("[AIProviderService] Firestore write warning:", err);
  }

  return updated;
}

/**
 * Resolves the concrete AIProvider instance based on organization configuration
 */
export async function resolveAIProviderForOrg(organizationId?: string): Promise<{
  provider: AIProvider;
  mode: AIProviderMode;
  model: string;
}> {
  const settings = await getOrgAISettings(organizationId || "org_primary");

  if (settings.provider === "BYOK_GEMINI" && settings.byokApiKeyEncrypted) {
    try {
      const decryptedKey = decryptToken(settings.byokApiKeyEncrypted);
      return {
        provider: new GeminiProvider(decryptedKey, settings.geminiModel),
        mode: "BYOK_GEMINI",
        model: settings.geminiModel,
      };
    } catch (err) {
      console.error("[AIProviderService] Failed to decrypt BYOK key, falling back to NEXUS default:", err);
    }
  }

  if (settings.provider === "LOCAL_OLLAMA") {
    return {
      provider: new OllamaProvider(settings.ollamaBaseUrl, settings.ollamaModel),
      mode: "LOCAL_OLLAMA",
      model: settings.ollamaModel,
    };
  }

  return {
    provider: new GeminiProvider(undefined, settings.geminiModel),
    mode: "NEXUS_DEFAULT",
    model: settings.geminiModel,
  };
}

/**
 * Detects whether local Ollama daemon is running and lists its pulled models
 */
export async function detectLocalOllama(baseUrl = "http://localhost:11434"): Promise<{
  running: boolean;
  models: string[];
  error?: string;
}> {
  const url = baseUrl.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(`${url}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { running: false, models: [], error: `Ollama daemon returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const models: string[] = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
    return { running: true, models };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    return { running: false, models: [], error: "Ollama daemon unreachable on " + url };
  }
}

/**
 * Tests live connection for a provider configuration without persisting
 */
export async function testProviderConnection(params: {
  provider: AIProviderMode;
  byokApiKey?: string;
  geminiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  organizationId?: string;
}): Promise<{
  success: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();

  if (params.provider === "BYOK_GEMINI") {
    let key = params.byokApiKey;
    if (!key && params.organizationId) {
      const current = await getOrgAISettings(params.organizationId);
      if (current.byokApiKeyEncrypted) {
        key = decryptToken(current.byokApiKeyEncrypted);
      }
    }

    if (!key) {
      return {
        success: false,
        provider: "BYOK_GEMINI",
        model: params.geminiModel || "gemini-1.5-flash",
        latencyMs: 0,
        error: "No Gemini API key provided for testing.",
      };
    }

    const testProvider = new GeminiProvider(key, params.geminiModel || "gemini-1.5-flash");
    const health = await testProvider.healthCheck();
    return {
      success: health.available,
      provider: "BYOK_GEMINI",
      model: health.model,
      latencyMs: Date.now() - start,
      error: health.error,
    };
  }

  if (params.provider === "LOCAL_OLLAMA") {
    const testProvider = new OllamaProvider(
      params.ollamaBaseUrl || "http://localhost:11434",
      params.ollamaModel || "llama3.2"
    );
    const health = await testProvider.healthCheck();
    return {
      success: health.available,
      provider: "LOCAL_OLLAMA",
      model: health.model,
      latencyMs: Date.now() - start,
      error: health.error,
    };
  }

  // Default Gemini
  const defaultProvider = new GeminiProvider(undefined, params.geminiModel || "gemini-1.5-flash");
  const health = await defaultProvider.healthCheck();
  return {
    success: health.available,
    provider: "NEXUS_DEFAULT",
    model: health.model,
    latencyMs: Date.now() - start,
    error: health.error,
  };
}
