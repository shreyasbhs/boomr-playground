# Lesson 9 — Errors, Custom Data & Custom Events

**Goal:** Capture JavaScript errors, tag beacons with your own business data, and
measure arbitrary timed events that fire their own beacons.

## Concepts

### JavaScript error tracking (`plugins/errors.js`)

The **Errors** plugin captures uncaught JavaScript errors and unhandled promise
rejections and reports them on the beacon (and can send dedicated error beacons).

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  Errors: {
    enabled: true,
    monitorGlobal: true,        // window.onerror
    monitorNetwork: true,       // failed XHR/fetch
    monitorConsole: false,      // console.error
    monitorTimeout: true,       // errors inside setTimeout/setInterval callbacks
    sendAfterOnload: true,      // keep reporting errors after load
    maxErrors: 10               // cap per beacon
  }
});
```

Captured errors arrive in the `err` beacon parameter (a compressed list) with
message, stack, source, line/column, and a count of how many times each occurred.
The plugin also fires the `error` BOOMR event, which you can subscribe to:

```javascript
BOOMR.subscribe("error", function (err) {
  console.log("Captured error:", err);
});
```

You can also report an error manually:

```javascript
BOOMR.plugins.Errors.send(new Error("Checkout failed"));
```

### Adding your own data: `BOOMR.addVar`

(Recap from Lesson 5 — this is the most common customization.) Tag every beacon
with business context: page group, A/B bucket, logged‑in state, build id, etc.

```javascript
BOOMR.addVar({
  page_group: "checkout",
  ab_bucket: "variant-b",
  logged_in: 1
});
```

A common pattern is a **nonce** for beacon authenticity: generate a one‑time
token server‑side, add it with `addVar`, and validate it at your beacon endpoint
(see Lesson 10).

> Tip: use `BOOMR.addVar(name, value, true)` (the `singleBeacon` flag) for data
> that should ride only the **next** beacon and then auto‑clear.

### Page Groups

Many backends bucket beacons by **Page Group** (the `pg` / `pgu` parameter) so
you can compare "checkout" vs "search" vs "home." The Page Params plugin
(`plugins/page-params.js`) can set this from rules, or you can set it yourself
with `addVar`.

### Measuring arbitrary timed events

Sometimes you want to time something that isn't a page load, XHR, or SPA route —
e.g. "how long did the video player take to become ready?" Two APIs (from
`doc/howtos/howto-measure-arbitrary-events.md`). Both send a **beacon whose Page
Group is the name you pass**.

**1. `BOOMR.requestStart(name)` + `.loaded()`** — Boomerang tracks start→end:

```javascript
var timer = BOOMR.requestStart("video-ready");
player.on("ready", function () {
  timer.loaded();   // sends a beacon, pg = "video-ready", elapsed = time taken
});
```

**2. `BOOMR.responseEnd(name, t_start, data, t_end)`** — fire immediately from
timestamps you already have:

```javascript
var start = BOOMR.now();
doWork(function () {
  // measured from `start` to now
  BOOMR.responseEnd("work-done", start);

  // or specify an explicit end time (e.g. 500ms ago) and extra vars
  BOOMR.responseEnd("work-2", start, { custom_var: 1 }, BOOMR.now() - 500);
});
```

**When to use which timer API:**

| API | Sends its own beacon? | Use when |
|-----|----------------------|----------|
| `RT.startTimer`/`endTimer` (Lesson 6) | No — rides the page‑load beacon | Sub‑timing a part of the initial load |
| `requestStart` / `responseEnd` | **Yes** — separate beacon | A discrete event after load |

## Example

See [`examples/09-custom.html`](./examples/09-custom.html). It tags the beacon,
triggers a deliberate error, and measures a custom event:

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  autorun: true,
  Errors: { enabled: true }
});

BOOMR.addVar("page_group", "demo");

// Custom timed event -> its own beacon with pg="image-load"
var t = BOOMR.requestStart("image-load");
var img = new Image();
img.onload = function () { t.loaded(); };
img.src = "https://via.placeholder.com/300";

// Deliberate error (captured by the Errors plugin)
setTimeout(function () { throw new Error("demo error"); }, 500);
```

## Exercise

1. Add a custom var `build_id` set to a fake version string and confirm it's on
   the page‑load beacon.
2. Trigger an error from a button click and find it in the `err` parameter (and
   via the `error` event).
3. Use `BOOMR.responseEnd("manual-timer", BOOMR.now() - 750)` to fabricate a
   ~750ms event and confirm a beacon with `pg=manual-timer` is sent.

## Solution / hints

* `responseEnd(name, t_start)` measures from `t_start` to "now," so passing
  `BOOMR.now() - 750` produces an event ~750ms long that beacons immediately.
* Errors are compressed in `err`; the easiest way to *verify* capture is the
  `error` event callback, which gives you the structured error object.
* Don't overwrite plugin‑owned vars (e.g. `t_done`, `u`, `nt_*`). Prefer your own
  namespaced keys (`myco_*`) to avoid collisions.

➡ Next: [Lesson 10 — Receiving & reading beacons](./lesson-10-reading-beacons.md)
