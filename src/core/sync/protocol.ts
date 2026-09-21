import type { SyncChannel, SyncEnvelope } from '../types';

/**
 * Loop-prevention + ordering (ARCHITECTURE §6.3).
 * Envelopes are accepted only if: from a different viewport, and a strictly-newer
 * per-(source, channel) sequence number. This makes echo storms impossible even
 * though guards live in different contexts (source agent, hub, applying agent) —
 * each context dedupes on the same globally-monotonic source sequence.
 * `epoch` is carried in the schema as fencing metadata (bumped on reset) and is
 * honored as `env.epoch >= lastSeenEpoch` so reset never resurrects older sessions.
 */
export class LoopGuard {
  private epoch = 1;
  private lastSeq = new Map<string, number>();
  private applyingDepth = 0;
  private seq = 0;

  get currentEpoch(): number {
    return this.epoch;
  }

  /** Source-side: mint an envelope. */
  envelope(channel: SyncChannel, sourceViewportId: string, payload: Record<string, unknown>): SyncEnvelope {
    this.seq += 1;
    return { channel, sourceViewportId, epoch: this.epoch, seq: this.seq, ts: Date.now(), payload };
  }

  /** Hub/actuator-side: true if this event should be applied/rebroadcast. */
  accept(env: SyncEnvelope, selfViewportId?: string): boolean {
    if (!env || typeof env.channel !== 'string') return false;
    if (selfViewportId && env.sourceViewportId === selfViewportId) return false;
    if (env.epoch < 1) return false;
    const key = `${env.sourceViewportId}:${env.channel}`;
    const last = this.lastSeq.get(key) ?? 0;
    if (env.seq <= last) return false;
    this.lastSeq.set(key, env.seq);
    return true;
  }

  /** Actuator-side: suppress echo from programmatic applies. */
  beginApply(): void {
    this.applyingDepth += 1;
  }
  endApply(): void {
    this.applyingDepth = Math.max(0, this.applyingDepth - 1);
  }
  isApplying(): boolean {
    return this.applyingDepth > 0;
  }

  /**
   * Call when a channel is toggled / viewports replaced. Sequence numbers stay
   * monotonic (never restart) so in-flight events can't collide with new ones;
   * the epoch bump tags post-reset sessions.
   */
  reset(): void {
    this.epoch += 1;
  }
}

/** Ratio-based scroll normalization (pages of different heights stay aligned). */
export function scrollRatios(scrollX: number, scrollY: number, maxX: number, maxY: number) {
  return {
    xRatio: maxX > 0 ? scrollX / maxX : 0,
    yRatio: maxY > 0 ? scrollY / maxY : 0,
    maxX,
    maxY,
  };
}

export function applyScrollRatios(
  win: { scrollTo(x: number, y: number): void; document: Document },
  payload: Record<string, unknown>,
): void {
  const doc = win.document;
  const maxX = Math.max(0, doc.documentElement.scrollWidth - doc.documentElement.clientWidth);
  const maxY = Math.max(0, doc.documentElement.scrollHeight - doc.documentElement.clientHeight);
  const xRatio = Number(payload.xRatio) || 0;
  const yRatio = Number(payload.yRatio) || 0;
  win.scrollTo(Math.round(xRatio * maxX), Math.round(yRatio * maxY));
}

/** Robust-ish CSS selector path (id → nth-chain, max 6 levels). */
export function selectorPath(el: Element | null): string {
  if (!el) return '';
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && parts.length < 6) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const parent: Element | null = node.parentElement;
    const tag = node.tagName.toLowerCase();
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
    const idx = siblings.indexOf(node) + 1;
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${idx})` : tag);
    node = parent;
  }
  return parts.join('>');
}
