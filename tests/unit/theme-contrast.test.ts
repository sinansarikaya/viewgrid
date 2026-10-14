import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/ui/global.css', import.meta.url), 'utf8');
function tokens(selector: string) {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map((m) => [m[1], m[2]]));
}
function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
describe.each([':root', ":root[data-theme='light']"])('%s normal text contrast', (selector) => {
  const palette = tokens(selector);
  it('keeps body and muted text readable on workspace surfaces', () => {
    for (const foreground of ['text', 'text-dim', 'crit', 'major', 'minor', 'ok', 'beta']) {
      for (const background of ['bg', 'panel', 'panel-2']) {
        expect(contrast(palette[foreground], palette[background]), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('keeps primary button text readable both normally and on hover', () => {
    for (const background of ['accent', 'accent-2', 'crit']) {
      expect(contrast(palette['accent-text'], palette[background]), background).toBeGreaterThanOrEqual(4.5);
    }
  });
});
