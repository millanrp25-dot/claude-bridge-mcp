/**
 * Screen contract and the slice of the app screens are allowed to touch.
 *
 * Screens receive an `AppApi` rather than the `App` itself so they stay
 * unit-testable against a plain object, and so navigation and persistence
 * remain the app's job rather than something each screen re-implements.
 */

import type { Club, ClubStat } from '../../core/clubs.js';
import type { Course } from '../../core/course.js';
import type { GpsFix, DeviceState, GlassInput } from '../../sdk/host.js';
import type { Round } from '../../core/round.js';
import type { Settings } from '../../core/storage.js';
import type { Page } from '../page.js';
import type { MappingSession } from '../../core/mapping.js';

export interface AppState {
  /** Bundled courses plus anything recorded on device. */
  courses: Course[];
  course?: Course;
  round?: Round;
  settings: Settings;
  device: DeviceState;
  /** Most recent GPS fix; absent until the first one lands. */
  fix?: GpsFix;
  fixReceivedAt?: number;
  bag: Club[];
  stats: Map<string, ClubStat>;
  mapping?: MappingSession;
  /** Transient banner, e.g. "Shot 148 yd logged". */
  toast?: { text: string; until: number };
}

export interface Screen {
  readonly id: string;
  build(app: AppApi): Page;
  handle(input: GlassInput, app: AppApi): void | Promise<void>;
}

export interface AppApi {
  readonly state: AppState;
  readonly now: number;

  push(screen: Screen): void;
  pop(): void;
  replace(screen: Screen): void;

  /** Apply a state change, then re-render and persist. */
  patch(changes: Partial<AppState>): void;
  setRound(round: Round): void;
  toast(text: string, durationMs?: number): void;

  /** Close the glasses page and hand control back to the launcher. */
  exit(): void;
}
