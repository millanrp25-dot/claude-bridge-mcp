/**
 * End-to-end behaviour through the real screens, driven by fake input and GPS.
 */

import { describe, expect, it } from 'vitest';

import { App } from '../src/app.js';
import { destinationPoint } from '../src/core/geo.js';
import { completedShots, openShot } from '../src/core/round.js';
import { FakeHost, TEE_1, testCourse } from './fixtures.js';
import type { GlassInput, GpsFix } from '../src/sdk/host.js';

const course = testCourse();

interface Harness {
  host: FakeHost;
  app: App;
  press(input: GlassInput): Promise<void>;
  walk(fix: GpsFix): Promise<void>;
  /** Pick a row from the list currently on screen. */
  choose(label: string): Promise<void>;
  /** Move the app's clock forward, e.g. past a toast. */
  advance(ms: number): Promise<void>;
  text(): string;
}

async function harness(): Promise<Harness> {
  const host = new FakeHost();
  let clock = 10_000;
  const app = new App({ host, bundledCourses: [course], now: () => clock });
  await app.start();

  const press = async (input: GlassInput) => {
    host.emitInput(input);
    await app.settled();
  };

  return {
    host,
    app,
    press,
    async walk(fix) {
      host.emitLocation(fix);
      await app.settled();
    },
    async choose(label) {
      const items = host.lastPage()?.lists[0]?.items ?? [];
      const index = items.findIndex((item) => item.startsWith(label));
      if (index === -1) {
        throw new Error(`no menu row starting with "${label}" in [${items.join(' | ')}]`);
      }
      await press({ type: 'listSelect', containerId: 4, index, name: items[index] ?? '' });
    },
    async advance(ms) {
      clock += ms;
      app.render();
      await app.settled();
    },
    text: () => host.screenText(),
  };
}

/** Boot, choose the only course, and drop the player on the first tee. */
async function playing(): Promise<Harness> {
  const h = await harness();
  await h.choose('Test Links');
  await h.walk({ ...TEE_1, accuracy: 4 });
  return h;
}

describe('startup', () => {
  it('opens on the course picker when there is no saved round', async () => {
    const h = await harness();
    expect(h.text()).toContain('Choose a course');
    expect(h.text()).toContain('Test Links');
  });

  it('subscribes to location updates', async () => {
    const h = await harness();
    expect(h.host.locationUpdatesStarted).toBe(true);
  });

  it('shows the waiting state until the first fix lands', async () => {
    const h = await harness();
    await h.choose('Test Links');
    expect(h.text()).toContain('Waiting for GPS');
  });
});

describe('playing screen', () => {
  it('shows front, centre and back once a fix arrives', async () => {
    const h = await playing();
    const text = h.text();

    // The tee is 360 m from the green centre — 394 yards.
    expect(text).toMatch(/CENTER\s+394 yd/);
    expect(text).toMatch(/FRONT 377/);
    expect(text).toMatch(/BACK 410/);
  });

  it('recomputes yardages as the player walks up the fairway', async () => {
    const h = await playing();
    await h.walk({ ...destinationPoint(TEE_1, 90, 160), accuracy: 4 });
    expect(h.text()).toMatch(/CENTER\s+219 yd/);
  });

  it('shows fix quality once the start-of-round toast has cleared', async () => {
    const h = await playing();
    await h.advance(5_000);
    expect(h.text()).toContain('GPS 4m');

    await h.walk({ ...TEE_1, accuracy: 45 });
    expect(h.text()).toContain('GPS WEAK 45m');
  });

  it('surfaces a hazard carry that is still in play', async () => {
    const h = await playing();
    expect(h.text()).toMatch(/WATER\s+carry 219/);
  });

  it('drops the hazard once the player has walked past it', async () => {
    const h = await playing();
    await h.walk({ ...destinationPoint(TEE_1, 90, 260), accuracy: 4 });
    expect(h.text()).not.toContain('WATER');
  });

  it('suggests a club for the plays-like distance', async () => {
    const h = await playing();
    await h.walk({ ...destinationPoint(TEE_1, 90, 220), accuracy: 4 });
    expect(h.text()).toMatch(/CLUB\s+\S/);
  });

  it('changes hole on scroll and stops at the last one', async () => {
    const h = await playing();

    await h.press({ type: 'scrollDown', source: 'glassesRight' });
    expect(h.app.state.round?.currentHole).toBe(2);

    await h.press({ type: 'scrollDown', source: 'glassesRight' });
    expect(h.app.state.round?.currentHole).toBe(2);

    await h.press({ type: 'scrollUp', source: 'glassesRight' });
    expect(h.app.state.round?.currentHole).toBe(1);
  });
});

describe('shot tracking', () => {
  it('marks the ball on a tap and measures the shot on the next tap', async () => {
    const h = await playing();

    await h.press({ type: 'click', source: 'glassesRight' });
    expect(openShot(h.app.state.round!, 1)).toBeDefined();

    await h.walk({ ...destinationPoint(TEE_1, 90, 210), accuracy: 4 });
    await h.press({ type: 'click', source: 'glassesRight' });

    const [shot] = completedShots(h.app.state.round!);
    expect(shot?.distanceMeters).toBeCloseTo(210, 0);
    expect(h.text()).toContain('Shot 230 yd');
  });

  it('refuses to mark a ball with no fix', async () => {
    const h = await harness();
    await h.choose('Test Links');

    await h.press({ type: 'click', source: 'glassesRight' });
    expect(h.app.state.round?.shots ?? []).toHaveLength(0);
    expect(h.text()).toContain('No GPS fix yet');
  });

  it('tags the last shot with a club and feeds it back into the stats', async () => {
    const h = await playing();

    await h.press({ type: 'click', source: 'glassesRight' });
    await h.walk({ ...destinationPoint(TEE_1, 90, 210), accuracy: 4 });
    await h.press({ type: 'click', source: 'glassesRight' });

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Tag last shot');
    // The list is ordered by closeness to the measured shot, so row 0 is the
    // club this player most likely hit.
    await h.press({ type: 'listSelect', containerId: 4, index: 0, name: '' });

    expect(completedShots(h.app.state.round!)[0]?.club).toBeDefined();
    expect(h.app.state.stats.size).toBe(1);
  });
});

