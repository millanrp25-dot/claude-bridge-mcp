/**
 * Application shell: state, navigation stack, and the wiring between the host
 * (GPS, input, storage) and the screens.
 *
 * Screens stay pure-ish — they build a page and ask the app to change state.
 * Everything with a side effect lives here, in one place that can be reasoned
 * about when a round goes wrong on the 12th tee.
 */

import { clubStats, DEFAULT_BAG } from './core/clubs.js';
import type { Course } from './core/course.js';
import { finishRound, type Round } from './core/round.js';
import { DEFAULT_SETTINGS, Store } from './core/storage.js';
import type { DeviceState, GlassInput, GlassesHost, GpsFix } from './sdk/host.js';
import { applyToast } from './ui/layout.js';
import { Renderer } from './ui/renderer.js';
import { holeScreen } from './ui/screens/hole.js';
import { setupScreen } from './ui/screens/setup.js';
import type { AppApi, AppState, Screen } from './ui/screens/types.js';

export interface AppOptions {
  host: GlassesHost;
  /** Courses shipped with the app; device-recorded ones are merged on top. */
  bundledCourses: Course[];
  /** Injected for tests; defaults to wall-clock time. */
  now?: () => number;
  /** GPS poll interval. One second matches how fast a walking yardage moves. */
  locationIntervalMs?: number;
}

const TOAST_MS = 2500;
const ROUND_SAVE_DEBOUNCE_MS = 1200;

export class App implements AppApi {
  private readonly host: GlassesHost;
  private readonly store: Store;
  private readonly renderer: Renderer;
  private readonly clock: () => number;
  private readonly locationIntervalMs: number;
  private readonly bundledIds: Set<string>;

  private stack: Screen[] = [];
  private unsubscribes: Array<() => void> = [];
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  state: AppState;

  constructor({
    host,
    bundledCourses,
    now = () => Date.now(),
    locationIntervalMs = 1000,
  }: AppOptions) {
    this.host = host;
    this.store = new Store(host);
    this.renderer = new Renderer(host);
    this.clock = now;
    this.locationIntervalMs = locationIntervalMs;
    this.bundledIds = new Set(bundledCourses.map((course) => course.id));

    this.state = {
      courses: bundledCourses,
      settings: { ...DEFAULT_SETTINGS },
      device: { connected: false },
      bag: DEFAULT_BAG,
      stats: new Map(),
    };
  }

  get now(): number {
    return this.clock();
  }

  /**
   * Restore anything saved, subscribe to the host, and paint the first frame.
   *
   * A round that was interrupted resumes straight onto the playing screen —
   * the common case is the phone locking between holes, not a fresh start.
   */
  async start(): Promise<void> {
    const [settings, customCourses, activeRound] = await Promise.all([
      this.store.loadSettings(),
      this.store.loadCustomCourses(),
      this.store.loadActiveRound(),
    ]);

    const courses = [
      ...this.state.courses,
      ...customCourses.filter(
        (course) => !this.state.courses.some((entry) => entry.id === course.id),
      ),
    ];

    this.state = { ...this.state, settings, courses };

    if (activeRound && !activeRound.endedAt) {
      const course = courses.find((entry) => entry.id === activeRound.courseId);
      if (course) {
        this.state = {
          ...this.state,
          course,
          round: activeRound,
          stats: clubStats(await this.allKnownShots(activeRound)),
        };
      }
    }

    this.subscribe();
    await this.host.startLocationUpdates(this.locationIntervalMs);

    // One immediate fix so the first frame is not a "waiting for GPS" screen if
    // the phone already has a position.
    void this.host
      .getLocation()
      .then((fix) => fix && this.onLocation(fix))
      .catch(() => undefined);

    this.stack = [this.state.round ? holeScreen() : setupScreen()];
    this.render();
  }

  /** Shot history across the archive plus the live round, for club learning. */
  private async allKnownShots(round?: Round) {
    const history = await this.store.loadHistory();
    const shots = history.flatMap((entry) => entry.shots);
    return round ? [...shots, ...round.shots] : shots;
  }

