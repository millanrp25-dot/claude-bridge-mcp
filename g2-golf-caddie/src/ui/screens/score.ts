/**
 * Score entry for the current hole.
 *
 * One field at a time, adjusted with the same two scroll gestures used
 * everywhere else — there is no keyboard on a pair of glasses, and asking the
 * player to fish out a phone on the green defeats the point.
 */

import { findHole } from '../../core/course.js';
import {
  adjustPutts,
  adjustStrokes,
  formatToPar,
  holeScore,
  roundTotals,
  setStrokes,
  stepHole,
} from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { CONTENT_CHARS, textScreen } from '../layout.js';
import { justify } from '../text.js';
import type { AppApi, Screen } from './types.js';

type Field = 'strokes' | 'putts';

export function scoreScreen(): Screen {
  let field: Field = 'strokes';

  return {
    id: 'score',

    build(app) {
      const { course, round } = app.state;
      if (!course || !round) {
        return textScreen({
          header: 'Score',
          body: ['', '   No round in progress.'],
          footer: '2-tap: back',
        });
      }

      const hole = findHole(course, round.currentHole);
      const score = holeScore(round, round.currentHole);
      const totals = roundTotals(round);
      const strokes = score?.strokes;
      const marker = (name: Field) => (field === name ? '▶' : ' ');

      return textScreen({
        header: justify(
          `Score  H${round.currentHole}  PAR ${hole?.par ?? '-'}`,
          formatToPar(totals.toPar),
          CONTENT_CHARS,
        ),
        body: [
          '',
          justify(
            `${marker('strokes')} STROKES`,
            strokes === null || strokes === undefined ? 'set' : String(strokes),
            CONTENT_CHARS,
          ),
          justify(`${marker('putts')} PUTTS`, String(score?.putts ?? 0), CONTENT_CHARS),
          '',
          justify(
            'Round',
            `${totals.strokes} strokes · ${totals.putts} putts · ${totals.holesPlayed} holes`,
            CONTENT_CHARS,
          ),
        ],
        footer: '▲▼ adjust   tap: next field   2-tap: save & back',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      const { course, round } = app.state;
      if (!round || !course) {
        if (input.type === 'doubleClick') app.pop();
        return;
      }

      const hole = round.currentHole;

      switch (input.type) {
        case 'scrollUp':
          app.setRound(
            field === 'strokes' ? adjustStrokes(round, hole, 1) : adjustPutts(round, hole, 1),
          );
          return;

        case 'scrollDown':
          app.setRound(
            field === 'strokes' ? adjustStrokes(round, hole, -1) : adjustPutts(round, hole, -1),
          );
          return;

        case 'click':
        case 'listSelect':
          field = field === 'strokes' ? 'putts' : 'strokes';
          app.patch({});
          return;

        case 'doubleClick': {
          // Saving an untouched hole would leave it blank forever; default it to
          // par so the card stays complete as the player walks off the green.
          const score = holeScore(round, hole);
          const saved =
            score && score.strokes === null ? setStrokes(round, hole, score.par) : round;
          app.setRound(stepHole(saved, course, 1));
          app.pop();
          return;
        }

        case 'exit':
          app.exit();
          return;

        default:
          return;
      }
    },
  };
}
