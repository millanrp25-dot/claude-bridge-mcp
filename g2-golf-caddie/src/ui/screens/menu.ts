/**
 * Action menu, reached with a double-tap from the playing screen.
 */

import { discardOpenShot, finishRound, openShot } from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { listScreen } from '../layout.js';
import { clubTagScreen } from './clubTag.js';
import { openMapping } from './mapping.js';
import { scoreScreen } from './score.js';
import { scorecardScreen } from './scorecard.js';
import { setupScreen } from './setup.js';
import { summaryScreen } from './summary.js';
import type { AppApi, Screen } from './types.js';

interface MenuEntry {
  label: string;
  run(app: AppApi): void;
  /** Hidden when there is nothing for the entry to act on. */
  available?(app: AppApi): boolean;
}

const ENTRIES: MenuEntry[] = [
  {
    label: 'Enter score',
    run: (app) => app.replace(scoreScreen()),
    available: (app) => Boolean(app.state.round),
  },
  {
    label: 'Tag last shot',
    run: (app) => app.replace(clubTagScreen()),
    available: (app) => Boolean(app.state.round?.shots.length),
  },
  {
    label: 'Undo last mark',
    run: (app) => {
      const { round } = app.state;
      if (!round) return;
      app.setRound(discardOpenShot(round, round.currentHole));
      app.toast('Mark discarded');
      app.pop();
    },
    available: (app) => {
      const { round } = app.state;
      return Boolean(round && openShot(round, round.currentHole));
    },
  },
  {
    label: 'Scorecard',
    run: (app) => app.replace(scorecardScreen()),
    available: (app) => Boolean(app.state.round),
  },
  {
    label: 'Round stats',
    run: (app) => app.replace(summaryScreen()),
    available: (app) => Boolean(app.state.round),
  },
  {
    label: 'Map this course',
    run: (app) => openMapping(app),
  },
  {
    label: 'New round',
    run: (app) => app.replace(setupScreen()),
  },
  {
    label: 'Finish round',
    run: (app) => {
      const { round } = app.state;
      if (!round) return;
      app.setRound(finishRound(round, app.now));
      app.replace(summaryScreen());
    },
    available: (app) => Boolean(app.state.round && !app.state.round.endedAt),
  },
  {
    label: 'Close app',
    run: (app) => app.exit(),
  },
];

export function menuScreen(): Screen {
  let selected = 0;

  const visible = (app: AppApi): MenuEntry[] =>
    ENTRIES.filter((entry) => entry.available?.(app) ?? true);

  return {
    id: 'menu',

    build(app) {
      const entries = visible(app);
      selected = Math.max(0, Math.min(entries.length - 1, selected));
      return listScreen({
        header: 'Menu',
        items: entries.map((entry) => entry.label),
        selectedIndex: selected,
        footer: '▲▼ move   tap: choose   2-tap: back',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      const entries = visible(app);

      switch (input.type) {
        case 'scrollUp':
          selected = Math.max(0, selected - 1);
          app.patch({});
          return;

        case 'scrollDown':
          selected = Math.min(entries.length - 1, selected + 1);
          app.patch({});
          return;

        case 'listSelect':
          // The device reports which row was chosen, so trust it over our own
          // shadow index — the two can drift if a scroll event is dropped.
          entries[input.index]?.run(app);
          return;

        case 'click':
          entries[selected]?.run(app);
          return;

        case 'doubleClick':
          app.pop();
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
