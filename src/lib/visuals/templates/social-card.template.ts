// ==============================================================================
// NEXUS AI - Social Card SVG Template (1200x628, 1.91:1)
// ==============================================================================

import { VisualBrief } from "@/types";
import { escapeXml, wrapText, renderSharedSvgDefs } from "./template-common";

export function renderSocialCard(brief: VisualBrief): string {
  const width = brief.width || 1200;
  const height = brief.height || 628;

  const headlineLines = wrapText(brief.headline, 38).slice(0, 2);
  const subheadlineLines = wrapText(brief.subheadline, 56).slice(0, 2);

  const orgName = escapeXml(brief.brand?.organizationName || "NEXUS AI Enterprise");
  const footerText = escapeXml(brief.brand?.footerText || "NEXUS AI • Grounded Content Intelligence");

  // Statistics cards vs Key Facts pillars
  const hasStats = brief.statistics && brief.statistics.length > 0;
  let metricsSection = "";

  if (hasStats) {
    const statCards = brief.statistics.slice(0, 3).map((stat, i) => {
      const xOffset = 80 + i * 350;
      return `
        <g transform="translate(${xOffset}, 400)">
          <rect width="320" height="120" rx="12" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)" />
          <text x="24" y="52" fill="#38BDF8" font-family="Inter, sans-serif" font-weight="800" font-size="34">${escapeXml(stat.value)}</text>
          <text x="24" y="86" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="500" font-size="14">${escapeXml(stat.label)}</text>
        </g>
      `;
    }).join("");
    metricsSection = statCards;
  } else {
    // Conceptual Takeaway Pillars
    const facts = (brief.keyFacts || []).slice(0, 3);
    const factCards = facts.map((fact, i) => {
      const xOffset = 80 + i * 350;
      const lines = wrapText(fact, 32).slice(0, 3);
      const textSpans = lines.map((l, lineIdx) => `<tspan x="24" dy="${lineIdx === 0 ? 0 : 20}">${escapeXml(l)}</tspan>`).join("");
      return `
        <g transform="translate(${xOffset}, 390)">
          <rect width="320" height="130" rx="12" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)" />
          <circle cx="36" cy="30" r="10" fill="#0EA5E9" fill-opacity="0.2" />
          <text x="32" y="35" fill="#38BDF8" font-family="Inter, sans-serif" font-weight="700" font-size="14">${i + 1}</text>
          <text x="24" y="65" fill="#E2E8F0" font-family="Inter, sans-serif" font-weight="500" font-size="14">${textSpans}</text>
        </g>
      `;
    }).join("");
    metricsSection = factCards;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(brief.accessibilityText)}">
  <title>${escapeXml(brief.headline)}</title>
  <desc>${escapeXml(brief.accessibilityText)}</desc>

  ${renderSharedSvgDefs()}

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgCyber)" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />

  <!-- Top Ambient Glow -->
  <circle cx="1000" cy="100" r="280" fill="#0284C7" fill-opacity="0.12" filter="url(#accentGlow)" />
  <circle cx="200" cy="500" r="240" fill="#6366F1" fill-opacity="0.08" filter="url(#accentGlow)" />

  <!-- Brand Header / Badge -->
  <g transform="translate(80, 70)">
    <rect width="180" height="34" rx="17" fill="#0369A1" fill-opacity="0.25" stroke="#38BDF8" stroke-width="1" />
    <circle cx="20" cy="17" r="5" fill="#38BDF8" />
    <text x="36" y="22" fill="#E0F2FE" font-family="Inter, sans-serif" font-size="13" font-weight="600" letter-spacing="0.5">EXECUTIVE INTELLIGENCE</text>
  </g>

  <!-- Organization Watermark (Top Right) -->
  <text x="1120" y="92" text-anchor="end" fill="#64748B" font-family="Inter, sans-serif" font-size="14" font-weight="600" letter-spacing="0.5">${orgName}</text>

  <!-- Main Headline -->
  <g transform="translate(80, 165)">
    ${headlineLines.map((line, idx) => `
      <text x="0" y="${idx * 48}" fill="#F8FAFC" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="38" letter-spacing="-0.5">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Subheadline -->
  <g transform="translate(80, 275)">
    ${subheadlineLines.map((line, idx) => `
      <text x="0" y="${idx * 26}" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="400" font-size="18">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Decorative Separator -->
  <line x1="80" y1="350" x2="1120" y2="350" stroke="#334155" stroke-width="1" stroke-dasharray="4 4" />

  <!-- Grounded Metrics / Pillars -->
  ${metricsSection}

  <!-- Footer Banner -->
  <g transform="translate(80, 580)">
    <line x1="0" y1="0" x2="1040" y2="0" stroke="#1E293B" stroke-width="1" />
    <text x="0" y="24" fill="#64748B" font-family="Inter, sans-serif" font-size="12" font-weight="500">${footerText}</text>
    <text x="1040" y="24" text-anchor="end" fill="#0EA5E9" font-family="Inter, sans-serif" font-size="12" font-weight="600">VERIFIED GROUNDING • 100%</text>
  </g>
</svg>
  `.trim();
}
