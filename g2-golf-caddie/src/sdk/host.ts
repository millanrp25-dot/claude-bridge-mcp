/**
 * The surface of the Even App bridge this app depends on.
 *
 * Screens and the renderer talk to `GlassesHost`, never to the SDK directly.
 * That keeps the whole app runnable in a browser against the simulator, and
 * keeps the SDK's protobuf-shaped types out of the golf logic.
 */

import type { LatLng } from '../core/geo.js';
import type { Page } from '../ui/page.js';

/** Normalised input, collapsed from list/text/sys events and both touchpads. */
export type GlassInput =
  | { type: 'click'; source: InputSource }
  | { type: 'doubleClick'; source: InputSource }
  | { type: 'scrollUp'; source: InputSource }
  | { type: 'scrollDown'; source: InputSource }
  | { type: 'listSelect'; containerId: number; index: number; name: string }
  | { type: 'exit'; reason: 'system' | 'abnormal' | 'foreground' };

export type InputSource = 'glassesLeft' | 'glassesRight' | 'ring' | 'unknown';

export interface GpsFix extends LatLng {
  /** Reported horizontal accuracy in metres, when the platform provides it. */
  accuracy?: number;
  timestamp?: number;
}

export interface DeviceState {
  connected: boolean;
  batteryLevel?: number;
  isWearing?: boolean;
}

export interface GlassesHost {
  /** Must be called once, before any other display call. */
  createPage(page: Page): Promise<boolean>;
  rebuildPage(page: Page): Promise<boolean>;
  /** Flicker-free content swap for a single text container. */
  updateText(containerId: number, containerName: string, content: string): Promise<boolean>;
  shutDown(exitMode?: number): Promise<boolean>;

  onInput(callback: (input: GlassInput) => void): () => void;
  onDeviceState(callback: (state: DeviceState) => void): () => void;

  getLocation(): Promise<GpsFix | null>;
  startLocationUpdates(intervalMs: number): Promise<boolean>;
  stopLocationUpdates(): Promise<boolean>;
  onLocation(callback: (fix: GpsFix) => void): () => void;

  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<boolean>;
}
