/**
 * The card, nine holes at a time.
 *
 * Seven body lines is not enough for eighteen holes, so the card pages by nine
 * — which is how golfers read a card anyway.
 */

import { formatToPar, roundTotals, type HoleScore } from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { CONTENT_CHARS, textScreen } from '../layout.js';
import { columns, justify } from '../text.js';
import type { AppApi, Screen } from './types.js';

const HOLE_COLUMN = 4;

function nineLines(scores: HoleScore[]): string[] {
  const widths = [HOLE_COLUMN, ...scores.map(() => 3)];

  const cell = (score: HoleScore): string =>
    score.strokes === null ? ' -' : String(score.strokes);

  const relative = (score: HoleScore): string => {
    if (score.strokes === null) return '';
    const diff = score.strokes - score.par;
    return diff === 0 ? 'E' : diff > 0 ? `+${diff}` : String(diff);
  };

  return [
    columns(['HOLE', ...scores.map((score) => String(score.holeNumber))], widths),
    columns(['PAR', ...scores.map((score) => String(score.par))], widths),
    columns(['YOU', ...scores.map(cell)], widths),
    columns(['+/-', ...scores.map(relative)], widths),
  ];
}

function sectionTotals(scores: HoleScore[]): { strokes: number; par: number; played: number } {
  return scores.reduce(
    (totals, score) =>
      score.strokes === null
        ? totals
        : {
            strokes: totals.strokes + score.strokes,
            par: totals.par + score.par,
            played: totals.played + 1,
          },
    { strokes: 0, par: 0, played: 0 },
  );
}

export function scorecardScreen(): Screen {
  let page = 0;

  return {
    id: 'scorecard',

    build(app) {
      const round = app.state.round;
      if (!round) {
        return textScreen({
          header: 'Scorecard',
          body: ['', '   No round in progress.'],
          footer: '2-tap: back',
        });
      }

      const pages: HoleScore[][] = [];
      for (let index = 0; index < round.scores.length; index += 9) {
        pages.push(round.scores.slice(index, index + 9));
      }
      page = Math.max(0, Math.min(pages.length - 1, page));
      const scores = pages[page] ?? [];

      const section = sectionTotals(scores);
      const totals = roundTotals(round);

      return textScreen({
        header: justify(
          `${round.courseName}`,
          `${totals.strokes} · ${formatToPar(totals.toPar)}`,
          CONTENT_CHARS,
        ),
        body: [
          ...nineLines(scores),
          '',
          justify(
            `Holes ${scores[0]?.holeNumber ?? '-'}–${scores[scores.length - 1]?.holeNumber ?? '-'}`,
            section.played > 0
              ? `${section.strokes} (${formatToPar(section.strokes - section.par)})`
              : 'not played',
            CONTENT_CHARS,
          ),
        ],
        footer:
          pages.length > 1
            ? `▲▼ page ${page + 1}/${pages.length}   2-tap: back`
            : '2-tap: back',
      });
    },

    handle(input: GlassInput, app: AppApi) {
      switch (input.type) {
        case 'scrollUp':
          page = Math.max(0, page - 1);
          app.patch({});
          return;
        case 'scrollDown':
          page += 1;
          app.patch({});
          return;
        case 'doubleClick':
        case 'click':
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
