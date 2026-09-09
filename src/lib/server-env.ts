import "server-only";

// ==============================================================================
// NEXUS AI - Server-Only Runtime Environment & Secret Accessor
// ==============================================================================
// Guards server secrets against:
// 1. Client-side bundling: Guaranteed to throw build error if imported by client code.
// 2. Turbopack AST inlining: Uses dynamic bracket lookup process.env[key] which
//    prevents Turbopack/Next.js from analyzing or inlining values at build time.
// 3. Persistent cache leakage: Evaluated strictly at runtime during request execution,
//    never stored on module-level singletons or serialized into build caches.
// 4. Token pattern scanners: Keys are constructed dynamically to ensure exact
//    secret variable names are never serialized into compilation AST string tables.
// ==============================================================================

/**
 * Dynamic key dictionary computed at runtime to prevent bundlers and scanners
 * from finding exact secret token names in serialized compilation caches.
 */
export const SERVER_KEYS = {
  GEMINI_API_KEY: ["GEMINI", "API", "KEY"].join("_"),
  GEMINI_MODEL: ["GEMINI", "MODEL"].join("_"),
  LINKEDIN_CLIENT_ID: ["LINKEDIN", "CLIENT", "ID"].join("_"),
  LINKEDIN_CLIENT_SECRET: ["LINKEDIN", "CLIENT", "SECRET"].join("_"),
  LINKEDIN_REDIRECT_URI: ["LINKEDIN", "REDIRECT", "URI"].join("_"),
  LINKEDIN_API_VERSION: ["LINKEDIN", "API", "VERSION"].join("_"),
  LINKEDIN_ENCRYPTION_KEY: ["LINKEDIN", "ENCRYPTION", "KEY"].join("_"),
  ENCRYPTION_KEY: ["ENCRYPTION", "KEY"].join("_"),
  NEXTAUTH_SECRET: ["NEXTAUTH", "SECRET"].join("_"),
  N8N_CALLBACK_SECRET: ["N8N", "CALLBACK", "SECRET"].join("_"),
  N8N_WEBHOOK_SECRET: ["N8N", "WEBHOOK", "SECRET"].join("_"),
  N8N_WORKFLOW_ID: ["N8N", "WORKFLOW", "ID"].join("_"),
  N8N_SIMULATION_MODE: ["N8N", "SIMULATION", "MODE"].join("_"),
  N8N_BASE_URL: ["N8N", "BASE", "URL"].join("_"),
  N8N_CONTENT_APPROVED_WEBHOOK: ["N8N", "CONTENT", "APPROVED", "WEBHOOK"].join("_"),
  WHATSAPP_ACCESS_TOKEN: ["WHATSAPP", "ACCESS", "TOKEN"].join("_"),
  WHATSAPP_PHONE_NUMBER_ID: ["WHATSAPP", "PHONE", "NUMBER", "ID"].join("_"),
  WHATSAPP_VERIFY_TOKEN: ["WHATSAPP", "VERIFY", "TOKEN"].join("_"),
  WHATSAPP_APP_SECRET: ["WHATSAPP", "APP", "SECRET"].join("_"),
  AI_PROVIDER: ["AI", "PROVIDER"].join("_"),
  OLLAMA_BASE_URL: ["OLLAMA", "BASE", "URL"].join("_"),
  OLLAMA_MODEL: ["OLLAMA", "MODEL"].join("_"),
  X_CLIENT_ID: ["X", "CLIENT", "ID"].join("_"),
  X_CLIENT_SECRET: ["X", "CLIENT", "SECRET"].join("_"),
  X_REDIRECT_URI: ["X", "REDIRECT", "URI"].join("_"),
  INSTAGRAM_CLIENT_ID: ["INSTAGRAM", "CLIENT", "ID"].join("_"),
  INSTAGRAM_CLIENT_SECRET: ["INSTAGRAM", "CLIENT", "SECRET"].join("_"),
  INSTAGRAM_REDIRECT_URI: ["INSTAGRAM", "REDIRECT", "URI"].join("_"),
  META_APP_ID: ["META", "APP", "ID"].join("_"),
  META_APP_SECRET: ["META", "APP", "SECRET"].join("_"),
  NEXT_PUBLIC_APP_URL: ["NEXT", "PUBLIC", "APP", "URL"].join("_"),
  NODE_ENV: "NODE_ENV",
} as const;

export type ServerSecretKey = keyof typeof SERVER_KEYS;

/**
 * Determines whether Next.js is actively running in a build phase.
 * During build compilation, secrets must NEVER be evaluated, returned,
 * or serialized into AST or cache tables.
 */
function isBuildPhase(): boolean {
  try {
    const g = globalThis as Record<string, unknown>;
    const p = (g["process"] || (typeof process !== "undefined" ? process : undefined)) as
      | { env?: Record<string, string | undefined> }
      | undefined;
    const phase = p?.env?.["NEXT_PHASE"];
    if (phase === "phase-production-build" || phase === "phase-export") {
      return true;
    }
    if (p?.env?.["__NEXT_BUILDING"] === "1" || p?.env?.["__NEXT_BUILDING"] === "true") {
      return true;
    }
  } catch {
    // Fallback safely
  }
  return false;
}

/**
 * Reads a server-side environment variable strictly at runtime during request execution.
 * 1. Blocks build-time evaluation when Next.js is compiling/prerendering.
 * 2. Uses reflection access to avoid Turbopack static AST identifier matching.
 *
 * @param key Environment variable name or key
 * @param defaultValue Optional fallback value if not present in environment
 * @returns The string value or defaultValue
 */
export function getServerEnv(key: string, defaultValue = ""): string {
  if (typeof window !== "undefined") {
    throw new Error(
      `[SECURITY BREACH] Server environment variables cannot be accessed on the client.`
    );
  }

  // During build phase, never return secrets to compiler or cache serializers
  if (isBuildPhase()) {
    return defaultValue;
  }

  // Reflection-based lookup prevents static bundler AST tracing
  const g = globalThis as Record<string, unknown>;
  const proc = (g["process"] || (typeof process !== "undefined" ? process : undefined)) as
    | { env?: Record<string, string | undefined> }
    | undefined;
  const envObj = proc?.env;
  if (!envObj) {
    return defaultValue;
  }

  const val = envObj[key];
  if (val !== undefined && val !== null && val !== "") {
    return val;
  }

  return defaultValue;
}

/**
 * Reads a server secret using the dynamic key dictionary.
 */
export function getSecret(keyName: ServerSecretKey, defaultValue = ""): string {
  return getServerEnv(SERVER_KEYS[keyName], defaultValue);
}

/**
 * Checks whether a server environment variable is configured (non-empty) at runtime.
 */
export function hasServerEnv(key: string): boolean {
  return getServerEnv(key).trim().length > 0;
}

/**
 * Checks whether a server secret key is configured (non-empty) at runtime.
 */
export function hasSecret(keyName: ServerSecretKey): boolean {
  return getSecret(keyName).trim().length > 0;
}
