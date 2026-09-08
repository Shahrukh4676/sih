// ==============================================================================
// NEXUS AI - Advisory Alert SVG Template (1200x628, 1.91:1)
// ==============================================================================

import { VisualBrief } from "@/types";
import { escapeXml, wrapText, renderSharedSvgDefs } from "./template-common";

export function renderAdvisoryAlert(brief: VisualBrief): string {
  const width = brief.width || 1200;
  const height = brief.height || 628;

  const headlineLines = wrapText(brief.headline, 38).slice(0, 2);
  const subheadlineLines = wrapText(brief.subheadline, 56).slice(0, 2);

  const orgName = escapeXml(brief.brand?.organizationName || "NEXUS AI Cybersecurity Intelligence");
  const footerText = escapeXml(brief.brand?.footerText || "Security Advisory • Automated Intelligence Transformation");

  // CVSS or Severity Score extraction
  const cvssStat = brief.statistics.find((s) => s.label.toLowerCase().includes("cvss")) || brief.statistics[0];
  const severityValue = cvssStat ? cvssStat.value : "CRITICAL";

  // Actionable mitigation checklist from keyFacts
  const mitigations = (brief.keyFacts || []).slice(0, 3);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(brief.accessibilityText)}">
  <title>${escapeXml(brief.headline)}</title>
  <desc>${escapeXml(brief.accessibilityText)}</desc>

  ${renderSharedSvgDefs()}

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgCyber)" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />

  <!-- Threat Amber/Red Ambient Glow -->
  <circle cx="1050" cy="120" r="280" fill="#DC2626" fill-opacity="0.14" filter="url(#accentGlow)" />
  <circle cx="150" cy="450" r="200" fill="#EA580C" fill-opacity="0.08" filter="url(#accentGlow)" />

  <!-- Critical Warning Top Banner -->
  <g transform="translate(80, 60)">
    <rect width="210" height="36" rx="6" fill="#7F1D1D" fill-opacity="0.4" stroke="#EF4444" stroke-width="1.5" />
    <path d="M 22 13 L 14 27 L 30 27 Z" fill="#EF4444" />
    <circle cx="22" cy="22" r="1.5" fill="#090D16" />
    <rect x="21" y="16" width="2" height="4" fill="#090D16" />
    <text x="38" y="24" fill="#FEE2E2" font-family="Inter, sans-serif" font-size="13" font-weight="700" letter-spacing="0.75">SECURITY ADVISORY</text>
  </g>

  <!-- Organization Watermark (Top Right) -->
  <text x="1120" y="84" text-anchor="end" fill="#94A3B8" font-family="Inter, sans-serif" font-size="14" font-weight="600">${orgName}</text>

  <!-- Main Alert Headline -->
  <g transform="translate(80, 150)">
    ${headlineLines.map((line, idx) => `
      <text x="0" y="${idx * 46}" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="36" letter-spacing="-0.5">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Subheadline -->
  <g transform="translate(80, 255)">
    ${subheadlineLines.map((line, idx) => `
      <text x="0" y="${idx * 24}" fill="#CBD5E1" font-family="Inter, sans-serif" font-weight="400" font-size="17">${escapeXml(line)}</text>
    `).join("")}
  </g>

  <!-- Left: Severity Badge Card -->
  <g transform="translate(80, 340)">
    <rect width="280" height="180" rx="14" fill="url(#cardBg)" stroke="#DC2626" stroke-width="2" filter="url(#cardShadow)" />
    <text x="24" y="38" fill="#94A3B8" font-family="Inter, sans-serif" font-size="13" font-weight="600" letter-spacing="1">SEVERITY RATING</text>
    <text x="24" y="98" fill="#EF4444" font-family="Inter, sans-serif" font-size="52" font-weight="900">${escapeXml(severityValue)}</text>
    <rect x="24" y="125" width="232" height="6" rx="3" fill="#334155" />
    <rect x="24" y="125" width="220" height="6" rx="3" fill="#EF4444" />
    <text x="24" y="152" fill="#FCA5A5" font-family="Inter, sans-serif" font-size="12" font-weight="600">IMMEDIATE MITIGATION REQUIRED</text>
  </g>

  <!-- Right: Mitigation Roadmap & Key Directives -->
  <g transform="translate(390, 340)">
    <rect width="730" height="180" rx="14" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)" />
    <text x="28" y="36" fill="#38BDF8" font-family="Inter, sans-serif" font-size="13" font-weight="700" letter-spacing="0.5">PRIORITY REMEDIATION DIRECTIVES</text>

    ${mitigations.map((item, idx) => {
      const yPos = 70 + idx * 36;
      const snippet = wrapText(item, 58)[0] || item;
      return `
        <g transform="translate(28, ${yPos})">
          <circle cx="10" cy="-4" r="8" fill="#EF4444" fill-opacity="0.2" />
          <text x="7" y="0" fill="#F87171" font-family="Inter, sans-serif" font-size="11" font-weight="700">${idx + 1}</text>
          <text x="28" y="0" fill="#E2E8F0" font-family="Inter, sans-serif" font-size="14" font-weight="500">${escapeXml(snippet)}</text>
        </g>
      `;
    }).join("")}
  </g>

  <!-- Footer Banner -->
  <g transform="translate(80, 580)">
    <line x1="0" y1="0" x2="1040" y2="0" stroke="#1E293B" stroke-width="1" />
    <text x="0" y="24" fill="#64748B" font-family="Inter, sans-serif" font-size="12" font-weight="500">${footerText}</text>
    <text x="1040" y="24" text-anchor="end" fill="#EF4444" font-family="Inter, sans-serif" font-size="12" font-weight="600">THREAT INTELLIGENCE VERIFIED</text>
  </g>
</svg>
  `.trim();
}
