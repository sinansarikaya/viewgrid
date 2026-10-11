import type { GeoResult, NormalizedAudit } from './schema';

/** A deterministic evidence checklist, never an AI ranking or compliance score. */
export function evaluateGeo(audits: readonly NormalizedAudit[]): GeoResult {
  const automated = [
    { id: 'crawl-access', audits: ['is-crawlable'], recommendationCode: 'REVIEW_CRAWL_ACCESS' },
    { id: 'page-metadata', audits: ['document-title', 'meta-description'], recommendationCode: 'REVIEW_PAGE_METADATA' },
    { id: 'canonical', audits: ['canonical'], recommendationCode: 'REVIEW_CANONICAL' },
    { id: 'semantic-structure', audits: ['heading-order', 'landmark-one-main'], recommendationCode: 'REVIEW_SEMANTIC_STRUCTURE' },
    { id: 'descriptive-links', audits: ['link-text', 'crawlable-anchors'], recommendationCode: 'REVIEW_DESCRIPTIVE_LINKS' },
  ].map(criterion => {
    const evidence = criterion.audits.map(id => audits.find(audit => audit.id === id));
    const status = evidence.some(audit => audit?.status === 'fail') ? 'fail' :
      evidence.every(audit => audit?.status === 'pass') ? 'pass' : 'unknown';
    return { id: criterion.id, mode: 'automated' as const, status: status as 'pass' | 'fail' | 'unknown',
      evidenceAuditIds: evidence.flatMap(audit => audit ? [audit.id] : []), recommendationCode: criterion.recommendationCode };
  });
  const manual = ['author-and-sources', 'publication-and-update-dates', 'structured-data-validity', 'crawler-policy'].map(id => ({
    id, mode: 'manual' as const, status: 'manual' as const, evidenceAuditIds: [] as string[], recommendationCode: `MANUALLY_REVIEW_${id.replaceAll('-', '_').toUpperCase()}`,
  }));
  return { criteriaVersion: '1.0.0-beta', experimental: true, disclaimerCode: 'GEO_SIGNALS_NOT_VISIBILITY_GUARANTEE', criteria: [...automated, ...manual] };
}
