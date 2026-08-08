/**
 * Course picker and round start.
 *
 * Also where units get toggled, because that is a once-a-lifetime setting and
 * does not deserve a screen of its own.
 */

import { availableTeeNames, coursePar, type Course } from '../../core/course.js';
import { startRound } from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { listScreen } from '../layout.js';
import { holeScreen } from './hole.js';
import type { AppApi, Screen } from './types.js';

interface Entry {
  label: string;
  run(app: AppApi): void;
}

function courseEntry(course: Course): Entry {
  return {
    label: `${course.name} · ${course.holes.length} holes · par ${coursePar(course)}`,
    run(app) {
      const teeName =
        app.state.settings.teeName && availableTeeNames(course).includes(app.state.settings.teeName)
          ? app.state.settings.teeName
          : (availableTeeNames(course)[0] ?? course.holes[0]?.tees[0]?.name ?? 'Default');

      const round = startRound({
        course,
        teeName,
        unit: app.state.settings.unit,
        now: app.now,
      });

      app.patch({ course, round });
      app.setRound(round);
      app.replace(holeScreen());
      app.toast(`${course.name} — ${teeName} tees`);
    },
  };
}

function entries(app: AppApi): Entry[] {
  const list: Entry[] = [];

  const { round, course, settings } = app.state;
  if (round && course && !round.endedAt) {
    list.push({
      label: `Resume ${round.courseName} · hole ${round.currentHole}`,
      run: (api) => api.replace(holeScreen()),
    });
  }

  list.push(...app.state.courses.map(courseEntry));

  list.push({
    label: `Units: ${settings.unit === 'yards' ? 'yards' : 'metres'} (tap to switch)`,
    run: (api) => {
      const unit = api.state.settings.unit === 'yards' ? 'meters' : 'yards';
      api.patch({
        settings: { ...api.state.settings, unit },
        // An in-flight round keeps its own unit copy, so update that too.
        ...(api.state.round ? { round: { ...api.state.round, unit } } : {}),
      });
    },
  });

  return list;
}

export function setupScreen(): Screen {
  let selected = 0;

  return {
    id: 'setup',

    build(app) {
      const list = entries(app);
      selected = Math.max(0, Math.min(list.length - 1, selected));

      return listScreen({
        header:
          app.state.courses.length > 0
            ? 'Choose a course'
            : 'No courses yet — map one from the menu',
        items: list.map((entry) => entry.label),
        selectedIndex: selected,
        footer: '▲▼ move   tap: choose',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      const list = entries(app);

      switch (input.type) {
        case 'scrollUp':
          selected = Math.max(0, selected - 1);
          app.patch({});
          return;
        case 'scrollDown':
          selected = Math.min(list.length - 1, selected + 1);
          app.patch({});
          return;
        case 'listSelect':
          list[input.index]?.run(app);
          return;
        case 'click':
          list[selected]?.run(app);
          return;
        case 'doubleClick':
          // Only leave if there is something to go back to.
          if (app.state.round) app.replace(holeScreen());
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
