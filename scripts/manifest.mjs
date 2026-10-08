import fs from 'node:fs';
const packageVersion = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

/**
 * Per-browser manifest generation (Firefox MV2 + Chromium MV3).
 * Prunes unused permissions (scripting, unlimitedStorage) and handles
 * browser-specific rules (webRequestBlocking in Firefox, contextMenus in Chromium).
 */
export function buildManifest(target, iconFiles) {
  const base = {
    manifest_version: 3,
    name: 'ViewGrid — Responsive Viewer',
    version: packageVersion,
    description:
      'Multi-viewport responsive web design & layout testing workspace with side-by-side device previews and synchronized scrolling.',
    icons: iconFiles,
    host_permissions: ['<all_urls>'],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content/agent.js'],
        run_at: 'document_start',
        all_frames: true,
        match_about_blank: true,
      },
    ],
    action: {
      default_title: 'ViewGrid',
      default_icon: iconFiles,
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    commands: {
      _execute_action: {
        suggested_key: { default: 'Alt+Shift+V', mac: 'Command+Shift+V' },
        description: 'Open ViewGrid workspace',
      },
    },
  };

  if (target === 'firefox') {
    const { action, host_permissions, commands, ...common } = base;
    return {
      ...common,
      // Firefox MV3 cannot relax CSP/X-Frame-Options (Mozilla bug 1785821).
      manifest_version: 2,
      browser_action: action,
      content_scripts: [...base.content_scripts, { matches: ['<all_urls>'], js: ['world-inject.js'], run_at: 'document_start', all_frames: true, world: 'MAIN' }],
      commands: { _execute_browser_action: commands._execute_action },
      permissions: [
        'storage',
        'tabs',
        'activeTab',
        'downloads',
        'browsingData',
        'scripting',
        'menus',
        'webRequest',
        'webRequestBlocking',
        ...host_permissions,
      ],
      browser_specific_settings: {
        gecko: {
          id: 'viewgrid@viewgrid.dev',
          strict_min_version: '128.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
      background: { scripts: ['background.js'] },
    };
  }

  // Chromium (Chrome Web Store / Edge Add-ons)
  return {
    ...base,
    content_scripts: [...base.content_scripts, { matches: ['<all_urls>'], js: ['world-inject.js'], run_at: 'document_start', all_frames: true, world: 'MAIN' }],
    permissions: [
      'storage',
      'tabs',
      'activeTab',
      'downloads',
      'browsingData',
      'scripting',
      'contextMenus',
      'declarativeNetRequest',
      'declarativeNetRequestWithHostAccess',
    ],
    background: { service_worker: 'background.js' },
  };
}
