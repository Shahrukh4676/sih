// ==============================================================================
// NEXUS AI - Quote Card SVG Template (1080x1080, 1:1)
// ==============================================================================

import { VisualBrief } from "@/types";
import { escapeXml, wrapText, renderSharedSvgDefs } from "./template-common";

export function renderQuoteCard(brief: VisualBrief): string {
  const width = brief.width || 1080;
  const height = brief.height || 1080;

  const quoteText = brief.keyFacts?.[0] || brief.headline;
  const quoteLines = wrapText(quoteText, 32).slice(0, 5);

  const orgName = escapeXml(brief.brand?.organizationName || "NEXUS AI Enterprise");
  const sourceAttribution = escapeXml(brief.headline);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(brief.accessibilityText)}">
  <title>${escapeXml(brief.headline)}</title>
  <desc>${escapeXml(brief.accessibilityText)}</desc>

  ${renderSharedSvgDefs()}

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgCyber)" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />

  <!-- Center Ambient Glow -->
  <circle cx="540" cy="540" r="350" fill="#0284C7" fill-opacity="0.12" filter="url(#accentGlow)" />

  <!-- Outer Glass Frame -->
  <rect x="80" y="80" width="920" height="920" rx="24" fill="url(#cardBg)" stroke="#334155" stroke-width="2" filter="url(#cardShadow)" />

  <!-- Top Brand Tag -->
  <g transform="translate(140, 140)">
    <text x="0" y="0" fill="#38BDF8" font-family="Inter, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">EXECUTIVE PERSPECTIVE</text>
    <text x="800" y="0" text-anchor="end" fill="#64748B" font-family="Inter, sans-serif" font-size="14" font-weight="600">${orgName}</text>
  </g>

  <!-- Large Stylized Quotation Mark -->
  <text x="140" y="320" fill="#0284C7" fill-opacity="0.35" font-family="Georgia, serif" font-size="160" font-weight="700">“</text>

  <!-- Quote Body Lines -->
  <g transform="translate(140, 380)">
    ${quoteLines.map((line, idx) => `
      <text x="0" y="${idx * 56}" fill="#F8FAFC" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="36" letter-spacing="-0.5">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Attribution & Topic -->
  <g transform="translate(140, 760)">
    <line x1="0" y1="0" x2="80" y2="0" stroke="#0EA5E9" stroke-width="3" />
    <text x="0" y="40" fill="#E2E8F0" font-family="Inter, sans-serif" font-size="20" font-weight="700">${sourceAttribution}</text>
    <text x="0" y="70" fill="#94A3B8" font-family="Inter, sans-serif" font-size="15" font-weight="500">Verified Intelligence Snapshot • NEXUS AI</text>
  </g>

  <!-- Bottom Verification Badge -->
  <g transform="translate(140, 930)">
    <circle cx="6" cy="-4" r="5" fill="#10B981" />
    <text x="22" y="0" fill="#A7F3D0" font-family="Inter, sans-serif" font-size="13" font-weight="600">VERIFIED PRIMARY SOURCE</text>
  </g>
</svg>
  `.trim();
}
