// ==============================================================================
// NEXUS AI - Firestore Data Sanitization & Normalization Utility
// ==============================================================================
// 1. Removes undefined values recursively so Firestore setDoc/updateDoc never fails.
// 2. Normalizes Firestore Timestamps into ISO 8601 strings so React components
//    never receive unrenderable { seconds, nanoseconds } objects (Minified React Error #31).
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

/**
 * Recursively normalizes Firestore documents, converting any Firestore Timestamps
 * or Timestamp-like objects ({ seconds, nanoseconds }) into ISO 8601 strings.
 * This prevents React Error #31 (Objects are not valid as a React child).
 */
export function normalizeFirestoreData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== "object") {
    return input;
  }

  // Handle Date instances
  if (input instanceof Date) {
    return input.toISOString() as unknown as T;
  }

  // Handle Firestore Timestamp instances (.toDate())
  if (typeof (input as any).toDate === "function") {
    try {
      return (input as any).toDate().toISOString() as unknown as T;
    } catch {
      return new Date().toISOString() as unknown as T;
    }
  }

  // Handle plain Timestamp-like objects ({ seconds, nanoseconds } / { _seconds, _nanoseconds } / { type, seconds, nanoseconds })
  const anyInput = input as Record<string, any>;
  const sec = anyInput.seconds !== undefined ? anyInput.seconds : anyInput._seconds;
  if (
    sec !== undefined &&
    sec !== null &&
    !isNaN(Number(sec)) &&
    (anyInput.nanoseconds !== undefined || anyInput._nanoseconds !== undefined || anyInput.type !== undefined)
  ) {
    try {
      return new Date(Number(sec) * 1000).toISOString() as unknown as T;
    } catch {
      return new Date().toISOString() as unknown as T;
    }
  }

  // Handle Arrays
  if (Array.isArray(input)) {
    return input.map((item) => normalizeFirestoreData(item)) as unknown as T;
  }

  // Handle Plain Objects
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    normalized[key] = normalizeFirestoreData(value);
  }
  return normalized as T;
}
