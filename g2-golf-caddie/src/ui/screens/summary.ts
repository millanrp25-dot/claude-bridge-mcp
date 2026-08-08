/**
 * Round stats — scoring breakdown plus what the round taught the bag.
 */

import { clubStats, findClub } from '../../core/clubs.js';
import { formatDistance, UNIT_LABEL } from '../../core/geo.js';
import { completedShots, formatToPar, roundTotals } from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { CONTENT_CHARS, textScreen } from '../layout.js';
import { justify } from '../text.js';
import type { AppApi, Screen } from './types.js';

export function summaryScreen(): Screen {
  return {
    id: 'summary',

    build(app) {
      const round = app.state.round;
      if (!round) {
        return textScreen({
          header: 'Round stats',
          body: ['', '   No round in progress.'],
          footer: '2-tap: back',
        });
      }

      const totals = roundTotals(round);
      const shots = completedShots(round);
      const tagged = shots.filter((shot) => shot.club);
      const stats = clubStats(round.shots);

      // Two or three clubs is all that fits; show the ones with real data.
      const learned = [...stats.values()]
        .sort((a, b) => b.medianMeters - a.medianMeters)
        .slice(0, 3)
        .map((stat) => {
          const club = findClub(stat.clubId, app.state.bag);
          return justify(
            club?.label ?? stat.clubId,
            `${formatDistance(stat.medianMeters, round.unit)} ${UNIT_LABEL[round.unit]}  ${stat.samples}x`,
            CONTENT_CHARS,
          );
        });

      const scoring = round.scores.filter((score) => score.strokes !== null);
      const birdies = scoring.filter((score) => (score.strokes as number) < score.par).length;
      const pars = scoring.filter((score) => score.strokes === score.par).length;

      return textScreen({
        header: justify(
          round.endedAt ? 'Round complete' : 'Round in progress',
          `${totals.strokes}  ${formatToPar(totals.toPar)}`,
          CONTENT_CHARS,
        ),
        body: [
          justify('Holes played', String(totals.holesPlayed), CONTENT_CHARS),
          justify('Putts', `${totals.putts}`, CONTENT_CHARS),
          justify('Par or better', `${pars + birdies} (${birdies} under)`, CONTENT_CHARS),
          justify('Shots tracked', `${shots.length} (${tagged.length} tagged)`, CONTENT_CHARS),
          '',
          ...(learned.length > 0 ? ['Your distances:', ...learned] : ['Tag shots to learn your distances.']),
        ],
        footer: '2-tap: back',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      switch (input.type) {
        case 'click':
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
