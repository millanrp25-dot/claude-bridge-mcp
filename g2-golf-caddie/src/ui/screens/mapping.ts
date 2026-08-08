/**
 * Walk-and-mark course recorder.
 *
 * A list rather than a bare "tap to record" screen, because a course needs more
 * than four points per hole: hazards have to be droppable where you stand, par
 * has to be settable, and a hole you cannot be bothered to map has to be
 * skippable. The top row is always the next landmark, so the common path is
 * still highlight-nothing, tap, walk, tap.
 */

import {
  currentMappedHole,
  goToMappingHole,
  isHoleComplete,
  mappingProgress,
  recordHazard,
  recordPoint,
  setPar,
  startMapping,
  STEP_LABEL,
  toCourse,
  type MappingSession,
} from '../../core/mapping.js';
import { CONTENT_CHARS, listScreen } from '../layout.js';
import type { GlassInput } from '../../sdk/host.js';
import { justify } from '../text.js';
import { holeScreen } from './hole.js';
import type { AppApi, Screen } from './types.js';

/**
 * Open a mapping session, resuming one already in progress.
 *
 * Called by the menu rather than by the screen's `build`: creating state while
 * rendering means a save that clears the session immediately gets a new one back
 * on the very next frame.
 */
export function openMapping(app: AppApi): void {
  if (!app.state.mapping) {
    app.patch({
      mapping: startMapping({
        courseName: app.state.course?.name ?? 'My Course',
        holeCount: app.state.course?.holes.length ?? 18,
        teeName: app.state.round?.teeName ?? 'Default',
        now: app.now,
      }),
    });
  }
  app.replace(mappingScreen());
}

interface Row {
  label: string;
  run(app: AppApi, session: MappingSession): void;
  /** Rows that place a point need a fix; the rest do not. */
  needsFix?: boolean;
}

/** 3 → 4 → 5 → 6 → 3, so one row covers every par without a sub-screen. */
export function nextPar(par: number): number {
  return par >= 6 ? 3 : Math.max(3, par + 1);
}

function rows(session: MappingSession): Row[] {
  const hole = currentMappedHole(session);
  const complete = hole ? isHoleComplete(hole) : false;

  return [
    {
      label: `▶ Record: ${STEP_LABEL[session.step]}${complete ? ' (re-record)' : ''}`,
      needsFix: true,
      run(app, current) {
        app.patch({ mapping: recordPoint(current, app.state.fix!) });
        app.toast(`Recorded ${STEP_LABEL[current.step].toLowerCase()}`);
      },
    },
    {
      label: 'Drop water hazard here',
      needsFix: true,
      run(app, current) {
        app.patch({
          mapping: recordHazard(current, app.state.fix!, { name: 'Water', kind: 'water' }),
        });
        app.toast('Water hazard recorded');
      },
    },
    {
      label: 'Drop bunker here',
      needsFix: true,
      run(app, current) {
        app.patch({
          mapping: recordHazard(current, app.state.fix!, { name: 'Bunker', kind: 'bunker' }),
        });
        app.toast('Bunker recorded');
      },
    },
    {
      label: `Par ${hole?.par ?? 4} → ${nextPar(hole?.par ?? 4)}`,
      run(app, current) {
        app.patch({
          mapping: setPar(current, nextPar(currentMappedHole(current)?.par ?? 4)),
        });
      },
    },
    {
      label: `Skip to hole ${session.currentHole + 1}`,
      run(app, current) {
        app.patch({ mapping: goToMappingHole(current, current.currentHole + 1) });
      },
    },
    {
      label: 'Save & exit mapping',
      run(app, current) {
        try {
          const course = toCourse(current);
          app.patch({
            courses: [course, ...app.state.courses.filter((entry) => entry.id !== course.id)],
            mapping: undefined,
          });
          app.toast(`Saved ${course.name} (${course.holes.length} holes)`);
        } catch (error) {
          app.toast(error instanceof Error ? error.message : 'Nothing mapped yet.', 4000);
        }
        app.replace(holeScreen());
      },
    },
  ];
}

export function mappingScreen(): Screen {
  let selected = 0;

  return {
    id: 'mapping',

    build(app) {
      const session = app.state.mapping;
      if (!session) {
        return listScreen({
          header: 'Mapping',
          items: ['Back'],
          selectedIndex: 0,
          footer: 'tap: back',
        });
      }

      const progress = mappingProgress(session);
      const items = rows(session);
      selected = Math.max(0, Math.min(items.length - 1, selected));

      const fix = app.state.fix;
      return listScreen({
        header: justify(
          `Mapping H${session.currentHole}`,
          `${progress.complete}/${progress.total} holes · ${
            fix?.accuracy !== undefined ? `GPS ${Math.round(fix.accuracy)}m` : 'no GPS'
          }`,
          CONTENT_CHARS,
        ),
        items: items.map((row) => row.label),
        selectedIndex: selected,
        footer: '▲▼ move   tap: choose   2-tap: back',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      const session = app.state.mapping;
      if (!session) {
        app.replace(holeScreen());
        return;
      }
      const items = rows(session);

      const choose = (index: number) => {
        const row = items[index];
        if (!row) return;
        if (row.needsFix && !app.state.fix) {
          app.toast('No GPS fix yet — nothing to record.');
          return;
        }
        row.run(app, session);
      };

      switch (input.type) {
        case 'scrollUp':
          selected = Math.max(0, selected - 1);
          app.patch({});
          return;
        case 'scrollDown':
          selected = Math.min(items.length - 1, selected + 1);
          app.patch({});
          return;
        case 'listSelect':
          choose(input.index);
          return;
        case 'click':
          choose(selected);
          return;
        case 'doubleClick':
          // Leaves the session in state, so mapping can be resumed from the menu.
          app.replace(holeScreen());
          return;
        case 'exit':
          app.exit();
          return;
        default:
          return;
      }
    },
  };
}
