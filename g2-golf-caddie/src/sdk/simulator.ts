/**
 * Browser simulator host.
 *
 * The G2 development loop is otherwise: build, deploy to the hub, put the
 * glasses on, walk outside. This implements the same `GlassesHost` contract
 * against a DOM mock of the 576×288 display, keyboard gestures, and a GPS you
 * can walk around a real course's coordinates — so the whole app is testable at
 * a desk, and the device only has to confirm what already works.
 */

import { destinationPoint, type LatLng } from '../core/geo.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Page } from '../ui/page.js';
import type {
  DeviceState,
  GlassInput,
  GlassesHost,
  GpsFix,
  InputSource,
} from './host.js';

export interface Waypoint {
  label: string;
  position: LatLng;
}

export interface SimulatorOptions {
  mount: HTMLElement;
  start: LatLng;
  /** Jumpable positions — usually each hole's tee and green. */
  waypoints?: Waypoint[];
  /** Metres moved per key press. */
  stepMeters?: number;
  /** Reported GPS accuracy, so weak-signal handling can be exercised. */
  accuracyMeters?: number;
}

const SCALE = 1.6;

export class SimulatorHost implements GlassesHost {
  private page: Page = { texts: [], lists: [] };
  private position: LatLng;
  private waypointIndex = 0;

  private readonly inputListeners = new Set<(input: GlassInput) => void>();
  private readonly locationListeners = new Set<(fix: GpsFix) => void>();
  private readonly deviceListeners = new Set<(state: DeviceState) => void>();

  private locationTimer: ReturnType<typeof setInterval> | undefined;
  private readonly screenEl: HTMLElement;
  private readonly statusEl: HTMLElement;
  private readonly options: Required<Omit<SimulatorOptions, 'mount' | 'start'>>;

  constructor(options: SimulatorOptions) {
    this.position = options.start;
    this.options = {
      waypoints: options.waypoints ?? [],
      stepMeters: options.stepMeters ?? 10,
      accuracyMeters: options.accuracyMeters ?? 4,
    };

    const { screen, status } = buildChrome(options.mount);
    this.screenEl = screen;
    this.statusEl = status;

    window.addEventListener('keydown', this.onKeyDown);
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
    this.statusEl.textContent = 'App closed (shutDownPageContainer)';
    return true;
  }

  onInput(callback: (input: GlassInput) => void): () => void {
    this.inputListeners.add(callback);
    return () => this.inputListeners.delete(callback);
  }

  onDeviceState(callback: (state: DeviceState) => void): () => void {
    this.deviceListeners.add(callback);
    // Report a connected pair immediately, as the real bridge does on attach.
    queueMicrotask(() => callback({ connected: true, batteryLevel: 82, isWearing: true }));
    return () => this.deviceListeners.delete(callback);
  }

  async getLocation(): Promise<GpsFix | null> {
    return this.fix();
  }

  async startLocationUpdates(intervalMs: number): Promise<boolean> {
    this.stopTimer();
    this.locationTimer = setInterval(() => this.emitLocation(), intervalMs);
    return true;
  }

