/**
 * The yardage engine: turns a GPS fix plus a hole definition into the numbers a
 * player actually wants on the lens.
 */

import type { Hazard, Hole } from './course.js';
import {
  crossTrackMeters,
  distanceMeters,
  elevationDelta,
  playsLikeMeters,
  type LatLng,
} from './geo.js';

export interface HazardDistance {
  name: string;
  kind: Hazard['kind'];
  /** Distance to the near edge — what you have to carry. */
  carryMeters: number;
  /** Distance to the far edge, when mapped. */
  farMeters?: number;
  /** How far off the tee→green line the hazard sits. Negative = left. */
  offlineMeters: number;
  /** True when the hazard is still ahead of the player. */
  ahead: boolean;
}

export interface HoleDistances {
  frontMeters: number;
  centerMeters: number;
  backMeters: number;
  /** Centre distance adjusted for elevation, when the course file has heights. */
  playsLikeMeters: number;
  /** Green depth front-to-back — how much club a back pin is really worth. */
  greenDepthMeters: number;
  hazards: HazardDistance[];
  /** Metres already covered from the tee, for shot-length bookkeeping. */
  fromTeeMeters: number;
}

export interface DistanceOptions {
  /** 1:1 by default; see `playsLikeMeters`. */
  elevationFactor?: number;
  /**
   * A hazard within this distance of the player counts as behind them, so a
   * bunker you have just walked past stops shouting for attention.
   */
  aheadToleranceMeters?: number;
}

/**
 * Hazards are reported relative to the tee→green centre line rather than the
 * player's heading: heading from consumer GPS is noisy when walking slowly, and
 * a hazard's relevance is a property of the hole, not of which way you turned.
 */
function hazardDistance(
  position: LatLng,
  teePosition: LatLng,
  greenCenter: LatLng,
  hazard: Hazard,
  aheadTolerance: number,
): HazardDistance {
  const carryMeters = distanceMeters(position, hazard.carry);
  const playerToGreen = distanceMeters(position, greenCenter);
  const hazardToGreen = distanceMeters(hazard.carry, greenCenter);

  const result: HazardDistance = {
    name: hazard.name,
    kind: hazard.kind,
    carryMeters,
    offlineMeters: crossTrackMeters(hazard.carry, teePosition, greenCenter),
    // Still ahead while the hazard remains further from the green than we are
    // not — i.e. we have not yet passed it on the way in.
    ahead: hazardToGreen < playerToGreen - aheadTolerance,
  };

  if (hazard.far) result.farMeters = distanceMeters(position, hazard.far);
  return result;
}

export function computeHoleDistances(
  position: LatLng,
  hole: Hole,
  teePosition: LatLng,
  options: DistanceOptions = {},
): HoleDistances {
  const { elevationFactor = 1, aheadToleranceMeters = 5 } = options;
  const { green } = hole;

  const centerMeters = distanceMeters(position, green.center);

  const hazards = (hole.hazards ?? []).map((hazard) =>
    hazardDistance(position, teePosition, green.center, hazard, aheadToleranceMeters),
  );

  return {
    frontMeters: distanceMeters(position, green.front),
    centerMeters,
    backMeters: distanceMeters(position, green.back),
    playsLikeMeters: playsLikeMeters(
      centerMeters,
      elevationDelta(position, green.center),
      elevationFactor,
    ),
    greenDepthMeters: distanceMeters(green.front, green.back),
    hazards,
    fromTeeMeters: distanceMeters(teePosition, position),
  };
}

/**
 * Hazards worth showing, nearest first.
 *
 * Only what is still ahead and roughly in play: a bunker 60 m offline is
 * somebody else's problem, and screen space on a 576×288 HUD is the scarcest
 * resource in the whole app.
 */
export function relevantHazards(
  distances: HoleDistances,
  maxOfflineMeters = 40,
  limit = 2,
): HazardDistance[] {
  return distances.hazards
    .filter(
      (hazard) =>
        hazard.ahead && Math.abs(hazard.offlineMeters) <= maxOfflineMeters,
    )
    .sort((a, b) => a.carryMeters - b.carryMeters)
    .slice(0, limit);
}

/**
 * Whether a GPS fix is trustworthy enough to quote a yardage from.
 *
 * Anything worse than ~15 m of reported accuracy is a fix that could move the
 * number by two clubs, so the UI marks it rather than pretending.
 */
export function isFixUsable(accuracyMeters: number | undefined): boolean {
  return accuracyMeters === undefined || accuracyMeters <= 15;
}