describe('score entry', () => {
  it('records strokes and putts, then advances to the next hole', async () => {
    const h = await playing();

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Enter score');

    // Par 4 → one scroll up makes it a 5.
    await h.press({ type: 'scrollUp', source: 'glassesRight' });
    // Switch to putts and add two.
    await h.press({ type: 'click', source: 'glassesRight' });
    await h.press({ type: 'scrollUp', source: 'glassesRight' });
    await h.press({ type: 'scrollUp', source: 'glassesRight' });
    // Save and move on.
    await h.press({ type: 'doubleClick', source: 'glassesRight' });

    const hole = h.app.state.round!.scores.find((score) => score.holeNumber === 1)!;
    expect(hole.strokes).toBe(5);
    expect(hole.putts).toBe(2);
    expect(h.app.state.round?.currentHole).toBe(2);
  });

  it('defaults an untouched hole to par rather than leaving it blank', async () => {
    const h = await playing();

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Enter score');
    await h.press({ type: 'doubleClick', source: 'glassesRight' });

    expect(h.app.state.round!.scores[0]?.strokes).toBe(4);
  });
});

describe('navigation', () => {
  it('opens and closes the menu without losing the playing screen', async () => {
    const h = await playing();

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    expect(h.text()).toContain('Menu');

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    expect(h.text()).toMatch(/CENTER/);
  });

  it('shows the scorecard', async () => {
    const h = await playing();

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Scorecard');

    expect(h.text()).toContain('HOLE');
    expect(h.text()).toContain('PAR');
  });

  it('closes the glasses page on exit', async () => {
    const h = await playing();
    await h.press({ type: 'exit', reason: 'system' });
    await h.app.settled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(h.host.shutDownCalls).toBe(1);
  });
});

describe('course mapping', () => {
  async function mapping(): Promise<Harness> {
    const h = await playing();
    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Map this course');
    return h;
  }

  it('records a hazard where the player stands', async () => {
    const h = await mapping();
    await h.choose('Drop water hazard here');

    expect(h.app.state.mapping?.holes[0]?.hazards).toHaveLength(1);
    expect(h.text()).toContain('Water hazard recorded');
  });

  it('refuses to record anything without a fix', async () => {
    const h = await harness();
    await h.choose('Test Links');
    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Map this course');
    await h.choose('▶ Record');

    expect(h.app.state.mapping?.holes[0]?.tee).toBeUndefined();
    expect(h.text()).toContain('No GPS fix yet');
  });

  it('cycles par and skips to the next hole', async () => {
    const h = await mapping();
    await h.choose('Par 4 → 5');
    expect(h.app.state.mapping?.holes[0]?.par).toBe(5);

    await h.choose('Skip to hole 2');
    expect(h.app.state.mapping?.currentHole).toBe(2);
  });

  it('keeps the session when backing out, so mapping can be resumed', async () => {
    const h = await mapping();
    await h.choose('▶ Record');
    await h.press({ type: 'doubleClick', source: 'glassesRight' });

    expect(h.text()).toMatch(/CENTER/);
    expect(h.app.state.mapping?.holes[0]?.tee).toBeDefined();
  });
});

describe('persistence', () => {
  it('resumes an interrupted round straight onto the playing screen', async () => {
    const h = await playing();
    await h.press({ type: 'scrollDown', source: 'glassesRight' });
    await h.app.dispose();

    const resumed = new App({
      host: h.host,
      bundledCourses: [course],
      now: () => 20_000,
    });
    await resumed.start();
    h.host.emitLocation({ ...TEE_1, accuracy: 4 });
    await resumed.settled();

    expect(resumed.state.round?.currentHole).toBe(2);
    expect(h.text()).toContain('CENTER');
  });

  it('keeps the unit setting across restarts', async () => {
    const h = await harness();
    await h.choose('Units');
    expect(h.app.state.settings.unit).toBe('meters');
    await h.app.dispose();

    const restarted = new App({
      host: h.host,
      bundledCourses: [course],
      now: () => 20_000,
    });
    await restarted.start();
    expect(restarted.state.settings.unit).toBe('meters');
  });

  it('keeps a course recorded on device across restarts', async () => {
    const h = await playing();

    await h.press({ type: 'doubleClick', source: 'glassesRight' });
    await h.choose('Map this course');

    // Walk the four landmarks of hole 1, recording at each.
    for (const meters of [0, 330, 345, 360]) {
      await h.walk({ ...destinationPoint(TEE_1, 90, meters), accuracy: 4 });
      await h.choose('▶ Record');
    }
    await h.choose('Save & exit mapping');

    const recorded = h.app.state.courses.find((entry) => entry.id !== course.id)!;
    expect(recorded.holes).toHaveLength(1);
    expect(h.app.state.mapping).toBeUndefined();

    await h.app.dispose();

    const restarted = new App({
      host: h.host,
      bundledCourses: [course],
      now: () => 30_000,
    });
    await restarted.start();

    expect(restarted.state.courses.length).toBe(2);
  });
});
