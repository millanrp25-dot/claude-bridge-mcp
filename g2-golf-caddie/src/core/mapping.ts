/**
 * Walk-and-mark course recorder.
 *
 * Nobody hand-types 72 coordinates. Instead you play the course once with this
 * running: stand on the tee and press, then at the front, middle and back of the
 * green and press. The result is a normal course file, indistinguishable from a
 * hand-authored one.
 */

import type { Course, Hazard, Hole, Tee } from './course.js';
import { parseCourse } from './course.js';
import type { LatLng } from './geo.js';

export type MappingStep = 'tee' | 'front' | 'center' | 'back';

/** Order the player walks the points in — tee first, then up the green. */
export const MAPPING_STEPS: MappingStep[] = ['tee', 'front', 'center', 'back'];

export const STEP_LABEL: Record<MappingStep, string> = {
  tee: 'Stand on the tee',
  front: 'Front edge of green',
  center: 'Middle of green',
  back: 'Back edge of green',
};

export interface MappedHole {
  number: number;
  par: number;
  tee?: LatLng;
  front?: LatLng;
  center?: LatLng;
  back?: LatLng;
  hazards: Hazard[];
}

export interface MappingSession {
  courseId: string;
  courseName: string;
  teeName: string;
  holes: MappedHole[];
  currentHole: number;
  step: MappingStep;
}

export interface StartMappingOptions {
  courseName: string;
  holeCount: number;
  teeName?: string;
  now: number;
}

export function startMapping({
  courseName,
  holeCount,
  teeName = 'Default',
  now,
}: StartMappingOptions): MappingSession {
  return {
    courseId: `local-${now.toString(36)}`,
    courseName,
    teeName,
    currentHole: 1,
    step: 'tee',
    holes: Array.from({ length: holeCount }, (_, index) => ({
      number: index + 1,
      par: 4,
      hazards: [],
    })),
  };
}

function withHole(
  session: MappingSession,
  holeNumber: number,
  update: (hole: MappedHole) => MappedHole,
): MappingSession {
  return {
    ...session,
    holes: session.holes.map((hole) =>
      hole.number === holeNumber ? update(hole) : hole,
    ),
  };
}

export function currentMappedHole(session: MappingSession): MappedHole | undefined {
  return session.holes.find((hole) => hole.number === session.currentHole);
}

/**
 * Record the player's position for the current step and advance.
 *
 * After the back edge the session moves to the next hole's tee, so the whole
 * round is one uninterrupted press-per-landmark loop.
 */
export function recordPoint(session: MappingSession, position: LatLng): MappingSession {
  const updated = withHole(session, session.currentHole, (hole) => ({
    ...hole,
    [session.step]: position,
  }));

  const stepIndex = MAPPING_STEPS.indexOf(session.step);
  const nextStep = MAPPING_STEPS[stepIndex + 1];

  if (nextStep) return { ...updated, step: nextStep };

  const nextHole = session.currentHole + 1;
  const hasNextHole = updated.holes.some((hole) => hole.number === nextHole);
  return hasNextHole
    ? { ...updated, currentHole: nextHole, step: 'tee' }
    : { ...updated, step: 'back' };
}

/** Drop a hazard at the player's position on the current hole. */
export function recordHazard(
  session: MappingSession,
  position: LatLng,
  hazard: Pick<Hazard, 'name' | 'kind'>,
): MappingSession {
  return withHole(session, session.currentHole, (hole) => ({
    ...hole,
    hazards: [...hole.hazards, { ...hazard, carry: position }],
  }));
}

export function setPar(session: MappingSession, par: number): MappingSession {
  return withHole(session, session.currentHole, (hole) => ({
    ...hole,
    par: Math.max(3, Math.min(6, Math.round(par))),
  }));
}

export function goToMappingHole(
  session: MappingSession,
  holeNumber: number,
): MappingSession {
  if (!session.holes.some((hole) => hole.number === holeNumber)) return session;
  return { ...session, currentHole: holeNumber, step: 'tee' };
}

export function isHoleComplete(hole: MappedHole): boolean {
  return Boolean(hole.tee && hole.front && hole.center && hole.back);
}

export function mappingProgress(session: MappingSession): {
  complete: number;
  total: number;
} {
  return {
    complete: session.holes.filter(isHoleComplete).length,
    total: session.holes.length,
  };
}

/**
 * Build a course from the completed holes.
 *
 * Half-mapped holes are dropped rather than guessed at — a green with no front
 * edge would quote a yardage the player cannot trust, which is worse than the
 * hole simply not being there yet.
 */
export function toCourse(session: MappingSession): Course {
  const holes: Hole[] = [];

  for (const mapped of session.holes) {
    if (!isHoleComplete(mapped)) continue;
    const tee: Tee = { name: session.teeName, position: mapped.tee as LatLng };
    holes.push({
      number: mapped.number,
      par: mapped.par,
      tees: [tee],
      green: {
        front: mapped.front as LatLng,
        center: mapped.center as LatLng,
        back: mapped.back as LatLng,
      },
      ...(mapped.hazards.length > 0 ? { hazards: mapped.hazards } : {}),
    });
  }

  if (holes.length === 0) {
    throw new Error('No hole has all four points recorded yet.');
  }

  return parseCourse({
    id: session.courseId,
    name: session.courseName,
    version: 1,
    holes,
  });
}
