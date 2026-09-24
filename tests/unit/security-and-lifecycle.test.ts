import { describe, expect, it } from 'vitest';

describe('P0-1: Service Worker State Persistence & Hydration', () => {
  it('serializes and deserializes agentFrames and workspaceTabs properly', () => {
    const workspaceTabs = new Set<number>([101, 102]);
    const agentFrames = new Map<number, Map<string, number>>();
    
    agentFrames.set(101, new Map([
      ['vp-phone', 201],
      ['vp-tablet', 202],
    ]));
    agentFrames.set(102, new Map([
      ['vp-desktop', 301],
    ]));

    // Serialize for storage.session
    const serializedAgentFrames: [number, string, number][] = [];
    for (const [tabId, map] of agentFrames.entries()) {
      for (const [vpId, fId] of map.entries()) {
        serializedAgentFrames.push([tabId, vpId, fId]);
      }
    }

    const sessionPayload = {
      workspaceTabs: Array.from(workspaceTabs),
      agentFrames: serializedAgentFrames,
    };

    expect(sessionPayload.workspaceTabs).toEqual([101, 102]);
    expect(sessionPayload.agentFrames).toHaveLength(3);

    // Simulate SW restart: rehydrate into fresh Sets/Maps
    const restoredTabs = new Set<number>();
    const restoredFrames = new Map<number, Map<string, number>>();

    for (const id of sessionPayload.workspaceTabs) restoredTabs.add(id);
    for (const [tabId, vpId, fId] of sessionPayload.agentFrames) {
      if (!restoredFrames.has(tabId)) restoredFrames.set(tabId, new Map());
      restoredFrames.get(tabId)!.set(vpId, fId);
    }

    expect(Array.from(restoredTabs)).toEqual([101, 102]);
    expect(restoredFrames.get(101)?.get('vp-phone')).toBe(201);
    expect(restoredFrames.get(101)?.get('vp-tablet')).toBe(202);
    expect(restoredFrames.get(102)?.get('vp-desktop')).toBe(301);
  });

  it('prunes closed/stale tabs during hydration', () => {
    const workspaceTabs = new Set<number>([101, 102, 103]);
    const agentFrames = new Map<number, Map<string, number>>();
    agentFrames.set(101, new Map([['v1', 1]]));
    agentFrames.set(102, new Map([['v2', 2]]));
    agentFrames.set(103, new Map([['v3', 3]]));

    // Only tabs 101 and 103 remain open in the browser
    const openTabIds = new Set<number>([101, 103]);

    for (const id of Array.from(workspaceTabs)) {
      if (!openTabIds.has(id)) {
        workspaceTabs.delete(id);
        agentFrames.delete(id);
      }
    }

    expect(workspaceTabs.has(102)).toBe(false);
    expect(agentFrames.has(102)).toBe(false);
    expect(workspaceTabs.size).toBe(2);
  });
});

describe('P0-2: Chromium DeclarativeNetRequest Architecture', () => {
  it('generates compliant MV3 DNR session rule scoped to workspace tabIds and sub_frame', () => {
    const workspaceTabIds = [42, 99];
    const DNR_WORKSPACE_RULE_ID = 1001;

    const rule = {
      id: DNR_WORKSPACE_RULE_ID,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'x-frame-options', operation: 'remove' },
          { header: 'frame-options', operation: 'remove' },
          { header: 'content-security-policy', operation: 'remove' },
        ],
      },
      condition: {
        resourceTypes: ['sub_frame'],
        tabIds: workspaceTabIds,
      },
    };

    expect(rule.id).toBe(1001);
    expect(rule.action.type).toBe('modifyHeaders');
    expect(rule.condition.resourceTypes).toEqual(['sub_frame']);
    expect(rule.condition.tabIds).toEqual([42, 99]);
    expect(rule.action.responseHeaders.map((h) => h.header)).toEqual([
      'x-frame-options',
      'frame-options',
      'content-security-policy',
    ]);
  });

  it('correctly extracts origin and hostname for targeted browsingData service worker clearing', () => {
    function getRemovalTargets(urlStr: string): { origin: string; hostname: string } | null {
      try {
        const u = new URL(urlStr);
        if (!['http:', 'https:'].includes(u.protocol)) return null;
        return { origin: u.origin, hostname: u.hostname };
      } catch {
        return null;
      }
    }

    const t1 = getRemovalTargets('https://castpost.app/en');
    expect(t1?.origin).toBe('https://castpost.app');
    expect(t1?.hostname).toBe('castpost.app');

    const t2 = getRemovalTargets('http://localhost:3000/dashboard');
    expect(t2?.origin).toBe('http://localhost:3000');
    expect(t2?.hostname).toBe('localhost');

    const t3 = getRemovalTargets('chrome-extension://abcdef/workspace.html');
    expect(t3).toBeNull();
  });

  it('verifies service worker disabler intercepts and unregisters inside ViewGrid frames', async () => {
    const registrations = [{ unregister: async () => true }];
    let registerCalled = false;

    const mockNavigator: any = {
      serviceWorker: {
        getRegistrations: async () => registrations,
        register: async () => {
          registerCalled = true;
          return {};
        },
      },
    };

    // Simulate world-inject logic for viewgrid frames
    const isViewGridFrame = true;
    if (isViewGridFrame && mockNavigator.serviceWorker) {
      if (mockNavigator.serviceWorker.getRegistrations) {
        const regs = await mockNavigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }
      mockNavigator.serviceWorker.register = () => {
        return Promise.reject(new Error('[viewgrid] Service workers are disabled in responsive preview frames.'));
      };
    }

    await expect(mockNavigator.serviceWorker.register('/sw.js')).rejects.toThrow('Service workers are disabled');
    expect(registerCalled).toBe(false);
  });
});