  private subscribe(): void {
    this.unsubscribes.push(
      this.host.onInput((input) => void this.handleInput(input)),
      this.host.onLocation((fix) => this.onLocation(fix)),
      this.host.onDeviceState((device: DeviceState) => {
        this.state = { ...this.state, device };
        this.render();
      }),
    );
  }

  private onLocation(fix: GpsFix): void {
    this.state = { ...this.state, fix, fixReceivedAt: this.now };
    this.render();
  }

  private async handleInput(input: GlassInput): Promise<void> {
    const screen = this.currentScreen();
    if (!screen) return;
    try {
      await screen.handle(input, this);
    } catch (error) {
      console.error('[g2-golf] input handler failed:', error);
      this.toast('Something went wrong — try again');
    }
  }

  private currentScreen(): Screen | undefined {
    return this.stack[this.stack.length - 1];
  }

  // ---- AppApi -------------------------------------------------------------

  push(screen: Screen): void {
    this.stack.push(screen);
    this.render();
  }

  pop(): void {
    // Never pop the last screen; a blank display with no way back is a dead app.
    if (this.stack.length > 1) this.stack.pop();
    this.render();
  }

  replace(screen: Screen): void {
    this.stack[Math.max(0, this.stack.length - 1)] = screen;
    this.render();
  }

  patch(changes: Partial<AppState>): void {
    const coursesChanged =
      changes.courses !== undefined && changes.courses !== this.state.courses;

    this.state = { ...this.state, ...changes };

    if (changes.settings) void this.store.saveSettings(changes.settings);
    if (coursesChanged) void this.persistCustomCourses();
    if (changes.round) this.scheduleRoundSave();

    this.render();
  }

  setRound(round: Round): void {
    this.state = { ...this.state, round };
    this.scheduleRoundSave();
    this.render();
  }

  toast(text: string, durationMs = TOAST_MS): void {
    this.state = { ...this.state, toast: { text, until: this.now + durationMs } };
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.state = { ...this.state, toast: undefined };
      this.render();
    }, durationMs);
    this.render();
  }

  exit(): void {
    void this.dispose().then(() => this.host.shutDown(0));
  }

  // ---- internals ----------------------------------------------------------

  private async persistCustomCourses(): Promise<void> {
    const custom = this.state.courses.filter((course) => !this.bundledIds.has(course.id));
    await this.store.saveCustomCourses(custom);
  }

  /**
   * Round writes are debounced: scroll through six holes and that is six state
   * changes but one write, which matters when storage round-trips through the
   * Flutter bridge.
   */
  private scheduleRoundSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const round = this.state.round;
      if (round) void this.store.saveActiveRound(round);
    }, ROUND_SAVE_DEBOUNCE_MS);
  }

  /** Build and push the current screen's page to the display. */
  render(): void {
    if (this.disposed) return;
    const screen = this.currentScreen();
    if (!screen) return;

    try {
      void this.renderer.render(
        applyToast(screen.build(this), this.state.toast, this.now),
      );
    } catch (error) {
      console.error('[g2-golf] render failed:', error);
    }
  }

  /** Resolve once every queued frame has been pushed to the display. */
  settled(): Promise<void> {
    return this.renderer.settled();
  }

  /** Flush pending writes and drop every subscription. */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    await this.settled();
    this.disposed = true;

    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);

    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.unsubscribes = [];

    const round = this.state.round;
    if (round) {
      if (round.endedAt) {
        await this.store.archiveRound(round);
        await this.store.clearActiveRound();
      } else {
        await this.store.saveActiveRound(round);
      }
    }

    await this.host.stopLocationUpdates().catch(() => undefined);
  }

  /** Archive the current round immediately, e.g. from a "finish" action. */
  async finishAndArchive(): Promise<void> {
    const round = this.state.round;
    if (!round) return;
    const finished = finishRound(round, this.now);
    await this.store.archiveRound(finished);
    await this.store.clearActiveRound();
    this.state = { ...this.state, round: finished };
    this.render();
  }
}
