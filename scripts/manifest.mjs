/**
 * Per-browser manifest generation (Firefox-first MV3).
 * Chromium variant keeps the same surface minus Firefox-only bits
 * (framing/`webRequestBlocking` is adapter-gated at runtime too).
 */
export function buildManifest(target, iconFiles) {
  const base = {
    manifest_version: 3,
    name: 'ViewGrid',
    version: '0.1.0',
    description:
      'Multi-viewport responsive testing workspace: test a site across phone, tablet, laptop and desktop viewports at once.',
    icons: iconFiles,
    permissions: [
      'storage',
      'unlimitedStorage',
      'activeTab',
      'scripting',
      'tabs',
      'menus',
    ],
    optional_host_permissions: ['*://*/*', 'http://localhost/*', 'http://127.0.0.1/*'],
    action: {
      default_title: 'ViewGrid',
      default_popup: 'popup.html',
      default_icon: iconFiles,
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    commands: {
      'open-workspace': {
        suggested_key: { default: 'Alt+Shift+V' },
        description: 'Open ViewGrid workspace',
      },
    },
  };

  if (target === 'firefox') {
    return {
      ...base,
      browser_specific_settings: {
        gecko: { id: 'viewgrid@viewgrid.dev', strict_min_version: '128.0' },
      },
      // Firefox MV3 still honors webRequest blocking — used ONLY to relax
      // framing headers for sub_frames of workspace tabs (see SECURITY.md §4).
      permissions: [...base.permissions, 'webRequest', 'webRequestBlocking'],
      background: { scripts: ['background.js'] },
    };
  }

  return {
    ...base,
    background: { service_worker: 'background.js' },
  };
}
