# Golf Caddie — Even Realities G2

A GPS caddie that lives on the lens: yardages to the green, hazard carries, shot
tracking, a scorecard, and club suggestions learned from your own shots.

Built on the official [`@evenrealities/even_hub_sdk`](https://www.npmjs.com/package/@evenrealities/even_hub_sdk).
G2 apps are web apps — your code runs in a WebView inside the Even App on the
phone, and the SDK relays display containers and input events to the glasses over
BLE. This app therefore needs no native code and no glasses to develop against.

```
┌──────────────┐   BLE    ┌────────────────┐   HTTP   ┌──────────────┐
│  G2 glasses  │◀────────▶│    Even App    │◀────────▶│  this app    │
│  576×288 HUD │  events  │  (phone, host) │  WebView │  (TS + Vite) │
└──────────────┘          └────────────────┘          └──────────────┘
```

## What it does

| On the glasses | How |
|---|---|
| Front / centre / back yardages | Haversine distance from the live GPS fix to the three mapped green points |
| "Plays like" distance | Centre distance adjusted for the green's elevation, 1:1 by rule of thumb |
| Hazard carries | Only hazards still ahead **and** within 40 m of the tee→green line |
| Shot tracking | Tap at the ball: closes the previous shot with a measured distance, opens the next |
| Club suggestion | Median of your last 20 tagged shots per club, falling back to nominal distances |
| Scorecard | Strokes, putts and penalties per hole, nine at a time, with a running to-par |
| Course mapping | Walk the course once, tapping at each tee, green edge and hazard, and it writes a course file |

Everything persists through Even App storage, so a round survives the phone
locking, the WebView being backgrounded, or the app being reopened at the turn.

## Controls

The G2 reports taps and scrolls from either temple touchpad and the R1 ring; the
app treats them identically.

| Gesture | Playing screen | Lists |
|---|---|---|
| Scroll up / down | Previous / next hole | Move the highlight |
| Tap | Mark the ball | Choose the row |
| Double-tap | Open the menu | Back |

The menu carries everything that is not a per-shot action: score entry, tagging
the last shot with a club, undoing a mis-tapped mark, the scorecard, round stats,
course mapping, starting a new round, and finishing the current one. Entries that
have nothing to act on are hidden rather than shown greyed out.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173 — simulator, no glasses needed
npm test         # 112 tests, no device
npm run build    # dist/, ready to upload to Even Hub
```

Outside the Even App WebView the app boots against a **simulator**: a DOM mock of
the 576×288 display plus a walkable GPS. Keyboard controls are printed under the
display — `↑`/`↓` scroll, `Enter` tap, `M` double-tap, `W`/`A`/`S`/`D` walk ten
metres, `[`/`]` jump between tees and greens of the bundled course.

On device, `isEvenAppWebView()` detects the Flutter bridge and the real
`EvenBridgeHost` is used instead. Nothing else changes.

## Deploying to the glasses

1. `npm run build`
2. Serve or upload `dist/` per the [Even Hub developer docs](https://hub.evenrealities.com/docs).
3. `app.json` carries the manifest (id, name, entry, permissions). It requests
   `location` and `storage`; without location the app can only show the menu.

Requires Even App **2.2.6** or later — that is the SDK's `minAppVersion`.

## Courses

The bundled `courses/sample-pine-hollow.json` is a fictional nine-hole fixture,
generated with real spherical geometry so it behaves like a surveyed course in
the simulator. Regenerate it with `node tools/make-sample-course.mjs`.

To play a real course, either author a course file by hand
(see [`courses/README.md`](courses/README.md)) or use **Menu → Map this course**
and walk it once. Recorded courses are stored on the device and merged with the
bundled ones at startup.

## Architecture

```
src/
  core/          Golf logic. No SDK imports, no DOM — all of it unit tested.
    geo.ts         Haversine, bearing, cross/along-track, unit conversion
    course.ts      Course model + strict validation
    distances.ts   The yardage engine
    round.ts       Round state; every mutator is pure
    clubs.ts       Bag, learned distances, recommendations
    mapping.ts     Walk-and-mark course recorder
    storage.ts     Versioned persistence envelopes
  sdk/
    host.ts        The GlassesHost interface the app codes against
    bridge.ts      Real host, backed by the Even Hub SDK
    simulator.ts   Browser host: DOM display, keyboard gestures, walkable GPS
  ui/
    page.ts        Page model + the device's container rules, enforced up front
    layout.ts      The shared header/body/footer frame
    renderer.ts    Diffing renderer (see below)
    screens/       One module per screen
  app.ts         State, navigation stack, subscriptions, persistence
```

Two decisions are worth knowing about:

**Everything goes through `GlassesHost`.** Screens never touch the SDK. That is
what lets the entire app — including the real screens — run in a browser and in
the test suite against a fake host.

**The renderer diffs.** Yardages update about once a second while walking, and a
full `rebuildPageContainer` on every fix visibly flickers. Pages carry stable
container ids, so an identical layout with different strings becomes a set of
`textContainerUpgrade` calls; only a real layout change rebuilds, and an
unchanged frame is dropped entirely.

## Device constraints this app works within

Taken from the SDK contract and enforced in `src/ui/page.ts`, which throws before
anything reaches the bridge rather than letting the device reject a page:

- Display is **576×288**, origin top-left, no font sizing available.
- **1–12 containers** per page, at most **8 text** and **4 image**.
- **Exactly one** container may set `isEventCapture`.
- `zOrderIndex` is all-or-nothing per page and must be unique.
- `createStartUpPageContainer` must be called **once**, before anything else.

Body text is rendered as a single multi-line container: the device allows only 8
text containers but roughly 10 visible lines, so one label with newlines uses the
screen better than one container per row.

## Accuracy, honestly

Phone GPS is good to a few metres in the open. The app rounds every yardage to a
whole number, shows the reported accuracy in the footer, and flags fixes worse
than 15 m as `GPS WEAK` — at that point the number could be two clubs wrong. Club
suggestions say `~` when they are still using nominal distances rather than your
own measured ones, and the app refuses to mark a ball at all without a fix.

Elevation adjustment uses the 1:1 rule of thumb (uphill plays longer by the
height difference) and only appears when the course file has elevation data and
the correction is at least 2 m.

## Licence

MIT.
