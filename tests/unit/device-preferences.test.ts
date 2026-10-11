// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../../src/ui/workspace/store';
import { defaultWorkspace } from '../../src/core/workspace/serialize';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';

const persisted = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('../../src/platform/browser', () => ({ b: { storage: { local: {
  get: vi.fn(async () => persisted.value),
  set: vi.fn(async (value: Record<string, unknown>) => { persisted.value = value; }),
} } } }));
vi.mock('../../src/ui/workspace/bridge', () => ({ hasHostAccess: vi.fn(async () => true) }));
beforeEach(() => {
  persisted.value = {};
  useStore.setState({ model: defaultWorkspace('https://example.com'), customDevices: [], favoriteDeviceIds: [], recentDeviceIds: [], deviceGroups: {} });
});
describe('device selection preferences', () => {
  it('keeps old workspaces and applies empty defaults to newly introduced preferences', async () => {
    const model = defaultWorkspace('https://example.com');
    persisted.value = { 'viewgrid.store.v1': { model, language: 'tr', languageExplicitlySet: true } };
    await useStore.getState().hydrate();
    expect(useStore.getState().model.url).toBe('https://example.com');
    expect(useStore.getState().language).toBe('tr');
    expect(useStore.getState().favoriteDeviceIds).toEqual([]);
    expect(useStore.getState().deviceGroups).toEqual({});
  });
  it('persists favorites, ordered unique recents and named groups without replacing workspace settings', async () => {
    const device = BUILTIN_DEVICES[0]!;
    useStore.getState().toggleDeviceFavorite(device.id);
    useStore.getState().addDevice(device);
    useStore.getState().addDevice(device);
    useStore.getState().saveDeviceGroup('Phone checks', [device.id, device.id, 'unknown']);
    await useStore.getState().persist();
    useStore.setState({ favoriteDeviceIds: [], recentDeviceIds: [], deviceGroups: {} });
    await useStore.getState().hydrate();
    expect(useStore.getState().model.viewports).toHaveLength(2);
    expect(useStore.getState().favoriteDeviceIds).toEqual([device.id]);
    expect(useStore.getState().recentDeviceIds).toEqual([device.id]);
    expect(useStore.getState().deviceGroups['Phone checks']).toEqual([device.id]);
    useStore.getState().deleteDeviceGroup('Phone checks');
    expect(useStore.getState().deviceGroups).toEqual({});
  });
  it('bounds untrusted stored lists and ignores malformed group entries', async () => {
    persisted.value = { 'viewgrid.store.v1': { model: defaultWorkspace(), favoriteDeviceIds: ['a', 'a', 42], recentDeviceIds: Array.from({ length: 40 }, (_, i) => String(i)), deviceGroups: { '': ['a'], valid: [42, 'a', 'a'], malformed: null } } };
    await useStore.getState().hydrate();
    expect(useStore.getState().favoriteDeviceIds).toEqual(['a']);
    expect(useStore.getState().recentDeviceIds).toHaveLength(12);
    expect(useStore.getState().deviceGroups.valid).toEqual(['a']);
    expect(Object.keys(useStore.getState().deviceGroups)).not.toContain('');
  });
});
