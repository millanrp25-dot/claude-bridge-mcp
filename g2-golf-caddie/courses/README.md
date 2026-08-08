# Course files

A course is plain JSON. Coordinates are WGS-84 decimal degrees; `elevation` is
metres above sea level and optional everywhere it appears.

## Format

```jsonc
{
  "id": "pine-hollow",           // unique; recorded courses use "local-<base36>"
  "name": "Pine Hollow",
  "location": "Bend, OR",        // optional, informational
  "version": 1,
  "holes": [
    {
      "number": 1,
      "par": 4,                  // 3–6
      "handicap": 5,             // optional stroke index, 1 = hardest
      "tees": [
        {
          "name": "Blue",
          "position": { "lat": 44.2820396, "lng": -121.3182, "elevation": 0 },
          "lengthMeters": 364    // optional, scorecard length
        }
      ],
      "green": {
        "front":  { "lat": 44.2843801, "lng": -121.3152561, "elevation": 4 },
        "center": { "lat": 44.2844718, "lng": -121.3151408, "elevation": 4 },
        "back":   { "lat": 44.2845635, "lng": -121.3150255, "elevation": 4 }
      },
      "hazards": [               // optional
        {
          "name": "Creek",
          "kind": "water",       // water | bunker | ood | layup | other
          "carry": { "lat": 44.283, "lng": -121.316 },  // near edge
          "far":   { "lat": 44.2832, "lng": -121.3157 } // far edge, optional
        }
      ],
      "aim": { "lat": 44.283, "lng": -121.317 }  // optional dogleg point
    }
  ]
}
```

Every field is validated on load by `src/core/course.ts`. A file with a bad
coordinate, a duplicate hole number, an out-of-range par, or a green missing one
of its three points is rejected with a list of exactly what is wrong — a
rangefinder that confidently reports the wrong number is worse than one that
refuses to start.

## Three ways to build one

**Walk it.** Menu → *Map this course*. The top row always names the next
landmark — tee, then front, middle and back of the green — so the common path is
tap, walk, tap. The other rows drop a water hazard or bunker where you are
standing, cycle the hole's par, skip to the next hole, or save.

Double-tap leaves mapping without discarding the session, so you can check a
yardage and come back. Half-mapped holes are dropped on save rather than guessed
at, so an interrupted round still leaves usable holes behind.

**By hand.** Read coordinates off satellite imagery and fill in the shape above.
Front and back matter as much as centre: green depth is often 25–35 m, which is
two clubs.

**Generate one.** `tools/make-sample-course.mjs` builds the bundled sample from a
table of pars, bearings and lengths using real spherical geometry. It is a decent
starting point for a script that pulls from another data source.

## Adding a course to the bundle

Drop the file in this directory and import it in `src/main.ts`:

```ts
import myCourse from '../courses/my-course.json';
// ...
for (const raw of [samplePineHollow, myCourse]) { /* ... */ }
```

Courses recorded on the device do not need this — they are stored through the
Even App and merged with the bundled ones at startup.

## Accuracy notes

- Take green points from the actual putting surface edges, not the fringe.
- Hazard `carry` is the **near** edge — the point you have to clear. Hazards
  dropped while mapping record only that near edge; add a `far` point by hand if
  clearing the whole hazard matters.
- A hazard more than 40 m off the tee→green line never reaches the display, so
  there is no cost to mapping the ones that only catch a wild miss.
- Elevation is worth adding for the green; the app only shows a "plays like"
  line when the correction is 2 m or more.
