import { describe, expect, it } from 'vitest';
import { detectBrowserLanguage } from '../../src/ui/workspace/store';
import { getTranslation } from '../../src/ui/workspace/i18n';

describe('browser language detection and fallback', () => {
  it('detects Turkish language variations', () => {
    expect(detectBrowserLanguage('tr')).toBe('tr');
    expect(detectBrowserLanguage('tr-TR')).toBe('tr');
    expect(detectBrowserLanguage('TR-tr')).toBe('tr');
  });

  it('detects Norwegian language variations (no, nb, nn)', () => {
    expect(detectBrowserLanguage('no')).toBe('no');
    expect(detectBrowserLanguage('no-NO')).toBe('no');
    expect(detectBrowserLanguage('nb')).toBe('no');
    expect(detectBrowserLanguage('nb-NO')).toBe('no');
    expect(detectBrowserLanguage('nn')).toBe('no');
    expect(detectBrowserLanguage('nn-NO')).toBe('no');
  });

  it('detects English language variations', () => {
    expect(detectBrowserLanguage('en')).toBe('en');
    expect(detectBrowserLanguage('en-US')).toBe('en');
    expect(detectBrowserLanguage('en-GB')).toBe('en');
    expect(detectBrowserLanguage('en-AU')).toBe('en');
  });

  it('defaults to English when browser language is anything else', () => {
    expect(detectBrowserLanguage('de-DE')).toBe('en');
    expect(detectBrowserLanguage('fr-FR')).toBe('en');
    expect(detectBrowserLanguage('es-ES')).toBe('en');
    expect(detectBrowserLanguage('ja-JP')).toBe('en');
    expect(detectBrowserLanguage('zh-CN')).toBe('en');
    expect(detectBrowserLanguage('')).toBe('en');
    expect(detectBrowserLanguage(undefined, [])).toBe('en');
  });

  it('inspects language list in priority order', () => {
    expect(detectBrowserLanguage(undefined, ['de-DE', 'tr-TR', 'en-US'])).toBe('tr');
    expect(detectBrowserLanguage(undefined, ['fr-FR', 'nb-NO'])).toBe('no');
    expect(detectBrowserLanguage(undefined, ['es-ES', 'it-IT'])).toBe('en');
  });

  it('returns valid dictionary for each language', () => {
    expect(getTranslation('tr').language).toBe('Dil');
    expect(getTranslation('no').language).toBe('Språk');
    expect(getTranslation('en').language).toBe('Language');
  });
});
