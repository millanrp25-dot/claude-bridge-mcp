/**
 * Shared test fixtures: a two-hole course laid out with real geometry, and an
 * in-memory `GlassesHost` that records every call.
 */

import { destinationPoint, type LatLng } from '../src/core/geo.js';
import { parseCourse, type Course } from '../src/core/course.js';
import type {
  DeviceState,
  GlassInput,
  GlassesHost,
  GpsFix,
} from '../src/sdk/host.js';
import type { Page } from '../src/ui/page.js';

export const TEE_1: LatLng = { lat: 44.2815, lng: -121.3182, elevation: 0 };

/** Hole 1: 360 m due east, 30 m deep green, water at 200 m carry. */
const GREEN_1_CENTER = destinationPoint(TEE_1, 90, 360);
const TEE_2 = destinationPoint(TEE_1, 180, 100);
const GREEN_2_CENTER = destinationPoint(TEE_2, 180, 150);

export function testCourse(): Course {
  return parseCourse({
    id: 'test-course',
    name: 'Test Links',
    version: 1,
    holes: [
      {
        number: 1,
        par: 4,
        handicap: 3,
        tees: [{ name: 'Blue', position: TEE_1 }],
        green: {
          front: { ...destinationPoint(TEE_1, 90, 345), elevation: 6 },
          center: { ...GREEN_1_CENTER, elevation: 6 },
          back: { ...destinationPoint(TEE_1, 90, 375), elevation: 6 },
        },
        hazards: [
          {
            name: 'Creek',
            kind: 'water',
            carry: destinationPoint(TEE_1, 90, 200),
            far: destinationPoint(TEE_1, 90, 215),
          },
          {
            name: 'Way left bunker',
            kind: 'bunker',
            // 60 m off the centre line: mapped, but never in play.
            carry: destinationPoint(destinationPoint(TEE_1, 90, 150), 0, 60),
          },
        ],
      },
      {
        number: 2,
        par: 3,
        tees: [{ name: 'Blue', position: TEE_2 }],
        green: {
          front: destinationPoint(TEE_2, 180, 140),
          center: GREEN_2_CENTER,
          back: destinationPoint(TEE_2, 180, 160),
        },
      },
    ],
  });
}

export interface RecordedCall {
  kind: 'create' | 'rebuild' | 'text';
  page?: Page;
  containerId?: number;
  content?: string;
}

/** Host double: records display calls, lets tests push input and GPS. */
export class FakeHost implements GlassesHost {
  readonly calls: RecordedCall[] = [];
  readonly storage = new Map<string, string>();
  shutDownCalls = 0;
  locationUpdatesStarted = false;

  private inputListeners = new Set<(input: GlassInput) => void>();
  private locationListeners = new Set<(fix: GpsFix) => void>();
  private deviceListeners = new Set<(state: DeviceState) => void>();

  async createPage(page: Page): Promise<boolean> {
    this.calls.push({ kind: 'create', page });
    return true;
  }

  async rebuildPage(page: Page): Promise<boolean> {
    this.calls.push({ kind: 'rebuild', page });
    return true;
  }

  async updateText(containerId: number, _name: string, content: string): Promise<boolean> {
    this.calls.push({ kind: 'text', containerId, content });
    return true;
  }

  async shutDown(): Promise<boolean> {
    this.shutDownCalls += 1;
    return true;
  }

  onInput(callback: (input: GlassInput) => void): () => void {
    this.inputListeners.add(callback);
    return () => this.inputListeners.delete(callback);
  }

  onDeviceState(callback: (state: DeviceState) => void): () => void {
    this.deviceListeners.add(callback);
    return () => this.deviceListeners.delete(callback);
  }

  async getLocation(): Promise<GpsFix | null> {
    return null;
  }

  async startLocationUpdates(): Promise<boolean> {
    this.locationUpdatesStarted = true;
    return true;
  }

  async stopLocationUpdates(): Promise<boolean> {
    this.locationUpdatesStarted = false;
    return true;
  }

  onLocation(callback: (fix: GpsFix) => void): () => void {
    this.locationListeners.add(callback);
    return () => this.locationListeners.delete(callback);
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<boolean> {
    this.storage.set(key, value);
    return true;
  }

  // ---- test helpers -------------------------------------------------------

  emitInput(input: GlassInput): void {
    for (const listener of this.inputListeners) listener(input);
  }

  emitLocation(fix: GpsFix): void {
    for (const listener of this.locationListeners) listener(fix);
  }

  emitDeviceState(state: DeviceState): void {
    for (const listener of this.deviceListeners) listener(state);
  }

  private lastPageIndex(): number {
    for (let index = this.calls.length - 1; index >= 0; index -= 1) {
      if (this.calls[index]?.page) return index;
    }
    return -1;
  }

  lastPage(): Page | undefined {
    const index = this.lastPageIndex();
    return index === -1 ? undefined : this.calls[index]?.page;
  }

  /**
   * Flattened text currently on the display.
   *
   * Only text updates issued *after* the most recent create/rebuild count —
   * earlier ones belong to a page that has since been replaced.
   */
  screenText(): string {
    const pageIndex = this.lastPageIndex();
    const page = this.calls[pageIndex]?.page;
    if (!page) return '';

    const contents = new Map(page.texts.map((text) => [text.id, text.content]));
    for (const call of this.calls.slice(pageIndex + 1)) {
      if (call.kind === 'text' && call.containerId !== undefined) {
        contents.set(call.containerId, call.content ?? '');
      }
    }
    return [...contents.values(), ...page.lists.flatMap((list) => list.items)].join('\n');
  }
}
