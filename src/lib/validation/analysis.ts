import { z } from 'zod';
import { ANALYSIS_URL_MAX_LENGTH } from '../../core/analysis/limits';

function publicHost(host: string): boolean {
  const name = host.toLowerCase().replace(/\.$/, '');
  if (name.startsWith('[')) {
    const address = name.slice(1, -1);
    const parts = address.split(':');
    const first = Number.parseInt(parts[0] || '0', 16);
    const second = Number.parseInt(parts[1] || '0', 16);
    // Only global unicast; exclude documentation, special-use and 6to4 ranges.
    return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 &&
      !(first === 0x2001 && (second < 0x200 || second === 0xdb8)) &&
      !(first === 0x3fff && second < 0x1000);
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    const [a = 0, b = 0, c = 0] = name.split('.').map(Number);
    return a !== 0 && a !== 10 && a !== 127 && a < 224 &&
      !(a === 100 && b >= 64 && b <= 127) && !(a === 169 && b === 254) &&
      !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) &&
      !(a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) &&
      !(a === 203 && b === 0 && c === 113);
  }
  if (!name.includes('.') || /(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid|onion)$/.test(name)) return false;
  return name.length <= 253 && name.split('.').every(label => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label));
}

/** Host syntax check only: no target fetch or DNS lookup is performed locally. */
export const publicAnalysisUrlSchema = z.string().trim().min(1).max(ANALYSIS_URL_MAX_LENGTH).transform((value, ctx) => {
  try {
    if ([...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\')) throw new Error();
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !publicHost(url.hostname)) throw new Error();
    url.hash = '';
    if (url.href.length > ANALYSIS_URL_MAX_LENGTH) throw new Error();
    return url.href;
  } catch {
    ctx.addIssue({ code: 'custom', message: 'ANALYSIS_PUBLIC_URL_REQUIRED' });
    return z.NEVER;
  }
});

export const analysisRequestSchema = z.object({
  url: publicAnalysisUrlSchema,
  profile: z.enum(['mobile', 'desktop', 'both']).default('mobile'),
  locale: z.string().regex(/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/).max(12).default('tr'),
}).strict();

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

// Foreign Google response: only the envelope is validated here. Optional audit
// fields are normalized defensively so missing metrics never become zeroes.
export const psiResponseSchema = z.looseObject({
  lighthouseResult: z.looseObject({
    audits: z.record(z.string(), z.unknown()).optional(),
    categories: z.record(z.string(), z.unknown()).optional(),
    runtimeError: z.unknown().optional(),
  }),
});
