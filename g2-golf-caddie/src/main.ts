/**
 * Entry point.
 *
 * Three hosts, chosen by where the page is running:
 *  - Inside Even App's WebView → the real SDK bridge.
 *  - A plain phone/desktop browser → `BrowserHost`: real GPS, touch controls.
 *    This is what makes the app usable before a G2 is ever paired — getting a
 *    custom app onto the glasses goes through the Even Hub developer portal
 *    (account, upload, device pairing), which is not a same-day path the first
 *    time. The browser host runs the exact same screens and golf logic against
 *    the phone's own location and touchscreen instead.
 *  - `?dev=1` → the keyboard-driven simulator, for building without walking
 *    around outside.
 */

import samplePineHollow from '../courses/sample-pine-hollow.json';
import { App } from './app.js';
import { parseCourse, selectTee, type Course } from './core/course.js';
import { BrowserHost } from './sdk/browserHost.js';
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

/** Every tee and green, so the dev simulator can jump around the course. */
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

function wantsDevSimulator(): boolean {
  return new URLSearchParams(window.location.search).has('dev');
}

async function createHost(courses: Course[]): Promise<GlassesHost> {
  if (isEvenAppWebView()) return EvenBridgeHost.connect();

  const mount = document.getElementById('app');
  if (!mount) throw new Error('mount point missing from index.html');

  if (wantsDevSimulator()) {
    const first = courses[0];
    const start = first
      ? (selectTee(first.holes[0]!)?.position ?? first.holes[0]!.green.center)
      : { lat: 0, lng: 0 };
    return new SimulatorHost({ mount, start, waypoints: waypointsFor(first) });
  }

  return new BrowserHost(mount);
}

async function boot(): Promise<void> {
  const courses = bundledCourses();
  const host = await createHost(courses);
  const app = new App({ host, bundledCourses: courses });

  // Flush the round to storage if the tab/WebView is torn down mid-hole.
  window.addEventListener('pagehide', () => void app.dispose());

  await app.start();
}

void boot().catch((error) => {
  console.error('[g2-golf] failed to start:', error);
});
