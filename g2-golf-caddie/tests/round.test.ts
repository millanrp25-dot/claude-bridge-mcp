import { describe, expect, it } from 'vitest';

import { destinationPoint } from '../src/core/geo.js';
import {
  addPenalty,
  adjustPutts,
  adjustStrokes,
  completedShots,
  discardOpenShot,
  formatToPar,
  holeScore,
  markBall,
  openShot,
  roundTotals,
  setPutts,
  setStrokes,
  startRound,
  stepHole,
} from '../src/core/round.js';
import { TEE_1, testCourse } from './fixtures.js';

const course = testCourse();

function newRound() {
  let counter = 0;
  const round = startRound({ course, teeName: 'Blue', unit: 'yards', now: 1_000 });
  return { round, nextId: () => `shot-${(counter += 1)}` };
}

describe('scoring', () => {
  it('starts with an empty card for every hole', () => {
    const { round } = newRound();
    expect(round.scores).toHaveLength(2);
    expect(round.scores.every((score) => score.strokes === null)).toBe(true);
    expect(roundTotals(round).holesPlayed).toBe(0);
  });

  it('counts only played holes toward the running score', () => {
    const { round } = newRound();
    const played = setStrokes(round, 1, 6);
    const totals = roundTotals(played);

    expect(totals.strokes).toBe(6);
    expect(totals.par).toBe(4);
    expect(totals.toPar).toBe(2);
    expect(totals.holesPlayed).toBe(1);
  });

  it('defaults an adjustment to par when nothing is entered yet', () => {
    const { round } = newRound();
    expect(holeScore(adjustStrokes(round, 1, 1), 1)?.strokes).toBe(5);
  });

  it('clamps strokes and putts to sane bounds', () => {
    const { round } = newRound();
    expect(holeScore(setStrokes(round, 1, -3), 1)?.strokes).toBe(1);
    expect(holeScore(setStrokes(round, 1, 99), 1)?.strokes).toBe(20);
    expect(holeScore(setPutts(round, 1, -1), 1)?.putts).toBe(0);
    expect(holeScore(adjustPutts(setPutts(round, 1, 2), 1, 1), 1)?.putts).toBe(3);
  });

  it('adds a penalty to the stroke count once a score exists', () => {
    const { round } = newRound();
    const penalised = addPenalty(setStrokes(round, 1, 4), 1);
    expect(holeScore(penalised, 1)?.strokes).toBe(5);
    expect(holeScore(penalised, 1)?.penalties).toBe(1);
  });

  it('formats to-par the way a scoreboard does', () => {
    expect(formatToPar(0)).toBe('E');
    expect(formatToPar(3)).toBe('+3');
    expect(formatToPar(-2)).toBe('-2');
  });
});

describe('hole navigation', () => {
  it('moves forward and back', () => {
    const { round } = newRound();
    expect(stepHole(round, course, 1).currentHole).toBe(2);
    expect(stepHole(stepHole(round, course, 1), course, -1).currentHole).toBe(1);
  });

  it('stops at the ends instead of wrapping', () => {
    const { round } = newRound();
    expect(stepHole(round, course, -1).currentHole).toBe(1);
    expect(stepHole(round, course, 5).currentHole).toBe(2);
  });
});

describe('shot tracking', () => {
  it('opens a shot on the first mark', () => {
    const { round, nextId } = newRound();
    const marked = markBall(round, 1, TEE_1, 2_000, nextId);

    expect(marked.shots).toHaveLength(1);
    expect(openShot(marked, 1)?.from).toEqual(TEE_1);
    expect(completedShots(marked)).toHaveLength(0);
  });

  it('closes the open shot and starts the next one on the second mark', () => {
    const { round, nextId } = newRound();
    const ball = destinationPoint(TEE_1, 90, 210);

    const first = markBall(round, 1, TEE_1, 2_000, nextId);
    const second = markBall(first, 1, ball, 3_000, nextId);

    expect(second.shots).toHaveLength(2);
    const [closed] = completedShots(second);
    expect(closed?.distanceMeters).toBeCloseTo(210, 0);
    expect(closed?.endedAt).toBe(3_000);
    expect(openShot(second, 1)?.from).toEqual(ball);
  });

  it('keeps shots on separate holes independent', () => {
    const { round, nextId } = newRound();
    const onOne = markBall(round, 1, TEE_1, 2_000, nextId);
    const onTwo = markBall(onOne, 2, destinationPoint(TEE_1, 180, 100), 4_000, nextId);

    expect(openShot(onTwo, 1)?.holeNumber).toBe(1);
    expect(openShot(onTwo, 2)?.holeNumber).toBe(2);
  });

  it('discards a mispressed mark', () => {
    const { round, nextId } = newRound();
    const marked = markBall(round, 1, TEE_1, 2_000, nextId);
    expect(discardOpenShot(marked, 1).shots).toHaveLength(0);
  });
});
