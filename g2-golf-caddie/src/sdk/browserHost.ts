/**
 * Real mobile-browser host: no Even Hub, no glasses, just a phone.
 *
 * Built for the gap between "wrote an app" and "can actually get it onto G2
 * glasses" — that path runs through the Even Hub developer portal (account,
 * upload, device pairing) and is not something a fresh deploy can shortcut.
 * This host implements the exact same `GlassesHost` contract using the phone's
 * real GPS (`navigator.geolocation`) and touch input instead, so every screen,
 * the yardage engine, and the walk-and-mark recorder work completely unchanged
 * — only how frames reach the screen and how gestures come back differ.
 */

import type { LatLng } from '../core/geo.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Page } from '../ui/page.js';
import type { DeviceState, GlassInput, GlassesHost, GpsFix } from './host.js';

export function isSecureEnoughForGeolocation(): boolean {
  return typeof window !== 'undefined' && (window.isSecureContext ?? false);
}

export function hasGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

function toGpsFix(position: GeolocationPosition): GpsFix {
  const fix: GpsFix = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
  if (position.coords.altitude !== null) fix.elevation = position.coords.altitude;
  return fix;
}

export class BrowserHost implements GlassesHost {
  private page: Page = { texts: [], lists: [] };
  private watchId: number | undefined;
  private geoError: string | undefined;

  private readonly inputListeners = new Set<(input: GlassInput) => void>();
  private readonly locationListeners = new Set<(fix: GpsFix) => void>();
  private readonly deviceListeners = new Set<(state: DeviceState) => void>();

  private readonly root: HTMLElement;
  private readonly screenEl: HTMLElement;
  private readonly statusEl: HTMLElement;

  constructor(mount: HTMLElement) {
    const { root, screen, status } = buildChrome(mount);
    this.root = root;
    this.screenEl = screen;
    this.statusEl = status;
    this.paint();
  }

  // ---- GlassesHost --------------------------------------------------------

  async createPage(page: Page): Promise<boolean> {
    this.page = page;
    this.paint();
    return true;
  }

  async rebuildPage(page: Page): Promise<boolean> {
    this.page = page;
    this.paint();
    return true;
  }

  async updateText(containerId: number, _name: string, content: string): Promise<boolean> {
    this.page = {
      ...this.page,
      texts: this.page.texts.map((text) =>
        text.id === containerId ? { ...text, content } : text,
      ),
    };
    this.paint();
    return true;
  }

  async shutDown(): Promise<boolean> {
    this.root.innerHTML = '';
    const done = document.createElement('div');
    done.className = 'g2-done';
    done.textContent = 'Round closed — you can close this tab.';
    this.root.append(done);
    return true;
  }

  onInput(callback: (input: GlassInput) => void): () => void {
    this.inputListeners.add(callback);
    return () => this.inputListeners.delete(callback);
  }

  onDeviceState(callback: (state: DeviceState) => void): () => void {
    this.deviceListeners.add(callback);
    queueMicrotask(() => callback({ connected: true }));
    return () => this.deviceListeners.delete(callback);
  }

  async getLocation(): Promise<GpsFix | null> {
    if (!hasGeolocation()) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(toGpsFix(position)),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 2_000 },
      );
    });
  }

  async startLocationUpdates(): Promise<boolean> {
    if (!hasGeolocation()) {
      this.geoError = 'This browser has no location support.';
      this.paint();
      return false;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.geoError = undefined;
        const fix = toGpsFix(position);
        for (const listener of this.locationListeners) listener(fix);
        this.paint();
      },
      (error) => {
        this.geoError =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied — allow it in the browser and reload.'
            : `Location error: ${error.message}`;
        this.paint();
      },
      { enableHighAccuracy: true, maximumAge: 1_000, timeout: 15_000 },
    );
    return true;
  }

  async stopLocationUpdates(): Promise<boolean> {
    if (this.watchId !== undefined) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = undefined;
    return true;
  }

  onLocation(callback: (fix: GpsFix) => void): () => void {
    this.locationListeners.add(callback);
    return () => this.locationListeners.delete(callback);
  }

  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<boolean> {
    window.localStorage.setItem(key, value);
    return true;
  }

  // ---- input ----------------------------------------------------------------

  private emit(input: GlassInput): void {
    for (const listener of this.inputListeners) listener(input);
  }

  // ---- painting ---------------------------------------------------------

  private paint(): void {
    const hasLists = this.page.lists.length > 0;

    this.screenEl.replaceChildren(
      ...this.page.texts.map((text) => {
        const el = document.createElement('div');
        el.className = text.name === 'header' ? 'g2-header' : text.name === 'footer' ? 'g2-footer' : 'g2-body';
        el.textContent = text.content;
        return el;
      }),
      ...this.page.lists.flatMap((list) =>
        list.items.map((item, index) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'g2-row';
          row.textContent = item;
          row.addEventListener('click', () =>
            this.emit({ type: 'listSelect', containerId: list.id, index, name: item }),
          );
          return row;
        }),
      ),
    );

    // Playing screen gets hole-navigation and mark-ball controls; list screens
    // get a back button instead — the row taps above already act as "choose".
    const controls = document.createElement('div');
    controls.className = 'g2-controls';

    if (hasLists) {
      controls.append(button('◀ Back', () => this.emit({ type: 'doubleClick', source: 'unknown' })));
    } else {
      controls.append(
        button('▲ Prev hole', () => this.emit({ type: 'scrollUp', source: 'unknown' })),
        button('Mark ball', () => this.emit({ type: 'click', source: 'unknown' }), 'g2-primary'),
        button('▼ Next hole', () => this.emit({ type: 'scrollDown', source: 'unknown' })),
        button('Menu', () => this.emit({ type: 'doubleClick', source: 'unknown' })),
      );
    }

    this.statusEl.textContent = this.geoError ?? '';
    this.statusEl.hidden = !this.geoError;

    const existingControls = this.root.querySelector('.g2-controls');
    existingControls?.replaceWith(controls);
    if (!existingControls) this.root.append(controls);
  }
}

