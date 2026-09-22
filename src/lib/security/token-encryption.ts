// ==============================================================================
// NEXUS AI - Token Encryption Engine (AES-256-GCM)
// ==============================================================================
// Provides authenticated symmetric encryption for OAuth tokens and credentials
// stored at rest. Ensures zero plaintext exposure in logs, APIs, or databases.
// ==============================================================================

import "server-only";
import crypto from "crypto";
import { getSecret } from "@/lib/server-env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // Standard 128-bit authentication tag

/**
 * Derives a deterministic 32-byte key from environment variables
 */
function getEncryptionKey(): Buffer {
  const secret =
    getSecret("LINKEDIN_ENCRYPTION_KEY") ||
    getSecret("ENCRYPTION_KEY") ||
    getSecret("NEXTAUTH_SECRET") ||
    "nexus-ai-secure-token-encryption-master-salt-2026";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive string token using AES-256-GCM.
 * Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return "";

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an encrypted token string.
 * Validates integrity via GCM auth tag. Throws error if tampered.
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString) return "";

  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format. Expected iv:authTag:ciphertext.");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid IV or authentication tag length in encrypted token.");
  }

  // Candidate keys: configured keys first, then known historical/dev keys, then default salt fallback
  const rawCandidateSecrets = [
    getSecret("LINKEDIN_ENCRYPTION_KEY"),
    getSecret("ENCRYPTION_KEY"),
    getSecret("NEXTAUTH_SECRET"),
    "nexus_linkedin_dev_encryption_key_32_bytes_safe",
    "nexus_prod_aes_key_993821047481948194",
    "nexus_super_secure_linkedin_aes_key_2025_prod_0000",
    "your_aes_256_gcm_32_byte_secret_key_here",
    "nexus-ai-secure-token-encryption-master-salt-2026",
  ].filter(Boolean) as string[];

  const candidateSecrets = Array.from(new Set(rawCandidateSecrets));

  let lastError: Error | null = null;
  for (const secret of candidateSecrets) {
    try {
      const key = crypto.createHash("sha256").update(secret).digest();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (err: unknown) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error("Failed to decrypt token with available keys.");
}
