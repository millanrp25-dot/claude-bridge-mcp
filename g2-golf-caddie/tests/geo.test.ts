import { describe, expect, it } from 'vitest';

import {
  bearingDegrees,
  crossTrackMeters,
  destinationPoint,
  distanceMeters,
  formatDistance,
  metersToYards,
  playsLikeMeters,
  yardsToMeters,
} from '../src/core/geo.js';

const TEE = { lat: 44.2815, lng: -121.3182 };

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters(TEE, TEE)).toBe(0);
  });

  it('round-trips against destinationPoint', () => {
    const target = destinationPoint(TEE, 42, 350);
    expect(distanceMeters(TEE, target)).toBeCloseTo(350, 3);
  });

  it('is symmetric', () => {
    const other = destinationPoint(TEE, 210, 180);
    expect(distanceMeters(TEE, other)).toBeCloseTo(distanceMeters(other, TEE), 6);
  });

  it('matches a known long-haul distance', () => {
    // JFK → LHR great circle, ~5540 km.
    const jfk = { lat: 40.6413, lng: -73.7781 };
    const lhr = { lat: 51.47, lng: -0.4543 };
    expect(distanceMeters(jfk, lhr) / 1000).toBeCloseTo(5540, 0);
  });
});

describe('bearingDegrees', () => {
  it('reports due north as 0 and due east as 90', () => {
    expect(bearingDegrees(TEE, destinationPoint(TEE, 0, 100))).toBeCloseTo(0, 3);
    expect(bearingDegrees(TEE, destinationPoint(TEE, 90, 100))).toBeCloseTo(90, 3);
  });

  it('normalises into [0, 360)', () => {
    const bearing = bearingDegrees(TEE, destinationPoint(TEE, 350, 100));
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
    expect(bearing).toBeCloseTo(350, 3);
  });
});

describe('crossTrackMeters', () => {
  const green = destinationPoint(TEE, 90, 400);

  it('is zero offline for a point on the line', () => {
    const onLine = destinationPoint(TEE, 90, 200);
    expect(Math.abs(crossTrackMeters(onLine, TEE, green))).toBeLessThan(0.01);
  });

  it('is positive to the right of the line', () => {
    const midpoint = destinationPoint(TEE, 90, 200);
    const right = destinationPoint(midpoint, 180, 25);
    expect(crossTrackMeters(right, TEE, green)).toBeGreaterThan(20);
  });

  it('is negative to the left of the line', () => {
    const midpoint = destinationPoint(TEE, 90, 200);
    const left = destinationPoint(midpoint, 0, 25);
    expect(crossTrackMeters(left, TEE, green)).toBeLessThan(-20);
  });
});

describe('units', () => {
  it('converts yards and metres consistently', () => {
    expect(metersToYards(yardsToMeters(150))).toBeCloseTo(150, 9);
    expect(yardsToMeters(100)).toBeCloseTo(91.44, 9);
  });

  it('formats whole numbers only', () => {
    expect(formatDistance(137.4, 'meters')).toBe('137');
    expect(formatDistance(yardsToMeters(152.6), 'yards')).toBe('153');
  });
});

describe('playsLikeMeters', () => {
  it('adds uphill and subtracts downhill', () => {
    expect(playsLikeMeters(150, 5)).toBe(155);
    expect(playsLikeMeters(150, -5)).toBe(145);
  });

  it('scales by the factor and never goes negative', () => {
    expect(playsLikeMeters(150, 10, 0.5)).toBe(155);
    expect(playsLikeMeters(10, -50)).toBe(0);
  });
});
