/**
 * Round state.
 *
 * Every mutator is pure and returns a new `Round`. That keeps the reducer
 * testable without a device, and makes "persist after every change" a single
 * call site rather than a scattering of side effects.
 */

import type { Course } from './course.js';
import { distanceMeters, type DistanceUnit, type LatLng } from './geo.js';

export interface Shot {
  id: string;
  holeNumber: number;
  from: LatLng;
  to?: LatLng;
  club?: string;
  startedAt: number;
  endedAt?: number;
  /** Filled in when the shot is closed out. */
  distanceMeters?: number;
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  /** Total strokes including putts and penalties. `null` = not yet entered. */
  strokes: number | null;
  putts: number;
  penalties: number;
  fairwayHit?: boolean;
}

export interface Round {
  id: string;
  courseId: string;
  courseName: string;
  teeName: string;
  unit: DistanceUnit;
  startedAt: number;
  endedAt?: number;
  currentHole: number;
  scores: HoleScore[];
  shots: Shot[];
}

export interface StartRoundOptions {
  course: Course;
  teeName: string;
  unit: DistanceUnit;
  now: number;
  /** Injected so tests and replays stay deterministic. */
  idFactory?: () => string;
}

let idCounter = 0;

/** Monotonic, collision-free within a session; not meant to be global. */
export function defaultIdFactory(): string {
  idCounter += 1;
  return `s${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function startRound({
  course,
  teeName,
  unit,
  now,
}: StartRoundOptions): Round {
  return {
    id: `r${now.toString(36)}`,
    courseId: course.id,
    courseName: course.name,
    teeName,
    unit,
    startedAt: now,
    currentHole: course.holes[0]?.number ?? 1,
    scores: course.holes.map((hole) => ({
      holeNumber: hole.number,
      par: hole.par,
      strokes: null,
      putts: 0,
      penalties: 0,
    })),
    shots: [],
  };
}

export function holeScore(round: Round, holeNumber: number): HoleScore | undefined {
  return round.scores.find((score) => score.holeNumber === holeNumber);
}

function replaceScore(round: Round, next: HoleScore): Round {
  return {
    ...round,
    scores: round.scores.map((score) =>
      score.holeNumber === next.holeNumber ? next : score,
    ),
  };
}

function updateScore(
  round: Round,
  holeNumber: number,
  update: (score: HoleScore) => HoleScore,
): Round {
  const current = holeScore(round, holeNumber);
  if (!current) return round;
  return replaceScore(round, update(current));
}

/** Strokes clamp at 1 — golf has no zero-stroke holes, and 20 is plenty. */
export function setStrokes(round: Round, holeNumber: number, strokes: number): Round {
  return updateScore(round, holeNumber, (score) => ({
    ...score,
    strokes: Math.max(1, Math.min(20, Math.round(strokes))),
  }));
}

export function adjustStrokes(round: Round, holeNumber: number, delta: number): Round {
  const current = holeScore(round, holeNumber);
  if (!current) return round;
  const base = current.strokes ?? current.par;
  return setStrokes(round, holeNumber, base + delta);
}

export function setPutts(round: Round, holeNumber: number, putts: number): Round {
  return updateScore(round, holeNumber, (score) => ({
    ...score,
    putts: Math.max(0, Math.min(10, Math.round(putts))),
  }));
}

export function adjustPutts(round: Round, holeNumber: number, delta: number): Round {
  const current = holeScore(round, holeNumber);
  if (!current) return round;
  return setPutts(round, holeNumber, current.putts + delta);
}

export function addPenalty(round: Round, holeNumber: number, count = 1): Round {
  return updateScore(round, holeNumber, (score) => ({
    ...score,
    penalties: Math.max(0, score.penalties + count),
    strokes: score.strokes === null ? null : Math.min(20, score.strokes + count),
  }));
}

/** Hole navigation stops at the ends rather than wrapping — wrapping from 18 back to 1 mid-round is never what the player meant. */
export function stepHole(round: Round, course: Course, delta: number): Round {
  const numbers = course.holes.map((hole) => hole.number);
  const index = numbers.indexOf(round.currentHole);
  if (index === -1) return round;
  const nextIndex = Math.max(0, Math.min(numbers.length - 1, index + delta));
  const next = numbers[nextIndex];
  return next === undefined ? round : { ...round, currentHole: next };
}

/** Shot currently in flight on a hole, if the player has marked a ball. */
export function openShot(round: Round, holeNumber: number): Shot | undefined {
  return [...round.shots]
    .reverse()
    .find((shot) => shot.holeNumber === holeNumber && shot.to === undefined);
}

/**
 * Mark the ball.
 *
 * One button does the whole job: if a shot is open it is closed out at this
 * position (giving its measured length), and a new one starts from here. That
 * matches how a player actually uses it — press at the ball, hit, walk, press
 * again — without a separate "end shot" control to forget.
 */
export function markBall(
  round: Round,
  holeNumber: number,
  position: LatLng,
  now: number,
  idFactory: () => string = defaultIdFactory,
): Round {
  const pending = openShot(round, holeNumber);
  const shots = pending
    ? round.shots.map((shot) =>
        shot.id === pending.id
          ? {
              ...shot,
              to: position,
              endedAt: now,
              distanceMeters: distanceMeters(shot.from, position),
            }
          : shot,
      )
    : [...round.shots];

  shots.push({
    id: idFactory(),
    holeNumber,
    from: position,
    startedAt: now,
  });

  return { ...round, shots };
}

/** Attach a club to the most recent shot on the hole. */
export function setShotClub(round: Round, shotId: string, club: string): Round {
  return {
    ...round,
    shots: round.shots.map((shot) =>
      shot.id === shotId ? { ...shot, club } : shot,
    ),
  };
}

/** Drop the trailing open shot, e.g. when the player marked by accident. */
export function discardOpenShot(round: Round, holeNumber: number): Round {
  const pending = openShot(round, holeNumber);
  if (!pending) return round;
  return { ...round, shots: round.shots.filter((shot) => shot.id !== pending.id) };
}

export function completedShots(round: Round): Shot[] {
  return round.shots.filter(
    (shot): shot is Shot & { distanceMeters: number } =>
      shot.distanceMeters !== undefined,
  );
}

export interface RoundTotals {
  strokes: number;
  putts: number;
  par: number;
  toPar: number;
  holesPlayed: number;
}

/**
 * Totals over *played* holes only, so the running score reads +2 after three
 * holes rather than the -50 you would get by counting unplayed pars.
 */
export function roundTotals(round: Round): RoundTotals {
  let strokes = 0;
  let putts = 0;
  let par = 0;
  let holesPlayed = 0;

  for (const score of round.scores) {
    if (score.strokes === null) continue;
    strokes += score.strokes;
    putts += score.putts;
    par += score.par;
    holesPlayed += 1;
  }

  return { strokes, putts, par, toPar: strokes - par, holesPlayed };
}

export function formatToPar(toPar: number): string {
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : String(toPar);
}

export function finishRound(round: Round, now: number): Round {
  return { ...round, endedAt: now };
}
