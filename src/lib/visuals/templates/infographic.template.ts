// ==============================================================================
// NEXUS AI - Infographic SVG Template (1080x1350, 4:5)
// ==============================================================================

import { VisualBrief } from "@/types";
import { escapeXml, wrapText, renderSharedSvgDefs } from "./template-common";

export function renderInfographic(brief: VisualBrief): string {
  const width = brief.width || 1080;
  const height = brief.height || 1350;

  const headlineLines = wrapText(brief.headline, 32).slice(0, 3);
  const subheadlineLines = wrapText(brief.subheadline, 48).slice(0, 2);

  const orgName = escapeXml(brief.brand?.organizationName || "NEXUS AI Enterprise");
  const footerText = escapeXml(brief.brand?.footerText || "Data & Threat Intelligence Infographic");

  const stats = brief.statistics.slice(0, 3);
  const facts = (brief.keyFacts || []).slice(0, 4);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(brief.accessibilityText)}">
  <title>${escapeXml(brief.headline)}</title>
  <desc>${escapeXml(brief.accessibilityText)}</desc>

  ${renderSharedSvgDefs()}

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgCyber)" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />

  <!-- Ambient Glow Points -->
  <circle cx="950" cy="150" r="300" fill="#0284C7" fill-opacity="0.15" filter="url(#accentGlow)" />
  <circle cx="100" cy="900" r="280" fill="#6366F1" fill-opacity="0.1" filter="url(#accentGlow)" />

  <!-- Header Category Badge -->
  <g transform="translate(70, 70)">
    <rect width="200" height="36" rx="8" fill="#0369A1" fill-opacity="0.3" stroke="#0284C7" stroke-width="1.5" />
    <circle cx="20" cy="18" r="5" fill="#38BDF8" />
    <text x="36" y="23" fill="#E0F2FE" font-family="Inter, sans-serif" font-size="13" font-weight="700" letter-spacing="1">INTELLIGENCE BRIEF</text>
  </g>

  <!-- Watermark -->
  <text x="1010" y="94" text-anchor="end" fill="#64748B" font-family="Inter, sans-serif" font-size="15" font-weight="600">${orgName}</text>

  <!-- Title & Headline -->
  <g transform="translate(70, 160)">
    ${headlineLines.map((line, idx) => `
      <text x="0" y="${idx * 48}" fill="#F8FAFC" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="38" letter-spacing="-0.5">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Subheadline -->
  <g transform="translate(70, 310)">
    ${subheadlineLines.map((line, idx) => `
      <text x="0" y="${idx * 28}" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="400" font-size="20">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Top Metrics Bar (if grounded statistics exist) -->
  ${stats.length > 0 ? `
  <g transform="translate(70, 390)">
    ${stats.map((stat, i) => {
      const cardWidth = Math.floor(940 / stats.length) - 16;
      const xPos = i * (cardWidth + 16);
      return `
        <g transform="translate(${xPos}, 0)">
          <rect width="${cardWidth}" height="130" rx="14" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)" />
          <text x="24" y="55" fill="#38BDF8" font-family="Inter, sans-serif" font-weight="900" font-size="38">${escapeXml(stat.value)}</text>
          <text x="24" y="95" fill="#94A3B8" font-family="Inter, sans-serif" font-weight="600" font-size="14">${escapeXml(stat.label)}</text>
        </g>
      `;
    }).join("")}
  </g>
  ` : ""}

  <!-- Section Title: Key Strategic Findings -->
  <g transform="translate(70, ${stats.length > 0 ? 570 : 420})">
    <text x="0" y="0" fill="#38BDF8" font-family="Inter, sans-serif" font-size="14" font-weight="700" letter-spacing="1">VERIFIED EVIDENCE &amp; IMPACT</text>
    <line x1="0" y1="16" x2="940" y2="16" stroke="#334155" stroke-width="1" />
  </g>

  <!-- Vertical Narrative Cards Stack -->
  <g transform="translate(70, ${stats.length > 0 ? 620 : 470})">
    ${facts.map((fact, idx) => {
      const yOffset = idx * 150;
      const lines = wrapText(fact, 54).slice(0, 3);
      return `
        <g transform="translate(0, ${yOffset})">
          <rect width="940" height="130" rx="14" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)" />
          <circle cx="45" cy="45" r="18" fill="#0284C7" fill-opacity="0.2" />
          <text x="40" y="51" fill="#38BDF8" font-family="Inter, sans-serif" font-size="16" font-weight="800">${idx + 1}</text>
          <g transform="translate(85, 40)">
            ${lines.map((l, lIdx) => `
              <text x="0" y="${lIdx * 24}" fill="#E2E8F0" font-family="Inter, sans-serif" font-size="16" font-weight="500">${escapeXml(l)}</text>
            `).join("")}
          </g>
        </g>
      `;
    }).join("")}
  </g>

  <!-- Footer Banner -->
  <g transform="translate(70, 1270)">
    <line x1="0" y1="0" x2="940" y2="0" stroke="#1E293B" stroke-width="1" />
    <text x="0" y="30" fill="#64748B" font-family="Inter, sans-serif" font-size="14" font-weight="500">${footerText}</text>
    <text x="940" y="30" text-anchor="end" fill="#0EA5E9" font-family="Inter, sans-serif" font-size="14" font-weight="600">SOURCE TRACEABILITY CONFIRMED</text>
  </g>
</svg>
  `.trim();
}
