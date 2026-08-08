import { describe, expect, it } from 'vitest';

import {
  computeHoleDistances,
  isFixUsable,
  relevantHazards,
} from '../src/core/distances.js';
import { destinationPoint } from '../src/core/geo.js';
import { TEE_1, testCourse } from './fixtures.js';

const course = testCourse();
const hole = course.holes[0]!;

describe('computeHoleDistances', () => {
  it('reports front, centre and back from the tee', () => {
    const distances = computeHoleDistances(TEE_1, hole, TEE_1);
    expect(distances.frontMeters).toBeCloseTo(345, 0);
    expect(distances.centerMeters).toBeCloseTo(360, 0);
    expect(distances.backMeters).toBeCloseTo(375, 0);
  });

  it('exposes green depth so a back pin can be clubbed for', () => {
    const distances = computeHoleDistances(TEE_1, hole, TEE_1);
    expect(distances.greenDepthMeters).toBeCloseTo(30, 0);
  });

  it('adds the uphill elevation to the plays-like number', () => {
    const distances = computeHoleDistances(TEE_1, hole, TEE_1);
    // Tee is at 0 m, green at 6 m.
    expect(distances.playsLikeMeters - distances.centerMeters).toBeCloseTo(6, 1);
  });

  it('leaves plays-like alone when elevation data is missing', () => {
    const flat = course.holes[1]!;
    const teeTwo = flat.tees[0]!.position;
    const distances = computeHoleDistances(teeTwo, flat, teeTwo);
    expect(distances.playsLikeMeters).toBeCloseTo(distances.centerMeters, 6);
  });

  it('tracks how far the player has walked from the tee', () => {
    const position = destinationPoint(TEE_1, 90, 120);
    const distances = computeHoleDistances(position, hole, TEE_1);
    expect(distances.fromTeeMeters).toBeCloseTo(120, 0);
  });
});

describe('hazards', () => {
  it('quotes the carry from where the player stands, not from the tee', () => {
    const position = destinationPoint(TEE_1, 90, 120);
    const distances = computeHoleDistances(position, hole, TEE_1);
    const creek = distances.hazards.find((hazard) => hazard.name === 'Creek')!;
    expect(creek.carryMeters).toBeCloseTo(80, 0);
    expect(creek.farMeters).toBeCloseTo(95, 0);
  });

  it('marks a hazard behind the player as no longer ahead', () => {
    const past = destinationPoint(TEE_1, 90, 260);
    const distances = computeHoleDistances(past, hole, TEE_1);
    const creek = distances.hazards.find((hazard) => hazard.name === 'Creek')!;
    expect(creek.ahead).toBe(false);
    expect(relevantHazards(distances)).toHaveLength(0);
  });

  it('reports how far offline a hazard sits', () => {
    const distances = computeHoleDistances(TEE_1, hole, TEE_1);
    const creek = distances.hazards.find((hazard) => hazard.name === 'Creek')!;
    const wide = distances.hazards.find((hazard) => hazard.name === 'Way left bunker')!;
    expect(Math.abs(creek.offlineMeters)).toBeLessThan(1);
    expect(Math.abs(wide.offlineMeters)).toBeCloseTo(60, 0);
  });

  it('hides hazards too far offline to matter', () => {
    const distances = computeHoleDistances(TEE_1, hole, TEE_1);
    const shown = relevantHazards(distances);
    expect(shown.map((hazard) => hazard.name)).toEqual(['Creek']);
  });

  it('caps how many hazards reach the display', () => {
    const distances = computeHoleDistances(TEE_1, hole, TEE_1);
    const crowded = {
      ...distances,
      hazards: distances.hazards.map((hazard) => ({ ...hazard, offlineMeters: 0, ahead: true })),
    };
    expect(relevantHazards(crowded, 40, 1)).toHaveLength(1);
  });
});

describe('isFixUsable', () => {
  it('accepts a typical phone fix and rejects a poor one', () => {
    expect(isFixUsable(4)).toBe(true);
    expect(isFixUsable(15)).toBe(true);
    expect(isFixUsable(40)).toBe(false);
  });

  it('treats an unreported accuracy as usable', () => {
    expect(isFixUsable(undefined)).toBe(true);
  });
});
