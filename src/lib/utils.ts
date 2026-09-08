// ==============================================================================
// NEXUS AI - Utility Functions & Formatters
// ==============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "just now";
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
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
