// ==============================================================================
// NEXUS AI - Utility Functions & Formatters
// ==============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseToDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  // Handle Firestore Timestamp instances
  if (typeof (input as any).toDate === "function") {
    try {
      const d = (input as any).toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  // Handle Firestore-like timestamp objects { seconds, nanoseconds } or { _seconds, _nanoseconds }
  if (typeof input === "object" && input !== null) {
    const anyObj = input as Record<string, any>;
    const sec = anyObj.seconds !== undefined ? anyObj.seconds : anyObj._seconds;
    if (sec !== undefined && sec !== null && !isNaN(Number(sec))) {
      try {
        const d = new Date(Number(sec) * 1000);
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    }
  }

  // Handle ISO strings, timestamps, etc.
  if (typeof input === "string" || typeof input === "number") {
    try {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  return null;
}

export function formatDate(dateVal?: unknown): string {
  if (!dateVal) return "—";
  const d = parseToDate(dateVal);
  if (!d) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

export function formatRelativeTime(dateVal?: unknown): string {
  if (!dateVal) return "just now";
  const d = parseToDate(dateVal);
  if (!d) return "just now";

  try {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(d);
  } catch {
    return "just now";
  }
}

export function truncateText(text: string, maxLength: number = 120): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Basic text sanitizer to prevent unsafe HTML rendering without dependencies
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
