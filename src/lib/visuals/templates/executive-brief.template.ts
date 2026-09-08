// ==============================================================================
// NEXUS AI - Executive Brief SVG Template (1200x628, 1.91:1)
// ==============================================================================

import { VisualBrief } from "@/types";
import { escapeXml, wrapText, renderSharedSvgDefs } from "./template-common";

export function renderExecutiveBrief(brief: VisualBrief): string {
  const width = brief.width || 1200;
  const height = brief.height || 628;

  const headlineLines = wrapText(brief.headline, 40).slice(0, 2);
  const subheadlineLines = wrapText(brief.subheadline, 64).slice(0, 2);

  const orgName = escapeXml(brief.brand?.organizationName || "NEXUS AI Enterprise");
  const footerText = escapeXml(brief.brand?.footerText || "Strategic Decision Support • Executive Brief");

  const pillars = (brief.keyFacts || []).slice(0, 3);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(brief.accessibilityText)}">
  <title>${escapeXml(brief.headline)}</title>
  <desc>${escapeXml(brief.accessibilityText)}</desc>

  ${renderSharedSvgDefs()}

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgNavy)" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />

  <!-- Subtle Executive Gold & Blue Glow -->
  <circle cx="1050" cy="100" r="260" fill="#F59E0B" fill-opacity="0.08" filter="url(#accentGlow)" />
  <circle cx="200" cy="550" r="260" fill="#0284C7" fill-opacity="0.1" filter="url(#accentGlow)" />

  <!-- Top Executive Badge -->
  <g transform="translate(80, 60)">
    <rect width="200" height="34" rx="4" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
    <text x="18" y="22" fill="#FDE68A" font-family="Inter, sans-serif" font-size="12" font-weight="700" letter-spacing="1">C-SUITE STRATEGIC BRIEF</text>
  </g>

  <!-- Organization Watermark (Top Right) -->
  <text x="1120" y="82" text-anchor="end" fill="#94A3B8" font-family="Inter, sans-serif" font-size="14" font-weight="600">${orgName}</text>

  <!-- Main Headline -->
  <g transform="translate(80, 150)">
    ${headlineLines.map((line, idx) => `
      <text x="0" y="${idx * 46}" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="36" letter-spacing="-0.5">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Subheadline -->
  <g transform="translate(80, 255)">
    ${subheadlineLines.map((line, idx) => `
      <text x="0" y="${idx * 24}" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="400" font-size="17">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Three Strategic Executive Pillars -->
  <g transform="translate(80, 335)">
    ${pillars.map((pillar, idx) => {
      const cardWidth = 330;
      const xPos = idx * (cardWidth + 25);
      const lines = wrapText(pillar, 34).slice(0, 3);
      const labels = ["EXECUTIVE CONTEXT", "STRATEGIC IMPLICATION", "ACTION ROADMAP"];
      return `
        <g transform="translate(${xPos}, 0)">
          <rect width="${cardWidth}" height="190" rx="10" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)" />
          <rect x="0" y="0" width="${cardWidth}" height="4" rx="2" fill="${idx === 0 ? "#0EA5E9" : idx === 1 ? "#F59E0B" : "#10B981"}" />
          <text x="24" y="36" fill="#64748B" font-family="Inter, sans-serif" font-size="11" font-weight="700" letter-spacing="1">${labels[idx] || `PILLAR ${idx + 1}`}</text>
          <g transform="translate(24, 75)">
            ${lines.map((l, lIdx) => `
              <text x="0" y="${lIdx * 24}" fill="#F1F5F9" font-family="Inter, sans-serif" font-size="15" font-weight="500">${escapeXml(l)}</text>
            `).join("")}
          </g>
        </g>
      `;
    }).join("")}
  </g>

  <!-- Footer Banner -->
  <g transform="translate(80, 580)">
    <line x1="0" y1="0" x2="1040" y2="0" stroke="#1E293B" stroke-width="1" />
    <text x="0" y="24" fill="#64748B" font-family="Inter, sans-serif" font-size="12" font-weight="500">${footerText}</text>
    <text x="1040" y="24" text-anchor="end" fill="#F59E0B" font-family="Inter, sans-serif" font-size="12" font-weight="600">CONFIDENTIAL &amp; ACTIONABLE</text>
  </g>
</svg>
  `.trim();
}
