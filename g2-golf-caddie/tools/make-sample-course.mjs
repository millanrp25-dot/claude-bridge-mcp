/**
 * Generates `courses/sample-pine-hollow.json`.
 *
 * The sample course is fictional. Its holes are laid out with real spherical
 * geometry so distances, doglegs and hazard carries behave exactly as they
 * would on a surveyed course — the point is a fixture you can walk around in
 * the simulator, not a real place.
 *
 *   node tools/make-sample-course.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;
const YARDS = 0.9144;

function destination(origin, bearingDeg, meters) {
  const angular = meters / EARTH_RADIUS_M;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.lat);
  const lng1 = toRad(origin.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: round(toDeg(lat2)),
    lng: round(((toDeg(lng2) + 540) % 360) - 180),
  };
}

const round = (value) => Number(value.toFixed(7));

/** Clubhouse corner of the fictional property. */
const ORIGIN = { lat: 44.281_5, lng: -121.318_2 };

/**
 * Hole specs in yards. `bearing` is the tee→green line; `hazard` positions are
 * given as a fraction of the hole length so they land where they would in life.
 */
const HOLES = [
  { par: 4, yards: 398, bearing: 42, si: 5, elevation: 4, hazards: [{ name: 'Fairway bunker', kind: 'bunker', at: 0.62, offline: 12 }] },
  { par: 5, yards: 521, bearing: 118, si: 11, elevation: -6, hazards: [{ name: 'Creek', kind: 'water', at: 0.55, offline: 0, width: 14 }] },
  { par: 3, yards: 168, bearing: 205, si: 17, elevation: 9, hazards: [{ name: 'Front bunker', kind: 'bunker', at: 0.86, offline: -8 }] },
  { par: 4, yards: 372, bearing: 290, si: 7, elevation: 0, hazards: [] },
  { par: 4, yards: 441, bearing: 15, si: 1, elevation: 7, hazards: [{ name: 'Pond', kind: 'water', at: 0.78, offline: 16, width: 22 }] },
  { par: 3, yards: 205, bearing: 96, si: 13, elevation: -4, hazards: [] },
  { par: 5, yards: 488, bearing: 168, si: 9, elevation: 2, hazards: [{ name: 'Cross bunkers', kind: 'bunker', at: 0.7, offline: 4 }] },
  { par: 4, yards: 355, bearing: 248, si: 15, elevation: -3, hazards: [{ name: 'OB left', kind: 'ood', at: 0.5, offline: -34 }] },
  { par: 4, yards: 414, bearing: 330, si: 3, elevation: 5, hazards: [{ name: 'Lake', kind: 'water', at: 0.72, offline: 8, width: 30 }] },
];

/** Green geometry: 30 yards front-to-back, centred on the tee→green line. */
const GREEN_DEPTH_M = 30 * YARDS;

function buildHole(spec, index) {
  const number = index + 1;
  // Tees fan out from the clubhouse so holes do not overlap in the simulator.
  const teeAnchor = destination(ORIGIN, (index * 47) % 360, 60 + index * 30);
  const lengthM = spec.yards * YARDS;

  const back = { ...teeAnchor, elevation: 0 };
  const white = destination(teeAnchor, spec.bearing, 18 * YARDS);
  const forward = destination(teeAnchor, spec.bearing, 42 * YARDS);

  const greenFront = destination(teeAnchor, spec.bearing, lengthM - GREEN_DEPTH_M / 2);
  const greenCenter = destination(teeAnchor, spec.bearing, lengthM);
  const greenBack = destination(teeAnchor, spec.bearing, lengthM + GREEN_DEPTH_M / 2);

  const hazards = spec.hazards.map((hazard) => {
    const along = destination(teeAnchor, spec.bearing, lengthM * hazard.at);
    const carry = destination(along, spec.bearing + 90, hazard.offline * YARDS);
    const entry = {
      name: hazard.name,
      kind: hazard.kind,
      carry: { ...carry },
    };
    if (hazard.width) {
      entry.far = destination(carry, spec.bearing, hazard.width * YARDS);
    }
    return entry;
  });

  return {
    number,
    par: spec.par,
    handicap: spec.si,
    tees: [
      { name: 'Blue', position: { ...back, elevation: 0 }, lengthMeters: Math.round(lengthM) },
      { name: 'White', position: { ...white, elevation: 0 }, lengthMeters: Math.round(lengthM - 18 * YARDS) },
      { name: 'Forward', position: { ...forward, elevation: 0 }, lengthMeters: Math.round(lengthM - 42 * YARDS) },
    ],
    green: {
      front: { ...greenFront, elevation: spec.elevation },
      center: { ...greenCenter, elevation: spec.elevation },
      back: { ...greenBack, elevation: spec.elevation },
    },
    ...(hazards.length > 0 ? { hazards } : {}),
  };
}

const course = {
  id: 'sample-pine-hollow',
  name: 'Pine Hollow (sample)',
  location: 'Fictional — generated fixture',
  version: 1,
  holes: HOLES.map(buildHole),
};

const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../courses/sample-pine-hollow.json',
);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(course, null, 2)}\n`);
console.log(`wrote ${outPath} — ${course.holes.length} holes`);
