import { z } from 'zod';
import { ANALYSIS_URL_MAX_LENGTH } from '../../core/analysis/limits';

/** Syntax validation only; local targets are never fetched or resolved here. */
export const localAnalysisUrlSchema = z.string().min(1).max(ANALYSIS_URL_MAX_LENGTH).transform((value, ctx) => {
  try {
    if ([...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\') || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) throw new Error();
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    url.hash = '';
    if (url.href.length > ANALYSIS_URL_MAX_LENGTH) throw new Error();
    return url.href;
  } catch {
    ctx.addIssue({ code: 'custom', message: 'ANALYSIS_INVALID_TARGET' });
    return z.NEVER;
  }
});

export const localAnalysisRequestSchema = z.object({
  url: localAnalysisUrlSchema,
  profile: z.enum(['mobile', 'desktop', 'both']).default('mobile'),
  locale: z.string().regex(/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/).max(12).default('tr'),
}).strict();
export type LocalAnalysisRequest = z.infer<typeof localAnalysisRequestSchema>;
