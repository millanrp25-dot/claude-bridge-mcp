/**
 * Persistence on top of Even App's key/value storage.
 *
 * A round has to survive the WebView being backgrounded between holes, which on
 * a phone in a pocket happens constantly. Everything is written through a small
 * versioned envelope so a future schema change can migrate instead of losing
 * somebody's card on the 14th.
 */

import type { GlassesHost } from '../sdk/host.js';
import type { Course } from './course.js';
import { parseCourse } from './course.js';
import type { DistanceUnit } from './geo.js';
import type { Round } from './round.js';

const KEY_PREFIX = 'g2golf.v1.';
const KEY_ACTIVE_ROUND = `${KEY_PREFIX}activeRound`;
const KEY_SETTINGS = `${KEY_PREFIX}settings`;
const KEY_HISTORY = `${KEY_PREFIX}history`;
const KEY_CUSTOM_COURSES = `${KEY_PREFIX}courses`;

/** Rounds kept for club learning; older cards are dropped. */
const MAX_HISTORY_ROUNDS = 40;

export interface Settings {
  unit: DistanceUnit;
  teeName?: string;
  /** Metres of GPS accuracy above which yardages are flagged as unreliable. */
  courseId?: string;
}

export const DEFAULT_SETTINGS: Settings = { unit: 'yards' };

interface Envelope<T> {
  version: 1;
  data: T;
}

function wrap<T>(data: T): string {
  return JSON.stringify({ version: 1, data } satisfies Envelope<T>);
}

function unwrap<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<Envelope<T>>;
    if (parsed.version !== 1) return undefined;
    return parsed.data;
  } catch {
    // Corrupt storage should degrade to "no saved data", never crash startup.
    return undefined;
  }
}

export class Store {
  constructor(private readonly host: GlassesHost) {}

  async loadSettings(): Promise<Settings> {
    const stored = unwrap<Partial<Settings>>(await this.host.getItem(KEY_SETTINGS));
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.host.setItem(KEY_SETTINGS, wrap(settings));
  }

  async loadActiveRound(): Promise<Round | undefined> {
    return unwrap<Round>(await this.host.getItem(KEY_ACTIVE_ROUND));
  }

  async saveActiveRound(round: Round): Promise<void> {
    await this.host.setItem(KEY_ACTIVE_ROUND, wrap(round));
  }

  async clearActiveRound(): Promise<void> {
    await this.host.setItem(KEY_ACTIVE_ROUND, '');
  }

  async loadHistory(): Promise<Round[]> {
    return unwrap<Round[]>(await this.host.getItem(KEY_HISTORY)) ?? [];
  }

  /** Archive a finished round, newest first, trimmed to the retention limit. */
  async archiveRound(round: Round): Promise<Round[]> {
    const history = await this.loadHistory();
    const next = [round, ...history.filter((entry) => entry.id !== round.id)].slice(
      0,
      MAX_HISTORY_ROUNDS,
    );
    await this.host.setItem(KEY_HISTORY, wrap(next));
    return next;
  }

  /**
   * Courses recorded on the device by the walk-and-mark screen, kept separate
   * from the bundled ones so a rebuild of the app never wipes them.
   */
  async loadCustomCourses(): Promise<Course[]> {
    const raw = unwrap<unknown[]>(await this.host.getItem(KEY_CUSTOM_COURSES)) ?? [];
    const courses: Course[] = [];
    for (const entry of raw) {
      try {
        courses.push(parseCourse(entry));
      } catch (error) {
        console.warn('[g2-golf] dropping unreadable saved course:', error);
      }
    }
    return courses;
  }

  async saveCustomCourse(course: Course): Promise<Course[]> {
    const existing = await this.loadCustomCourses();
    const next = [course, ...existing.filter((entry) => entry.id !== course.id)];
    await this.saveCustomCourses(next);
    return next;
  }

  async saveCustomCourses(courses: Course[]): Promise<void> {
    await this.host.setItem(KEY_CUSTOM_COURSES, wrap(courses));
  }
}
