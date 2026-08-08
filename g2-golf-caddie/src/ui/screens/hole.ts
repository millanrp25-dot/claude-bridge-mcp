/**
 * The playing screen — what is on the lens for all but a few seconds a round.
 */

import { recommendClub } from '../../core/clubs.js';
import { findHole, selectTee } from '../../core/course.js';
import {
  computeHoleDistances,
  isFixUsable,
  relevantHazards,
  type HoleDistances,
} from '../../core/distances.js';
import {
  distanceMeters,
  formatDistance,
  UNIT_LABEL,
  type DistanceUnit,
} from '../../core/geo.js';
import {
  formatToPar,
  holeScore,
  markBall,
  openShot,
  roundTotals,
  stepHole,
} from '../../core/round.js';
import type { GlassInput } from '../../sdk/host.js';
import { CONTENT_CHARS, textScreen } from '../layout.js';
import { justify } from '../text.js';
import { menuScreen } from './menu.js';
import type { AppApi, AppState, Screen } from './types.js';

const HAZARD_LABEL: Record<string, string> = {
  water: 'WATER',
  bunker: 'BUNKER',
  ood: 'OB',
  layup: 'LAYUP',
  other: 'HAZARD',
};

interface HoleContext {
  distances?: HoleDistances;
  unit: DistanceUnit;
  headline: string;
}

function holeContext(state: AppState): HoleContext | undefined {
  const { course, round, fix } = state;
  if (!course || !round) return undefined;

  const hole = findHole(course, round.currentHole);
  if (!hole) return undefined;

  const tee = selectTee(hole, round.teeName);
  const totals = roundTotals(round);
  const score = holeScore(round, hole.number);

  const headline = justify(
    `H${hole.number}  PAR ${hole.par}${hole.handicap ? `  SI${hole.handicap}` : ''}`,
    `${formatToPar(totals.toPar)}${score?.strokes ? `  (${score.strokes})` : ''}`,
    CONTENT_CHARS,
  );

  const context: HoleContext = { unit: round.unit, headline };
  if (fix && tee) {
    context.distances = computeHoleDistances(fix, hole, tee.position);
  }
  return context;
}

function bodyLines(state: AppState, context: HoleContext): string[] {
  const { distances, unit } = context;
  const label = UNIT_LABEL[unit];

  if (!distances) {
    return ['', '   Waiting for GPS…', '', '   Step outside for a clear sky view.'];
  }

  const lines: string[] = [
    justify('CENTER', `${formatDistance(distances.centerMeters, unit)} ${label}`, CONTENT_CHARS),
    justify(
      `FRONT ${formatDistance(distances.frontMeters, unit)}`,
      `BACK ${formatDistance(distances.backMeters, unit)}`,
      CONTENT_CHARS,
    ),
  ];

  // Only worth a line when elevation actually moves the number.
  const playsDelta = distances.playsLikeMeters - distances.centerMeters;
  if (Math.abs(playsDelta) >= 2) {
    lines.push(
      justify(
        'PLAYS',
        `${formatDistance(distances.playsLikeMeters, unit)} ${label} ${playsDelta > 0 ? 'uphill' : 'downhill'}`,
        CONTENT_CHARS,
      ),
    );
  }

  const suggestion = recommendClub(distances.playsLikeMeters, state.stats, {
    bag: state.bag,
  });
  if (suggestion) {
    const basis =
      suggestion.basis === 'measured'
        ? `${formatDistance(suggestion.expectedMeters, unit)}`
        : `~${formatDistance(suggestion.expectedMeters, unit)}`;
    lines.push(justify('CLUB', `${suggestion.club.label}  ${basis}`, CONTENT_CHARS));
  }

  for (const hazard of relevantHazards(distances)) {
    lines.push(
      justify(
        HAZARD_LABEL[hazard.kind] ?? 'HAZARD',
        `carry ${formatDistance(hazard.carryMeters, unit)}`,
        CONTENT_CHARS,
      ),
    );
  }

  const round = state.round;
  const pending = round ? openShot(round, round.currentHole) : undefined;
  if (pending && state.fix) {
    const shotSoFar = distanceMeters(pending.from, state.fix);
    lines.push(justify('SHOT', `${formatDistance(shotSoFar, unit)} ${label}`, CONTENT_CHARS));
  }

  return lines;
}

/** Toasts are overlaid centrally by the app; this is the resting footer. */
function footer(state: AppState): string {
  const accuracy = state.fix?.accuracy;
  const gps =
    accuracy === undefined
      ? 'GPS'
      : isFixUsable(accuracy)
        ? `GPS ${Math.round(accuracy)}m`
        : `GPS WEAK ${Math.round(accuracy)}m`;

  return justify('▲▼ hole   tap: mark   2-tap: menu', gps, CONTENT_CHARS);
}

export function holeScreen(): Screen {
  return {
    id: 'hole',

    build(app) {
      const context = holeContext(app.state);
      if (!context) {
        return textScreen({
          header: 'Golf Caddie',
          body: ['', '   No round in progress.', '', '   2-tap to open the menu.'],
          footer: '2-tap: menu',
        });
      }
      return textScreen({
        header: context.headline,
        body: bodyLines(app.state, context),
        footer: footer(app.state),
      });
    },

    handle(input: GlassInput, app: AppApi) {
      const { course, round } = app.state;

      switch (input.type) {
        case 'scrollUp':
          if (course && round) app.setRound(stepHole(round, course, -1));
          return;

        case 'scrollDown':
          if (course && round) app.setRound(stepHole(round, course, 1));
          return;

        case 'click': {
          if (!round) return;
          if (!app.state.fix) {
            app.toast('No GPS fix yet — cannot mark the ball.');
            return;
          }
          const pending = openShot(round, round.currentHole);
          const next = markBall(round, round.currentHole, app.state.fix, app.now);
          app.setRound(next);

          if (pending) {
            const closed = next.shots.find((shot) => shot.id === pending.id);
            const distance = closed?.distanceMeters ?? 0;
            app.toast(
              `Shot ${formatDistance(distance, round.unit)} ${UNIT_LABEL[round.unit]} — 2-tap to tag club`,
            );
          } else {
            app.toast('Ball marked');
          }
          return;
        }

        case 'doubleClick':
          app.push(menuScreen());
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
