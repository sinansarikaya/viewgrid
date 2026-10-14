import { describe, expect, it } from 'vitest';
import { attachScreenshotToHtml, attachScreenshotToJson, sanitizeReportScreenshot } from '../../src/core/reports/screenshots';

const bytes = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64'));
const shot = { viewportName: '<script>unsafe</script>', previewUrl: 'http://127.0.0.1/site?token=secret#private', cssWidth: 393, cssHeight: 852, capturedAt: '2026-10-11T12:00:00.000Z', pngDataUrl: `data:image/png;base64,${Buffer.from(bytes).toString('base64')}` };

describe('local report screenshot boundary', () => {
  it('redacts metadata queries and escapes captions without external images', () => {
    const html = attachScreenshotToHtml('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src \'none\'"></head><body></body></html>', shot);
    expect(html).toContain('393 × 852 CSS px');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('token=secret');
    expect(html).not.toContain('#private');
    expect(html).toContain('laboratuvar ölçümü değildir');
    expect(html).toContain('img-src data:');
    expect(html).toContain("default-src 'none'");
    expect(JSON.parse(attachScreenshotToJson('{}', shot)).viewportScreenshot.previewUrl).toBe('http://127.0.0.1/site');
  });
  it('rejects remote/SVG images, credentials and invalid PNG signatures', () => {
    for (const pngDataUrl of ['https://example.com/image.png', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,YmFk']) expect(() => sanitizeReportScreenshot({ ...shot, pngDataUrl })).toThrow();
    expect(() => sanitizeReportScreenshot({ ...shot, previewUrl: 'https://user:password@example.com/' })).toThrow();
  });
  it('rejects huge dimensions even with a small encoded header', () => {
    const huge = bytes.slice();
    new DataView(huge.buffer).setUint32(16, 100000);
    new DataView(huge.buffer).setUint32(20, 100000);
    expect(() => sanitizeReportScreenshot({ ...shot, pngDataUrl: `data:image/png;base64,${Buffer.from(huge).toString('base64')}` })).toThrow('REPORT_INVALID_PNG_SIZE');
  });
  it('does not mutate a report unless an attachment is explicitly selected', () => {
    expect(attachScreenshotToHtml('unchanged', null)).toBe('unchanged');
    expect(attachScreenshotToJson('unchanged', null)).toBe('unchanged');
  });
});
