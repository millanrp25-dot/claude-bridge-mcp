/**
 * Tag the last completed shot with the club that hit it.
 *
 * This is the loop that makes the club suggestions worth anything: mark, hit,
 * mark, tag. The list is ordered by how close each club's current distance is
 * to the shot just measured, so the right answer is usually the top row.
 */

import { clubStats, type Club } from '../../core/clubs.js';
import { formatDistance, UNIT_LABEL } from '../../core/geo.js';
import { completedShots, setShotClub, type Shot } from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { listScreen } from '../layout.js';
import type { AppApi, Screen } from './types.js';

function lastCompletedShot(app: AppApi): Shot | undefined {
  const round = app.state.round;
  if (!round) return undefined;
  return completedShots(round).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
}

/** Closest expected distance first — the club you probably just hit. */
function orderedBag(app: AppApi, shot: Shot | undefined): Club[] {
  const bag = app.state.bag.filter((club) => club.nominalMeters > 0);
  if (!shot?.distanceMeters) return bag;

  return [...bag].sort((a, b) => {
    const expected = (club: Club) =>
      app.state.stats.get(club.id)?.medianMeters ?? club.nominalMeters;
    return (
      Math.abs(expected(a) - (shot.distanceMeters as number)) -
      Math.abs(expected(b) - (shot.distanceMeters as number))
    );
  });
}

export function clubTagScreen(): Screen {
  let selected = 0;

  return {
    id: 'clubTag',

    build(app) {
      const round = app.state.round;
      const shot = lastCompletedShot(app);
      const bag = orderedBag(app, shot);
      selected = Math.max(0, Math.min(bag.length - 1, selected));

      const unit = round?.unit ?? 'yards';
      const header = shot?.distanceMeters
        ? `Tag shot · ${formatDistance(shot.distanceMeters, unit)} ${UNIT_LABEL[unit]}`
        : 'Tag shot · no completed shot yet';

      return listScreen({
        header,
        items: bag.map((club) => {
          const stat = app.state.stats.get(club.id);
          const expected = stat?.medianMeters ?? club.nominalMeters;
          const suffix = stat ? `${stat.samples}x` : 'est';
          return `${club.label}  ${formatDistance(expected, unit)} ${suffix}`;
        }),
        selectedIndex: selected,
        footer: '▲▼ move   tap: tag   2-tap: back',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      const round = app.state.round;
      const shot = lastCompletedShot(app);
      const bag = orderedBag(app, shot);

      const tag = (index: number) => {
        const club = bag[index];
        if (!round || !shot || !club) {
          app.pop();
          return;
        }
        const next = setShotClub(round, shot.id, club.id);
        app.setRound(next);
        // Recompute immediately so the very next hole benefits from the tag.
        app.patch({ stats: clubStats(next.shots) });
        app.toast(`${club.label} tagged`);
        app.pop();
      };

      switch (input.type) {
        case 'scrollUp':
          selected = Math.max(0, selected - 1);
          app.patch({});
          return;
        case 'scrollDown':
          selected = Math.min(bag.length - 1, selected + 1);
          app.patch({});
          return;
        case 'listSelect':
          tag(input.index);
          return;
        case 'click':
          tag(selected);
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
