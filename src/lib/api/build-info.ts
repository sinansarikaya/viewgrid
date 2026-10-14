import { b } from '../../platform/browser';

export async function loadBuildFingerprint(): Promise<string | null> {
  try {
    const response = await fetch(b.runtime.getURL('build-info.json'));
    if (!response.ok) return null;
    const info: unknown = await response.json();
    if (info && typeof info === 'object' && 'build' in info && typeof info.build === 'string' && /^[a-f0-9]{12}$/.test(info.build)) return info.build;
  } catch { /* Optional build metadata must not block the workspace. */ }
  return null;
}
