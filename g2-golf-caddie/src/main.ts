/**
 * Entry point.
 *
 * Inside Even App the real bridge is used; anywhere else (a plain browser tab,
 * `npm run dev`) the simulator stands in, so the app boots either way.
 */

import samplePineHollow from '../courses/sample-pine-hollow.json';
import { App } from './app.js';
import { parseCourse, selectTee, type Course } from './core/course.js';
import { EvenBridgeHost, isEvenAppWebView } from './sdk/bridge.js';
import type { GlassesHost } from './sdk/host.js';
import { SimulatorHost, type Waypoint } from './sdk/simulator.js';

/** Courses shipped in the bundle. Device-recorded courses are merged at start. */
function bundledCourses(): Course[] {
  const courses: Course[] = [];
  for (const raw of [samplePineHollow]) {
    try {
      courses.push(parseCourse(raw));
    } catch (error) {
      console.error('[g2-golf] bundled course failed validation:', error);
    }
  }
  return courses;
}

/** Every tee and green, so the simulator can jump around the course. */
function waypointsFor(course: Course | undefined): Waypoint[] {
  if (!course) return [];
  return course.holes.flatMap((hole) => {
    const tee = selectTee(hole);
    const points: Waypoint[] = [];
    if (tee) points.push({ label: `H${hole.number} tee`, position: tee.position });
    points.push({ label: `H${hole.number} green`, position: hole.green.center });
    return points;
  });
}

async function createHost(courses: Course[]): Promise<GlassesHost> {
  if (isEvenAppWebView()) return EvenBridgeHost.connect();

  const mount = document.getElementById('simulator');
  if (!mount) throw new Error('simulator mount point missing from index.html');

  const first = courses[0];
  const start = first ? (selectTee(first.holes[0]!)?.position ?? first.holes[0]!.green.center) : { lat: 0, lng: 0 };

  return new SimulatorHost({
    mount,
    start,
    waypoints: waypointsFor(first),
  });
}

async function boot(): Promise<void> {
  const courses = bundledCourses();
  const host = await createHost(courses);
  const app = new App({ host, bundledCourses: courses });

  // Flush the round to storage if the WebView is torn down mid-hole.
  window.addEventListener('pagehide', () => void app.dispose());

  await app.start();
}

void boot().catch((error) => {
  console.error('[g2-golf] failed to start:', error);
});
