/**
 * Club bag and distance learning.
 *
 * The recommendation is deliberately built from *your* logged shots rather than
 * a table of tour averages. Until a club has enough samples the app falls back
 * to the bag's nominal distance and says so — a confident wrong club costs a
 * stroke, an honest "no data yet" costs nothing.
 */

import type { Shot } from './round.js';
import { yardsToMeters } from './geo.js';

export interface Club {
  id: string;
  /** Shown on the HUD; keep it short, the lens is 576 px wide. */
  label: string;
  /** Nominal carry used before the player has logged shots with it. */
  nominalMeters: number;
}

/**
 * A common men's amateur bag, ordered long to short. Distances are starting
 * points only — every one of them is replaced by measured data as you play.
 */
export const DEFAULT_BAG: Club[] = [
  { id: 'dr', label: 'Driver', nominalMeters: yardsToMeters(230) },
  { id: '3w', label: '3 Wood', nominalMeters: yardsToMeters(210) },
  { id: '5w', label: '5 Wood', nominalMeters: yardsToMeters(195) },
  { id: '4i', label: '4 Iron', nominalMeters: yardsToMeters(180) },
  { id: '5i', label: '5 Iron', nominalMeters: yardsToMeters(170) },
  { id: '6i', label: '6 Iron', nominalMeters: yardsToMeters(160) },
  { id: '7i', label: '7 Iron', nominalMeters: yardsToMeters(150) },
  { id: '8i', label: '8 Iron', nominalMeters: yardsToMeters(140) },
  { id: '9i', label: '9 Iron', nominalMeters: yardsToMeters(128) },
  { id: 'pw', label: 'PW', nominalMeters: yardsToMeters(115) },
  { id: 'gw', label: 'GW', nominalMeters: yardsToMeters(100) },
  { id: 'sw', label: 'SW', nominalMeters: yardsToMeters(85) },
  { id: 'lw', label: 'LW', nominalMeters: yardsToMeters(70) },
  { id: 'pt', label: 'Putter', nominalMeters: 0 },
];

export interface ClubStat {
  clubId: string;
  samples: number;
  /** Median rather than mean: one shanked 40 m 7-iron should not move it. */
  medianMeters: number;
  /** Spread of the middle of the distribution, as a dispersion hint. */
  iqrMeters: number;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  const lowerValue = sorted[lower] as number;
  if (lower === upper) return lowerValue;
  return lowerValue + ((sorted[upper] as number) - lowerValue) * (pos - lower);
}

export interface ClubStatsOptions {
  /** Only the most recent N shots per club count, so the bag tracks form. */
  window?: number;
  /**
   * Shots shorter than this are chips and putts, not full swings, and would
   * drag every club's median down if they were counted.
   */
  minShotMeters?: number;
}

/**
 * Per-club distances learned from completed, club-tagged shots.
 */
export function clubStats(
  shots: Shot[],
  options: ClubStatsOptions = {},
): Map<string, ClubStat> {
  const { window = 20, minShotMeters = 25 } = options;
  const byClub = new Map<string, number[]>();

  // Newest first so the window keeps recent shots.
  const ordered = [...shots].sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));

  for (const shot of ordered) {
    if (!shot.club || shot.distanceMeters === undefined) continue;
    if (shot.distanceMeters < minShotMeters) continue;
    const bucket = byClub.get(shot.club) ?? [];
    if (bucket.length >= window) continue;
    bucket.push(shot.distanceMeters);
    byClub.set(shot.club, bucket);
  }

  const stats = new Map<string, ClubStat>();
  for (const [clubId, distances] of byClub) {
    const sorted = [...distances].sort((a, b) => a - b);
    stats.set(clubId, {
      clubId,
      samples: sorted.length,
      medianMeters: median(sorted),
      iqrMeters: quantile(sorted, 0.75) - quantile(sorted, 0.25),
    });
  }
  return stats;
}

export interface ClubSuggestion {
  club: Club;
  /** Distance the app expects from this club right now. */
  expectedMeters: number;
  /** Positive = the club is longer than the shot needs. */
  deltaMeters: number;
  /** `measured` once the club has enough logged shots to stand on. */
  basis: 'measured' | 'nominal';
  samples: number;
}

export interface RecommendOptions {
  bag?: Club[];
  /** Shots needed before measured data outranks the nominal distance. */
  minSamples?: number;
}

/**
 * Best club for a target distance.
 *
 * Ties break long: coming up short is the more expensive miss on most holes,
 * since trouble tends to guard the front of a green.
 */
export function recommendClub(
  targetMeters: number,
  stats: Map<string, ClubStat>,
  options: RecommendOptions = {},
): ClubSuggestion | undefined {
  const { bag = DEFAULT_BAG, minSamples = 3 } = options;

  const candidates = bag
    .filter((club) => club.nominalMeters > 0)
    .map((club): ClubSuggestion => {
      const stat = stats.get(club.id);
      const measured = stat !== undefined && stat.samples >= minSamples;
      const expectedMeters = measured
        ? (stat as ClubStat).medianMeters
        : club.nominalMeters;
      return {
        club,
        expectedMeters,
        deltaMeters: expectedMeters - targetMeters,
        basis: measured ? 'measured' : 'nominal',
        samples: stat?.samples ?? 0,
      };
    });

  if (candidates.length === 0) return undefined;

  return candidates.reduce((best, candidate) => {
    const bestGap = Math.abs(best.deltaMeters);
    const gap = Math.abs(candidate.deltaMeters);
    if (gap < bestGap) return candidate;
    if (gap === bestGap && candidate.deltaMeters > best.deltaMeters) return candidate;
    return best;
  });
}

export function findClub(clubId: string, bag: Club[] = DEFAULT_BAG): Club | undefined {
  return bag.find((club) => club.id === clubId);
}