  async stopLocationUpdates(): Promise<boolean> {
    this.stopTimer();
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

  /** Release timers and listeners; used by hot-module reload. */
  dispose(): void {
    this.stopTimer();
    window.removeEventListener('keydown', this.onKeyDown);
  }

  // ---- simulation ---------------------------------------------------------

  private stopTimer(): void {
    if (this.locationTimer) clearInterval(this.locationTimer);
    this.locationTimer = undefined;
  }

  private fix(): GpsFix {
    return {
      ...this.position,
      accuracy: this.options.accuracyMeters,
      timestamp: Date.now(),
    };
  }

  private emitLocation(): void {
    const fix = this.fix();
    for (const listener of this.locationListeners) listener(fix);
  }

  private emit(input: GlassInput): void {
    for (const listener of this.inputListeners) listener(input);
  }

  private move(bearing: number): void {
    this.position = destinationPoint(this.position, bearing, this.options.stepMeters);
    this.emitLocation();
    this.paint();
  }

  private jumpWaypoint(delta: number): void {
    const { waypoints } = this.options;
    if (waypoints.length === 0) return;
    this.waypointIndex =
      (this.waypointIndex + delta + waypoints.length) % waypoints.length;
    const waypoint = waypoints[this.waypointIndex];
    if (!waypoint) return;
    this.position = waypoint.position;
    this.emitLocation();
    this.paint();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const source: InputSource = event.shiftKey ? 'ring' : 'glassesRight';
    const handled = (): void => {
      event.preventDefault();
      this.paint();
    };

    switch (event.key) {
      case 'ArrowUp':
        this.emit({ type: 'scrollUp', source });
        return handled();
      case 'ArrowDown':
        this.emit({ type: 'scrollDown', source });
        return handled();
      case 'Enter':
      case ' ':
        this.emit({ type: 'click', source });
        return handled();
      case 'm':
      case 'M':
        this.emit({ type: 'doubleClick', source });
        return handled();
      case 'w':
        this.move(0);
        return handled();
      case 's':
        this.move(180);
        return handled();
      case 'a':
        this.move(270);
        return handled();
      case 'd':
        this.move(90);
        return handled();
      case '[':
        this.jumpWaypoint(-1);
        return handled();
      case ']':
        this.jumpWaypoint(1);
        return handled();
      default:
        return;
    }
  };

  // ---- painting -----------------------------------------------------------

  private paint(): void {
    this.screenEl.replaceChildren(
      ...this.page.lists.map((list) => {
        const el = box(list.x, list.y, list.width, list.height);
        el.style.whiteSpace = 'pre';
        el.append(
          ...list.items.map((item, index) => {
            const row = document.createElement('div');
            row.textContent = item;
            if (index === (list.selectedIndex ?? 0)) {
              row.style.outline = '1px solid #9ff';
              row.style.background = 'rgba(150,255,255,0.12)';
            }
            return row;
          }),
        );
        return el;
      }),
      ...this.page.texts.map((text) => {
        const el = box(text.x, text.y, text.width, text.height);
        el.style.whiteSpace = 'pre';
        el.textContent = text.content;
        return el;
      }),
    );

    const waypoint = this.options.waypoints[this.waypointIndex];
    this.statusEl.textContent =
      `GPS ${this.position.lat.toFixed(6)}, ${this.position.lng.toFixed(6)} ` +
      `±${this.options.accuracyMeters}m` +
      (waypoint ? `  ·  near ${waypoint.label}` : '');
  }
}

function box(x: number, y: number, width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style.overflow = 'hidden';
  return el;
}

function buildChrome(mount: HTMLElement): { screen: HTMLElement; status: HTMLElement } {
  mount.innerHTML = '';

  const frame = document.createElement('div');
  frame.style.cssText = `
    width: ${CANVAS_WIDTH * SCALE}px;
    height: ${CANVAS_HEIGHT * SCALE}px;
    background: #05100f;
    border: 2px solid #1d3b38;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  `;

  const screen = document.createElement('div');
  screen.style.cssText = `
    position: absolute;
    inset: 0;
    width: ${CANVAS_WIDTH}px;
    height: ${CANVAS_HEIGHT}px;
    transform: scale(${SCALE});
    transform-origin: top left;
    color: #7dffe4;
    font: 20px/28px "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  `;
  frame.append(screen);

  const status = document.createElement('div');
  status.style.cssText = 'font: 13px/1.6 system-ui, sans-serif; color: #5b6b6a;';

  const help = document.createElement('div');
  help.style.cssText = 'font: 13px/1.6 system-ui, sans-serif; color: #5b6b6a;';
  help.textContent =
    '↑/↓ scroll · Enter tap · M double-tap · W/A/S/D walk 10 m · [ ] jump between tees and greens';

  mount.append(frame, status, help);
  return { screen, status };
}
