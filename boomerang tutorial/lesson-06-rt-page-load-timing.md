# Lesson 6 — Page Load Timing with the RT Plugin

**Goal:** Master the `RT` (Round‑Trip) plugin — the heart of Boomerang's page‑load
measurement — and learn to add your own named timers to a beacon.

## Concepts

### What RT does

`RT` (`plugins/rt.js`) measures **how long the page took to load** and is the
plugin that, in most builds, decides "the page is ready → send the beacon." It is
why almost every build includes `RT` and why you "must include at least one
plugin."

It produces the three headline timers:

| Beacon param | Name | Meaning |
|--------------|------|---------|
| `t_done` | Total Page Load | Start of navigation → page ready |
| `t_resp` | Back‑End time | Navigation start → response begins (server + network) |
| `t_page` | Front‑End time | `t_done − t_resp` (browser rendering/processing) |

It also emits diagnostic vars such as `rt.start` (how the start time was
determined — e.g. `navigation`, `csi`, `cookie`, `manual`), `rt.tstart`,
`rt.end`, and `rt.bmr` (Boomerang's own load time).

### Where the "start" comes from

To compute `t_done`, RT needs a navigation **start time**. In priority order it
uses:

1. **NavigationTiming** `navigationStart` (modern browsers — most accurate).
2. A value you provide manually (`RT.startTimer` / a cookie set on the prior
   page) for legacy browsers or custom navigations.

You usually get accurate timing "for free" on modern browsers.

### Useful RT config

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  RT: {
    cookie: "RT",        // name of the RT session cookie
    cookie_exp: 1800,    // cookie lifetime (seconds)
    strict_referrer: true // only measure cross-page nav if referrer matches
  }
});
```

### Custom timers — the most useful everyday feature

Beyond the page‑load timers, RT lets you add **your own named timers** to the
beacon. Two APIs (from `doc/howtos`):

* `BOOMR.plugins.RT.startTimer(name)` … then `BOOMR.plugins.RT.endTimer(name)` —
  Boomerang records the elapsed time between the two calls.
* `BOOMR.plugins.RT.setTimer(name, milliseconds)` — set a timer to a value you
  already computed.

These timers ride along on the **next** page‑load beacon, appended to the
`t_other` parameter as `name|value` pairs.

```javascript
// Measure how long a widget takes to initialize
BOOMR.plugins.RT.startTimer("widget_init");
initExpensiveWidget();            // synchronous work
BOOMR.plugins.RT.endTimer("widget_init");

// Or set a known duration directly
BOOMR.plugins.RT.setTimer("server_render", 123);
```

On the beacon you'll see something like `t_other=widget_init|42,server_render|123`.

> For *asynchronous* / arbitrary events that should fire their **own** beacon
> (not piggyback on the page‑load beacon), use `BOOMR.requestStart` /
> `BOOMR.responseEnd` instead — covered in Lesson 9.

## Example

See [`examples/06-rt-timers.html`](./examples/06-rt-timers.html):

```javascript
BOOMR.subscribe("before_beacon", function (data) {
  console.log("t_done:", data.t_done, "t_resp:", data.t_resp,
              "t_page:", data.t_page, "t_other:", data.t_other);
});

// Time a fake "render" before the page is ready
BOOMR.plugins.RT.startTimer("hero_image");
var img = new Image();
img.onload = function () {
  BOOMR.plugins.RT.endTimer("hero_image"); // adds hero_image|<ms> to t_other
};
img.src = "https://via.placeholder.com/600x400";

BOOMR.init({ beacon_url: "/beacon", autorun: true });
```

## Exercise

1. Add two custom timers to the example page: one measured with
   `startTimer`/`endTimer`, and one set directly with `setTimer`.
2. Confirm both appear in the `t_other` parameter on the beacon.
3. Explain in one sentence the difference between `t_resp` and `t_page` for the
   page you're testing — which dominates, back‑end or front‑end?

## Solution / hints

* `t_other` is a comma‑separated list of `name|value` entries. If you don't see
  your timer, make sure `endTimer`/`setTimer` ran **before** the page‑load beacon
  fired (i.e. before `page_ready`). Timers ended after the beacon won't appear on
  it.
* `t_resp` ≈ time the server + network took to start responding; `t_page` ≈ time
  the browser spent building the page after that. If `t_resp` dominates, optimize
  the backend/CDN; if `t_page` dominates, optimize front‑end rendering/assets.
* If a timer should be captured even though it finishes late, you can keep the
  beacon open with the `IFrameDelay` plugin or send a separate custom beacon
  (Lesson 9) — but for the exercise, keep the work synchronous/fast.

➡ Next: [Lesson 7 — Browser timing plugins](./lesson-07-timing-plugins.md)