function button(label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `g2-btn ${extraClass}`.trim();
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

function buildChrome(mount: HTMLElement): {
  root: HTMLElement;
  screen: HTMLElement;
  status: HTMLElement;
} {
  mount.innerHTML = '';

  const style = document.createElement('style');
  style.textContent = `
    :root {
      --g2-ground: #0a1512;
      --g2-surface: #12241f;
      --g2-surface-active: #1a3229;
      --g2-border: #1f3b32;
      --g2-text: #eef7f0;
      --g2-text-muted: #7fa08e;
      --g2-accent: #d7ff4a;
      --g2-accent-ink: #14210b;
      --g2-warn: #ffb37a;
      --g2-warn-ground: #241407;
    }
    .g2-root {
      display: flex; flex-direction: column; height: 100%; min-height: 100dvh;
      background: var(--g2-ground); color: var(--g2-text);
      font-family: -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
    }
    .g2-screen { flex: 1; display: flex; flex-direction: column; padding: max(18px, env(safe-area-inset-top)) 18px 8px; gap: 12px; overflow-y: auto; }
    .g2-header {
      font-size: 15px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
      white-space: pre-wrap; color: var(--g2-text-muted);
      font-family: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
    }
    .g2-body {
      font-size: 23px; line-height: 1.6; white-space: pre-wrap; flex: 1;
      font-family: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
      font-variant-numeric: tabular-nums;
    }
    .g2-footer {
      font-size: 13px; color: var(--g2-text-muted); white-space: pre-wrap;
      border-top: 1px solid var(--g2-border); padding-top: 10px;
      font-family: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
    }
    .g2-row {
      display: block; width: 100%; text-align: left; font: inherit; font-size: 18px; font-weight: 500;
      color: var(--g2-text); background: var(--g2-surface); border: 1px solid var(--g2-border);
      border-radius: 12px; padding: 15px 16px; margin-bottom: 8px;
    }
    .g2-row:active { background: var(--g2-surface-active); }
    .g2-row:focus-visible, .g2-btn:focus-visible { outline: 2px solid var(--g2-accent); outline-offset: 2px; }
    .g2-controls {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
      padding: 10px 14px max(16px, env(safe-area-inset-bottom));
      background: var(--g2-surface); border-top: 1px solid var(--g2-border);
    }
    .g2-controls:has(.g2-btn:only-child) { grid-template-columns: 1fr; }
    .g2-btn {
      font: inherit; font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
      color: var(--g2-text); background: var(--g2-ground); border: 1px solid var(--g2-border);
      border-radius: 12px; padding: 15px 4px;
    }
    .g2-btn:active { background: var(--g2-surface-active); }
    .g2-btn.g2-primary { background: var(--g2-accent); border-color: var(--g2-accent); color: var(--g2-accent-ink); font-weight: 700; }
    .g2-status { padding: 10px 18px; font-size: 13px; color: var(--g2-warn); background: var(--g2-warn-ground); text-align: center; }
    .g2-done { padding: 40px 24px; text-align: center; font-size: 18px; color: var(--g2-text); }
    @media (prefers-reduced-motion: no-preference) {
      .g2-row, .g2-btn { transition: background-color 120ms ease; }
    }
  `;
  mount.append(style);

  const root = document.createElement('div');
  root.className = 'g2-root';

  const status = document.createElement('div');
  status.className = 'g2-status';
  status.hidden = true;

  const screen = document.createElement('div');
  screen.className = 'g2-screen';
  // Aspect-ratio hint only — the mobile layout is a full-viewport stack, not a
  // literal 576×288 canvas, but keeping the constants imported documents why
  // the underlying page model still uses those dimensions for its own limits.
  screen.dataset.deviceCanvas = `${CANVAS_WIDTH}x${CANVAS_HEIGHT}`;

  root.append(status, screen);
  mount.append(root);

  return { root, screen, status };
}
