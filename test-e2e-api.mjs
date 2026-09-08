// test-e2e-api.mjs
// Comprehensive End-to-End Test for NEXUS AI Phase 3 AI Engine

const BASE_URL = 'http://localhost:3000';

const sampleAdvisory = `
CRITICAL SECURITY ADVISORY: CVE-2026-4401 Zero-Day in Cloud Authentication Gateways
Published: September 2026
Severity: Critical (CVSS 9.8)

Summary:
A remote code execution flaw was identified in Enterprise Cloud Auth Proxy versions 3.2.0 through 3.4.1.
Threat actors are actively attempting credential harvesting and unauthorized lateral movement.

Affected Systems:
- CloudAuth Gateway v3.2.0 - v3.4.1
- Edge Identity Broker deployed in Kubernetes clusters

Mitigation & Recommendations:
1. Immediately patch to v3.4.2 or higher.
2. If immediate patching is not possible, disable mTLS bypass and enforce strict IP allowlisting.
3. Review audit logs for anomalous POST requests to /internal/oauth/token endpoint since August 15.

Key Takeaways:
- Zero-day actively targeted by sophisticated nation-state threat actors.
- Patching v3.4.2 is effective immediately.
`;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting NEXUS AI Phase 3 End-to-End API Test');
  console.log('====================================================\n');

  // Test 1: AI Provider Status
  console.log('1. Testing /api/ai/status ...');
  const statusRes = await fetch(`${BASE_URL}/api/ai/status`);
  const statusJson = await statusRes.json();
  console.log('   Status response:', JSON.stringify(statusJson, null, 2));
  if (statusRes.status !== 200) throw new Error('AI status failed');
  console.log('   ✅ AI status endpoint verified.\n');

  // Test 2: Ingest Source Document
  console.log('2. Testing Source Ingestion /api/sources ...');
  const sourcePayload = {
    title: 'CVE-2026-4401 Critical Zero-Day Advisory',
    type: 'DOCUMENT',
    content: sampleAdvisory,
    tags: ['cybersecurity', 'zero-day', 'cve'],
    organizationId: 'demo-org-123'
  };
  const createSourceRes = await fetch(`${BASE_URL}/api/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sourcePayload)
  });
  const sourceResData = await createSourceRes.json();
  const source = sourceResData.source || sourceResData;
  console.log(`   Source created: ID=${source.id}, Status=${source.processingStatus}`);
  if (!source.id) throw new Error(`Failed to create source: ${JSON.stringify(sourceResData)}`);
  console.log('   ✅ Source ingestion verified.\n');

  // Test 3: Analyze Source (One-time Structured Source Intelligence)
  console.log(`3. Testing Source Analysis /api/sources/${source.id}/analyze ...`);
  const analyzeRes = await fetch(`${BASE_URL}/api/sources/${source.id}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const analyzeData = await analyzeRes.json();
  console.log('   Analysis completed:', {
    cached: analyzeData.cached,
    title: analyzeData.analysis?.title,
    mainTopic: analyzeData.analysis?.main_topic,
    keyPointsCount: analyzeData.analysis?.key_points?.length,
    risksCount: analyzeData.analysis?.risks?.length,
    recommendationsCount: analyzeData.analysis?.recommendations?.length,
    evidenceCount: analyzeData.analysis?.source_evidence?.length
  });
  if (!analyzeData.analysis?.key_points || analyzeData.analysis.key_points.length === 0) {
    throw new Error('Analysis failed or missing key_points in structured intelligence');
  }
  console.log('   ✅ One-time Structured Source Intelligence verified.\n');

  // Test 4: Transformation Suite (LinkedIn, Executive Summary, Presentation)
  console.log('4. Testing Transformations /api/transform ...');
  const formats = ['LINKEDIN_POST', 'EXECUTIVE_SUMMARY', 'PRESENTATION'];
  const transformResults = {};

  for (const format of formats) {
    console.log(`   Transforming into ${format}...`);
    const transformRes = await fetch(`${BASE_URL}/api/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: source.id,
        outputType: format,
        organizationId: 'demo-org-123',
        options: {
          tone: 'AUTHORITATIVE',
          targetAudience: 'Security Leaders & IT Directors',
          includeEvidence: true
        }
      })
    });
    const result = await transformRes.json();
    if (!result.content?.id) {
      throw new Error(`Transformation for ${format} failed: ${JSON.stringify(result)}`);
    }
    transformResults[format] = result;
    console.log(`   ✅ Transformed ${format}: Content ID=${result.content.id}, Version=${result.content.currentVersion.versionNumber}`);
    if (format === 'PRESENTATION') {
      const slides = result.content.currentVersion.slideOutline || result.result?.slides || [];
      console.log(`      Slides generated: ${slides.length} slides`);
    }
  }
  console.log('   ✅ Multi-format transformations verified.\n');

  // Test 5: Version History & Regeneration
  console.log('5. Testing Content Regeneration /api/content/[id]/regenerate ...');
  const targetContentId = transformResults['LINKEDIN_POST'].content.id;
  const regenRes = await fetch(`${BASE_URL}/api/content/${targetContentId}/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customInstructions: 'Make it even more urgent and add 3 specific bullet points for CISOs.'
    })
  });
  const regenResult = await regenRes.json();
  console.log(`   Regenerated Content: Version=${regenResult.content?.version || regenResult.newVersionNumber}`);
  if ((regenResult.content?.version || regenResult.newVersionNumber) !== 2) {
    throw new Error(`Expected version 2, got ${JSON.stringify(regenResult)}`);
  }
  console.log('   ✅ Versioned content regeneration verified.\n');

  // Test 6: Verify Immutable Version History
  console.log(`6. Testing Version History Retrieval /api/content/${targetContentId}/versions ...`);
  const versionsRes = await fetch(`${BASE_URL}/api/content/${targetContentId}/versions`);
  const versionsData = await versionsRes.json();
  const versions = versionsData.versions || [];
  console.log(`   Retrieved ${versions.length} versions in history:`);
  versions.forEach(v => {
    console.log(`     - v${v.versionNumber}: ${v.changeDescription || 'Initial generation'} (${v.metadata?.wordCount || 0} words)`);
  });
  if (versions.length < 2) throw new Error('Expected at least 2 versions in history');
  console.log('   ✅ Immutable version history retrieval verified.\n');

  console.log('====================================================');
  console.log('🎉 ALL 6 PHASE 3 END-TO-END PIPELINE TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Pipeline Test Failed:', err);
  process.exit(1);
});
