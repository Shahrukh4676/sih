// ==============================================================================
// NEXUS AI - SVG Template Utilities & Shared Definitions (Phase 4)
// ==============================================================================

export function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapText(text: string, maxCharsPerLine = 48): string[] {
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  return lines;
}

export function renderSharedSvgDefs(): string {
  return `
    <defs>
      <!-- Premium Dark Background Gradients -->
      <linearGradient id="bgCyber" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090D16" />
        <stop offset="50%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#050811" />
      </linearGradient>

      <linearGradient id="bgNavy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B132B" />
        <stop offset="100%" stop-color="#1C2541" />
      </linearGradient>

      <linearGradient id="cyanAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#06B6D4" />
        <stop offset="100%" stop-color="#3B82F6" />
      </linearGradient>

      <linearGradient id="alertAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#EF4444" />
        <stop offset="100%" stop-color="#F59E0B" />
      </linearGradient>

      <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1E293B" stop-opacity="0.75" />
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0.85" />
      </linearGradient>

      <!-- Glow and Shadows -->
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45" />
      </filter>

      <filter id="accentGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Grid pattern for cyber enterprise aesthetic -->
      <pattern id="cyberGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.75" stroke-opacity="0.18" />
      </pattern>
    </defs>
  `;
}
