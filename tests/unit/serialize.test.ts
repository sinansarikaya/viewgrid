import { describe, expect, it } from 'vitest';
import {
  defaultWorkspace,
  deserializeWorkspace,
  parseWorkspace,
  serializeWorkspace,
} from '../../src/core/workspace/serialize';

describe('workspace serialization', () => {
  it('round-trips a model', () => {
    const m = defaultWorkspace('https://example.com');
    m.name = 'My Website';
    m.viewports = [
      {
        id: 'vp_1',
        deviceId: 'iphone-15-pro',
        orientation: 'portrait',
        zoom: 0.75,
        minimized: false,
        hidden: false,
        url: 'https://example.com',
      },
    ];
    m.sync.scroll = true;
    m.sync.input = false;
    const parsed = deserializeWorkspace(serializeWorkspace(m));
    expect(parsed.ok).toBe(true);
    expect(parsed.model).toEqual(m);
  });

  it('rejects wrong schemaVersion but keeps parseable shape reported', () => {
    const res = parseWorkspace({ schemaVersion: 2, viewports: [] });
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toContain('schemaVersion');
  });

  it('normalizes hostile input (defaults + clamps)', () => {
    const res = parseWorkspace({
      schemaVersion: 1,
      viewports: [
        { id: 'a', zoom: 99, orientation: 'diagonal' },
        { noId: true },
        'junk',
      ],
      sync: { scroll: 'yes', click: true },
      layout: 'chaos',
    });
    expect(res.model?.viewports.length).toBe(1);
    expect(res.model?.viewports[0]!.zoom).toBe(3);
    expect(res.model?.viewports[0]!.orientation).toBe('portrait');
    expect(res.model?.layout).toBe('grid');
    expect(res.model?.sync.scroll).toBe(true); // non-boolean ignored → default (DEFAULT_SYNC.scroll)
    expect(res.model?.sync.click).toBe(true);
  });

  it('preserves colorScheme and frameFinish when provided', () => {
    const res = parseWorkspace({
      schemaVersion: 1,
      touchCursor: true,
      viewports: [
        { id: 'v1', colorScheme: 'dark', frameFinish: 'silver' },
      ],
    });
    expect(res.ok).toBe(true);
    expect(res.model?.viewports[0]?.colorScheme).toBe('dark');
    expect(res.model?.viewports[0]?.frameFinish).toBe('silver');
    expect(res.model?.touchCursor).toBe(true);
  });

  it('fails soft on invalid JSON', () => {
    const res = deserializeWorkspace('{oops');
    expect(res.ok).toBe(false);
  });
});

describe('untrusted workspace data', () => {
  it('rejects duplicate IDs', () => expect(parseWorkspace({ schemaVersion: 1, viewports: [{ id: 'a' }, { id: 'a' }] }).ok).toBe(false));
  it('rejects incomplete/negative custom devices', () => expect(parseWorkspace({ schemaVersion: 1, viewports: [{ id: 'a', custom: { width: -10, height: 0 } }] }).ok).toBe(false));
  it('rejects executable URLs', () => expect(parseWorkspace({ schemaVersion: 1, url: 'javascript:alert(1)', viewports: [] }).ok).toBe(false));
  it('normalizes non-finite zoom', () => expect(parseWorkspace({ schemaVersion: 1, viewports: [{ id: 'a', zoom: NaN }] }).model?.viewports[0]?.zoom).toBe(1));
});
