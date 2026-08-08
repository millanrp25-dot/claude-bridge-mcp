/**
 * Spherical geometry helpers.
 *
 * Everything internal to the app is stored in **metres**; yards only exist at
 * the formatting boundary. Mixing the two in the middle is how rangefinders end
 * up 10% wrong, so `DistanceUnit` is applied once, on the way to the display.
 */

export interface LatLng {
  lat: number;
  lng: number;
  /** Metres above sea level, when the course file or GPS provides it. */
  elevation?: number;
}

export type DistanceUnit = 'yards' | 'meters';

/** Mean Earth radius (metres), WGS-84 authalic sphere. */
const EARTH_RADIUS_M = 6371008.8;

const METERS_PER_YARD = 0.9144;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export function metersToYards(meters: number): number {
  return meters / METERS_PER_YARD;
}

export function yardsToMeters(yards: number): number {
  return yards * METERS_PER_YARD;
}

/**
 * Great-circle distance in metres.
 *
 * Haversine is numerically well behaved at the scales a golf course lives at
 * (tens to hundreds of metres), where the law-of-cosines form loses precision.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `a` to `b`, in degrees clockwise from true north. */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Point reached by travelling `meters` from `origin` along `bearing`. */
export function destinationPoint(
  origin: LatLng,
  bearingDeg: number,
  meters: number,
): LatLng {
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
    lat: toDeg(lat2),
    lng: ((toDeg(lng2) + 540) % 360) - 180,
  };
}

/**
 * Signed perpendicular distance from `point` to the great circle through
 * `start` → `end`. Positive means right of the line looking down it.
 *
 * Used to tell the player how far offline they are from the tee→green centre
 * line, which is what makes a hazard "in play" rather than merely nearby.
 */
export function crossTrackMeters(
  point: LatLng,
  start: LatLng,
  end: LatLng,
): number {
  const d13 = distanceMeters(start, point) / EARTH_RADIUS_M;
  const bearing13 = toRad(bearingDegrees(start, point));
  const bearing12 = toRad(bearingDegrees(start, end));
  return Math.asin(Math.sin(d13) * Math.sin(bearing13 - bearing12)) * EARTH_RADIUS_M;
}

/** Convert an internal metre value into the unit the player reads. */
export function toDisplayUnits(meters: number, unit: DistanceUnit): number {
  return unit === 'yards' ? metersToYards(meters) : meters;
}

/**
 * Whole-number distance for the HUD.
 *
 * Golf yardages are never shown with decimals — GPS is good to a few metres at
 * best, so a decimal point would be advertising precision that isn't there.
 */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  return String(Math.round(toDisplayUnits(meters, unit)));
}

export const UNIT_LABEL: Record<DistanceUnit, string> = {
  yards: 'yd',
  meters: 'm',
};

/**
 * Elevation-adjusted "plays like" distance.
 *
 * Rule of thumb used by every laser rangefinder worth carrying: a shot playing
 * uphill by `h` metres plays roughly `h` metres longer, downhill roughly `h`
 * shorter. The factor is exposed because the 1:1 approximation degrades on very
 * short or very long shots.
 */
export function playsLikeMeters(
  horizontalMeters: number,
  elevationDeltaMeters: number,
  factor = 1,
): number {
  return Math.max(0, horizontalMeters + elevationDeltaMeters * factor);
}

/** Elevation gain from `from` to `to`, or 0 when either side lacks data. */
export function elevationDelta(from: LatLng, to: LatLng): number {
  if (from.elevation === undefined || to.elevation === undefined) return 0;
  return to.elevation - from.elevation;
}
