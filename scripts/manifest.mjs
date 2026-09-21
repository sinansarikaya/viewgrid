/**
 * Per-browser manifest generation (Firefox-first MV3 + Chromium MV3).
 * Prunes unused permissions (scripting, unlimitedStorage) and handles
 * browser-specific rules (webRequestBlocking in Firefox, contextMenus in Chromium).
 */
export function buildManifest(target, iconFiles) {
  const base = {
    manifest_version: 3,
    name: 'ViewGrid',
    version: '0.1.0',
    description:
      'Multi-viewport responsive testing workspace: test a site across phone, tablet, laptop and desktop viewports at once.',
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
    web_accessible_resources: [
      {
        resources: ['world-inject.js'],
        matches: ['<all_urls>'],
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
    return {
      ...base,
      permissions: [
        'storage',
        'tabs',
        'activeTab',
        'downloads',
        'scripting',
        'menus',
        'webRequest',
        'webRequestBlocking',
        'declarativeNetRequest',
        'declarativeNetRequestWithHostAccess',
        'browsingData',
        'cookies',
      ],
      browser_specific_settings: {
        gecko: {
          id: 'viewgrid@viewgrid.dev',
          strict_min_version: '115.0',
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
    permissions: [
      'storage',
      'tabs',
      'activeTab',
      'downloads',
      'scripting',
      'contextMenus',
      'declarativeNetRequest',
      'declarativeNetRequestWithHostAccess',
      'browsingData',
      'cookies',
    ],
    background: { service_worker: 'background.js' },
  };
}