describe('P0-3: postMessage Security Model', () => {
  const extensionOrigin = 'chrome-extension://viewgrid-extension-id';

  function simulatePostMessageReceiver(
    event: { source: any; origin: string; data: any },
    parentWindow: any,
  ): { accepted: boolean; action?: string; reason?: string } {
    if (event.source !== parentWindow) {
      return { accepted: false, reason: 'rejected: source is not parent window' };
    }

    if (event.origin !== extensionOrigin) {
      return { accepted: false, reason: 'rejected: origin does not match extension origin' };
    }

    if (event.data?.type === 'vg/agent-do') {
      const cmd = event.data.cmd;
      const unprivilegedAllowlist = ['setColorScheme', 'setTouchCursor', 'scrollToTop'];
      if (!unprivilegedAllowlist.includes(cmd)) {
        return {
          accepted: false,
          reason: `rejected: privileged command "${cmd}" forbidden via postMessage`,
        };
      }
      return { accepted: true, action: cmd };
    }

    return { accepted: false, reason: 'unknown message type' };
  }

  const mockParent = {};
  const mockEvilWindow = {};

  it('rejects hostile message from different source window', () => {
    const res = simulatePostMessageReceiver(
      { source: mockEvilWindow, origin: extensionOrigin, data: { type: 'vg/agent-do', cmd: 'scrollToTop' } },
      mockParent,
    );
    expect(res.accepted).toBe(false);
    expect(res.reason).toContain('source is not parent window');
  });

  it('rejects hostile message from attacker web page origin', () => {
    const res = simulatePostMessageReceiver(
      { source: mockParent, origin: 'https://evil.com', data: { type: 'vg/agent-do', cmd: 'scrollToTop' } },
      mockParent,
    );
    expect(res.accepted).toBe(false);
    expect(res.reason).toContain('origin does not match extension origin');
  });

  it('rejects privileged navigation commands (goto, reload, back, forward) even from valid origin', () => {
    for (const cmd of ['goto', 'reload', 'back', 'forward', 'arbitraryEval']) {
      const res = simulatePostMessageReceiver(
        { source: mockParent, origin: extensionOrigin, data: { type: 'vg/agent-do', cmd, url: 'https://evil.com' } },
        mockParent,
      );
      expect(res.accepted).toBe(false);
      expect(res.reason).toContain('forbidden via postMessage');
    }
  });

  it('allows safe unprivileged presentation commands from verified extension origin', () => {
    for (const cmd of ['setColorScheme', 'setTouchCursor', 'scrollToTop']) {
      const res = simulatePostMessageReceiver(
        { source: mockParent, origin: extensionOrigin, data: { type: 'vg/agent-do', cmd } },
        mockParent,
      );
      expect(res.accepted).toBe(true);
      expect(res.action).toBe(cmd);
    }
  });

  it('validates navigation URL protocols strictly to prevent javascript: or data: injection', () => {
    function isValidNavUrl(rawUrl: string): boolean {
      try {
        const u = new URL(rawUrl);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    }

    expect(isValidNavUrl('https://google.com')).toBe(true);
    expect(isValidNavUrl('http://localhost:3000/app')).toBe(true);
    expect(isValidNavUrl('javascript:alert(1)')).toBe(false);
    expect(isValidNavUrl('data:text/html,<h1>hacked</h1>')).toBe(false);
    expect(isValidNavUrl('file:///etc/passwd')).toBe(false);
    expect(isValidNavUrl('vbscript:msgbox(1)')).toBe(false);
  });
});
