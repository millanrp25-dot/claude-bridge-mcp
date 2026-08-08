/**
 * Page renderer.
 *
 * Yardages refresh roughly once a second while walking. A full
 * `rebuildPageContainer` on every fix visibly flickers the display, so the
 * renderer diffs: identical layout with different strings becomes a set of
 * `textContainerUpgrade` calls, and only a genuine layout change rebuilds.
 */

import type { GlassesHost } from '../sdk/host.js';
import {
  changedTexts,
  structuralSignature,
  validatePage,
  type Page,
} from './page.js';

export class Renderer {
  private current?: Page;
  private currentSignature?: string;
  private started = false;
  /** Serialises bridge calls — overlapping rebuilds race on the device. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly host: GlassesHost) {}

  /**
   * Render a page, choosing the cheapest device call that gets there.
   *
   * Returns how the frame was delivered, which the simulator surfaces and the
   * tests assert on.
   */
  render(page: Page): Promise<'created' | 'rebuilt' | 'updated' | 'skipped'> {
    validatePage(page);
    const result = this.queue.then(() => this.renderNow(page));
    // Keep the chain alive even if one frame fails; a dropped frame should not
    // wedge every later update.
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async renderNow(
    page: Page,
  ): Promise<'created' | 'rebuilt' | 'updated' | 'skipped'> {
    const signature = structuralSignature(page);

    if (!this.started) {
      await this.host.createPage(page);
      this.started = true;
      this.current = page;
      this.currentSignature = signature;
      return 'created';
    }

    if (signature !== this.currentSignature) {
      await this.host.rebuildPage(page);
      this.current = page;
      this.currentSignature = signature;
      return 'rebuilt';
    }

    const changed = this.current ? changedTexts(this.current, page) : page.texts;
    if (changed.length === 0) return 'skipped';

    for (const text of changed) {
      await this.host.updateText(text.id, text.name, text.content);
    }
    this.current = page;
    return 'updated';
  }

  /**
   * Resolve once every queued frame has reached the device.
   *
   * Re-checks the queue after each await because a frame can enqueue another
   * (a toast expiring mid-render, say).
   */
  async settled(): Promise<void> {
    let seen: Promise<unknown> | undefined;
    while (seen !== this.queue) {
      seen = this.queue;
      await seen;
    }
  }

  /** Forget device state so the next render re-creates the startup page. */
  reset(): void {
    this.started = false;
    this.current = undefined;
    this.currentSignature = undefined;
  }
}
