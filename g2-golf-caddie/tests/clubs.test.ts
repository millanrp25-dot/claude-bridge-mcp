import { describe, expect, it } from 'vitest';

import { clubStats, DEFAULT_BAG, recommendClub } from '../src/core/clubs.js';
import { yardsToMeters } from '../src/core/geo.js';
import type { Shot } from '../src/core/round.js';

function shot(club: string, yards: number, endedAt: number): Shot {
  return {
    id: `${club}-${endedAt}`,
    holeNumber: 1,
    from: { lat: 0, lng: 0 },
    to: { lat: 0, lng: 0 },
    club,
    startedAt: endedAt - 60_000,
    endedAt,
    distanceMeters: yardsToMeters(yards),
  };
}

describe('clubStats', () => {
  it('uses the median so one bad strike does not move the number', () => {
    const shots = [
      shot('7i', 150, 1),
      shot('7i', 152, 2),
      shot('7i', 148, 3),
      shot('7i', 40, 4), // shanked, still a full-swing distance
    ];
    const stat = clubStats(shots)!.get('7i')!;
    expect(stat.samples).toBe(4);
    expect(stat.medianMeters).toBeCloseTo(yardsToMeters(149), 1);
  });

  it('ignores chips and putts that would drag the average down', () => {
    const shots = [shot('7i', 150, 1), shot('7i', 152, 2), shot('7i', 10, 3)];
    expect(clubStats(shots).get('7i')?.samples).toBe(2);
  });

  it('ignores shots with no club tagged', () => {
    const untagged: Shot = { ...shot('7i', 150, 1), club: undefined };
    expect(clubStats([untagged]).size).toBe(0);
  });

  it('keeps only the most recent shots so the bag tracks current form', () => {
    const shots = Array.from({ length: 30 }, (_, index) =>
      shot('7i', index < 10 ? 120 : 155, index + 1),
    );
    const stat = clubStats(shots, { window: 5 }).get('7i')!;
    expect(stat.samples).toBe(5);
    // The five newest are the 155-yard ones.
    expect(stat.medianMeters).toBeCloseTo(yardsToMeters(155), 3);
  });

  it('reports dispersion as an interquartile range', () => {
    const shots = [
      shot('7i', 140, 1),
      shot('7i', 150, 2),
      shot('7i', 160, 3),
      shot('7i', 170, 4),
    ];
    expect(clubStats(shots).get('7i')!.iqrMeters).toBeGreaterThan(0);
  });
});

describe('recommendClub', () => {
  it('falls back to nominal distances with no history', () => {
    const suggestion = recommendClub(yardsToMeters(150), new Map())!;
    expect(suggestion.club.id).toBe('7i');
    expect(suggestion.basis).toBe('nominal');
    expect(suggestion.samples).toBe(0);
  });

  it('prefers measured distances once there is enough data', () => {
    // This player's 7-iron actually goes 135, so 150 should call for more club.
    const shots = [shot('7i', 135, 1), shot('7i', 136, 2), shot('7i', 134, 3)];
    const stats = clubStats(shots);
    const suggestion = recommendClub(yardsToMeters(150), stats)!;

    expect(suggestion.club.id).not.toBe('7i');
    expect(suggestion.expectedMeters).toBeGreaterThan(yardsToMeters(140));
  });

  it('needs a minimum sample count before trusting measured data', () => {
    const stats = clubStats([shot('7i', 100, 1), shot('7i', 101, 2)]);
    const suggestion = recommendClub(yardsToMeters(150), stats, { minSamples: 3 })!;
    expect(suggestion.basis).toBe('nominal');
  });

  it('breaks ties toward the longer club', () => {
    const bag = [
      { id: 'short', label: 'Short', nominalMeters: 140 },
      { id: 'long', label: 'Long', nominalMeters: 160 },
    ];
    const suggestion = recommendClub(150, new Map(), { bag })!;
    expect(suggestion.club.id).toBe('long');
  });

  it('never suggests the putter', () => {
    const suggestion = recommendClub(5, new Map(), { bag: DEFAULT_BAG })!;
    expect(suggestion.club.id).not.toBe('pt');
  });

  it('returns nothing when the bag has no full-swing clubs', () => {
    expect(recommendClub(150, new Map(), { bag: [] })).toBeUndefined();
  });
});
