// ==============================================================================
// NEXUS AI - Firestore Data Sanitization Utility
// ==============================================================================
// Removes undefined values recursively so Firestore setDoc/updateDoc never fails.
// ==============================================================================

export function cleanForFirestore<T>(input: T): T {
  if (input === undefined) {
    return null as unknown as T;
  }
  if (input === null || typeof input !== "object") {
    return input;
  }
  if (input instanceof Date) {
    return input;
  }
  // Preserve Firestore FieldValue sentinels (serverTimestamp, deleteField, etc.)
  if ("_methodName" in (input as Record<string, unknown>)) {
    return input;
  }
  if (Array.isArray(input)) {
    return (input as unknown[])
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  return cleaned as T;
}
