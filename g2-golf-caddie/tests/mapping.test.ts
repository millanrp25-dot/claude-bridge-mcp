import { describe, expect, it } from 'vitest';

import { validateCourse } from '../src/core/course.js';
import { destinationPoint } from '../src/core/geo.js';
import {
  currentMappedHole,
  goToMappingHole,
  isHoleComplete,
  mappingProgress,
  recordHazard,
  recordPoint,
  setPar,
  startMapping,
  toCourse,
} from '../src/core/mapping.js';
import { nextPar } from '../src/ui/screens/mapping.js';
import { TEE_1 } from './fixtures.js';

function newSession(holeCount = 2) {
  return startMapping({ courseName: 'Home Course', holeCount, now: 1_000 });
}

/** Walk the four landmarks of one hole. */
function mapHole(session: ReturnType<typeof newSession>, teeOffsetM: number) {
  const tee = destinationPoint(TEE_1, 0, teeOffsetM);
  let next = recordPoint(session, tee);
  next = recordPoint(next, destinationPoint(tee, 90, 330));
  next = recordPoint(next, destinationPoint(tee, 90, 345));
  return recordPoint(next, destinationPoint(tee, 90, 360));
}

describe('mapping session', () => {
  it('walks tee → front → centre → back, then moves to the next hole', () => {
    let session = newSession();
    expect(session.step).toBe('tee');

    session = recordPoint(session, TEE_1);
    expect(session.step).toBe('front');

    session = recordPoint(session, TEE_1);
    expect(session.step).toBe('center');

    session = recordPoint(session, TEE_1);
    expect(session.step).toBe('back');

    session = recordPoint(session, TEE_1);
    expect(session.currentHole).toBe(2);
    expect(session.step).toBe('tee');
  });

  it('stops advancing past the last hole', () => {
    let session = newSession(1);
    for (let index = 0; index < 8; index += 1) session = recordPoint(session, TEE_1);
    expect(session.currentHole).toBe(1);
  });

  it('tracks progress across holes', () => {
    let session = newSession();
    expect(mappingProgress(session)).toEqual({ complete: 0, total: 2 });

    session = mapHole(session, 0);
    expect(mappingProgress(session)).toEqual({ complete: 1, total: 2 });
  });

  it('clamps par to a legal range', () => {
    const session = newSession();
    expect(currentMappedHole(setPar(session, 9))?.par).toBe(6);
    expect(currentMappedHole(setPar(session, 1))?.par).toBe(3);
  });

  it('records hazards against the current hole', () => {
    const session = recordHazard(newSession(), TEE_1, { name: 'Creek', kind: 'water' });
    expect(currentMappedHole(session)?.hazards).toHaveLength(1);
  });

  it('jumps to another hole and restarts at its tee', () => {
    const session = goToMappingHole(recordPoint(newSession(), TEE_1), 2);
    expect(session.currentHole).toBe(2);
    expect(session.step).toBe('tee');
  });

  it('ignores a jump to a hole that does not exist', () => {
    const session = newSession(2);
    expect(goToMappingHole(session, 9).currentHole).toBe(1);
  });

  it('cycles par 3 → 4 → 5 → 6 → 3', () => {
    expect([3, 4, 5, 6].map(nextPar)).toEqual([4, 5, 6, 3]);
  });
});

describe('toCourse', () => {
  it('produces a course file that passes the same validation as a hand-authored one', () => {
    let session = newSession();
    session = mapHole(session, 0);
    session = mapHole(session, 400);

    const course = toCourse(session);
    expect(validateCourse(course)).toEqual([]);
    expect(course.holes).toHaveLength(2);
  });

  it('drops half-mapped holes rather than guessing their greens', () => {
    let session = newSession();
    session = mapHole(session, 0);
    // Hole 2 gets only a tee.
    session = recordPoint(session, destinationPoint(TEE_1, 0, 400));

    const course = toCourse(session);
    expect(course.holes).toHaveLength(1);
    expect(course.holes[0]?.number).toBe(1);
  });

  it('refuses to build a course with nothing complete', () => {
    expect(() => toCourse(newSession())).toThrow(/No hole/);
  });

  it('carries recorded hazards through to the course file', () => {
    let session = newSession(1);
    session = recordHazard(session, destinationPoint(TEE_1, 90, 200), {
      name: 'Creek',
      kind: 'water',
    });
    session = mapHole(session, 0);

    expect(toCourse(session).holes[0]?.hazards).toHaveLength(1);
  });

  it('marks a hole complete only when all four points exist', () => {
    let session = newSession(1);
    session = recordPoint(session, TEE_1);
    expect(isHoleComplete(currentMappedHole(session)!)).toBe(false);
  });
});
