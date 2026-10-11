import { z } from 'zod';
import { escapeReportText } from './html';

export const MAX_REPORT_SCREENSHOT_BYTES = 6 * 1024 * 1024;
export const reportScreenshotSchema = z.object({
  viewportName: z.string().trim().min(1).max(160),
  previewUrl: z.string().max(2048),
  cssWidth: z.number().int().min(100).max(10000),
  cssHeight: z.number().int().min(100).max(10000),
  capturedAt: z.iso.datetime({ offset: true }),
  pngDataUrl: z.string().max(MAX_REPORT_SCREENSHOT_BYTES * 4 / 3 + 64).regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/),
});
export type ReportScreenshot = z.infer<typeof reportScreenshotSchema>;

/** Local-only attachment. Never pass screenshots to the analysis provider. */
export function sanitizeReportScreenshot(input: unknown): ReportScreenshot {
  const parsed = reportScreenshotSchema.parse(input);
  const url = new URL(parsed.previewUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('REPORT_INVALID_SCREENSHOT_URL');
  url.search = '';
  url.hash = '';
  const binary = atob(parsed.pngDataUrl.split(',')[1]!);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (binary.length < 45 || binary.length > MAX_REPORT_SCREENSHOT_BYTES || signature.some((value, index) => binary.charCodeAt(index) !== value) || binary.slice(12, 16) !== 'IHDR' || binary.slice(-8, -4) !== 'IEND') throw new Error('REPORT_INVALID_PNG');
  const numberAt = (offset: number) => new DataView(Uint8Array.from(binary.slice(offset, offset + 4), char => char.charCodeAt(0)).buffer).getUint32(0);
  const width = numberAt(16), height = numberAt(20);
  if (width < 1 || height < 1 || width * height > 32_000_000) throw new Error('REPORT_INVALID_PNG_SIZE');
  return { ...parsed, previewUrl: url.href };
}

const captions = {
  tr: { title: 'İsteğe bağlı viewport görüntüsü', note: 'Yerel responsive önizleme görüntüsüdür; laboratuvar ölçümü değildir ve analiz hedefiyle aynı sayfa olmayabilir. Adres seçilen viewport için yapılandırılmış URL’dir; yönlendirme sonrası güncel adres doğrulanmamıştır. Görüntü site içeriği veya kişisel veri içerebilir; paylaşmadan önce inceleyin.' },
  en: { title: 'Optional viewport screenshot', note: 'Local responsive preview, not a laboratory measurement; the preview may differ from the analysis target. The address is the selected viewport’s configured URL; its current URL after redirects is not verified. The image may contain site content or personal data; review before sharing.' },
  no: { title: 'Valgfritt skjermbilde av visningsområdet', note: 'Lokal responsiv forhåndsvisning, ikke en laboratoriemåling; siden kan avvike fra analysemålet. Adressen er visningsområdets konfigurerte URL; gjeldende adresse etter omdirigering er ikke verifisert. Bildet kan inneholde sideinnhold eller personopplysninger; kontroller før deling.' },
};

export function attachScreenshotToHtml(html: string, input: ReportScreenshot | null, language: 'tr' | 'en' | 'no' = 'tr'): string {
  if (!input) return html;
  const shot = sanitizeReportScreenshot(input), t = captions[language], e = escapeReportText;
  const section = `<style>.viewgrid-report-screenshot{max-width:100%;height:auto}</style><section><h2>${e(t.title)}</h2><p>${e(t.note)}</p><p>${e(shot.viewportName)} · ${shot.cssWidth} × ${shot.cssHeight} CSS px · ${e(shot.previewUrl)} · ${e(shot.capturedAt)}</p><img class="viewgrid-report-screenshot" src="${shot.pngDataUrl}" alt="${e(shot.viewportName)}" width="${shot.cssWidth}"></section>`;
  if (!html.includes('</body>')) throw new Error('REPORT_INVALID_HTML');
  return html.replace("img-src 'none'", 'img-src data:').replace('</body>', `${section}</body>`);
}

export function attachScreenshotToJson(json: string, input: ReportScreenshot | null): string {
  if (!input) return json;
  return JSON.stringify({ ...JSON.parse(json), viewportScreenshot: sanitizeReportScreenshot(input) }, null, 2);
}
