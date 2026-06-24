# Lesson 5 — The Core BOOMR API & the Beacon

**Goal:** Learn the handful of `BOOMR` methods and events you'll use constantly,
and understand what a beacon actually contains.

## Concepts

Everything public hangs off the global **`BOOMR`** object. The methods below are
all defined in `boomerang.js`.

### Configuration: `BOOMR.init(config)`

Initializes Boomerang and every loaded plugin. You pass one config object;
top‑level keys are global settings, and a key matching a plugin's name configures
that plugin.

```javascript
BOOMR.init({
  beacon_url: "https://example.com/beacon/",  // where beacons are sent
  autorun: true,                              // auto-fire on page load (default true)
  ResourceTiming: { enabled: true },          // per-plugin config
  RT: { cookie: "RT", cookie_exp: 600 }
});
```

Common global options:

* `beacon_url` — endpoint for beacons.
* `beacon_type` — `"AUTO"`, `"GET"`, or `"POST"`.
* `autorun` — if `true` (default), Boomerang fires the page‑load beacon
  automatically when the page is ready. Set `false` when *you* will signal
  readiness (see `BOOMR.page_ready`).

### Adding data: `BOOMR.addVar` / `removeVar` / `hasVar`

Add arbitrary key/values that become beacon parameters:

```javascript
BOOMR.addVar("ab_test", "a");                  // single
BOOMR.addVar({ ab_test: "a", customer_id: 123 }); // multiple

BOOMR.hasVar("ab_test");      // true
BOOMR.removeVar("ab_test", "customer_id");     // remove one or many
```

Both keys and values are URI‑encoded on the beacon. Avoid overwriting variables
that plugins set (each plugin documents its parameters).

`addVar(name, value, singleBeacon)` — pass `true` as the third argument to make
the var apply to only the **next** beacon, then auto‑clear.

### Timing helpers: `BOOMR.now()`

Returns a high‑resolution timestamp (ms). Prefer it over `Date.now()` for
measuring durations.

### Measuring custom events

* `BOOMR.requestStart(name)` → returns a handle; call `.loaded()` when done.
* `BOOMR.responseEnd(name, t_start, data, t_end)` → fire a beacon immediately
  from known timestamps.

(Full treatment in Lesson 9.)

### The event system: `BOOMR.subscribe` / `fireEvent`

Boomerang is event‑driven. Subscribe to lifecycle events:

```javascript
BOOMR.subscribe("before_beacon", function (data) {
  // inspect or mutate the beacon before it is sent
});
```

Key events (from `boomerang.js`):

| Event | When it fires |
|-------|---------------|
| `page_ready` | The page is considered loaded |
| `dom_loaded` | `DOMContentLoaded` |
| `before_beacon` | Just before a beacon is sent — you can still add vars |
| `beacon` | After a beacon is sent — good time to clear one‑off vars |
| `page_load_beacon` | A page‑load (as opposed to XHR/SPA) beacon |
| `before_unload` / `page_unload` | The page is going away |
| `visibility_changed` | Page visibility changed |
| `xhr_load` | An instrumented XHR finished (AutoXHR) |
| `spa_init` / `spa_navigation` | SPA route lifecycle |
| `error` | A JS error was captured (Errors plugin) |
| `config` | Configuration was (re)applied |

`subscribe(event, fn, cb_data, cb_scope, once)` — `cb_data` is passed as a 2nd arg
to your callback; `once: true` auto‑unsubscribes after the first fire.

### Sending: `BOOMR.sendBeacon()`

Plugins normally trigger this when they're done, but you can force a beacon. Most
of the time you won't call it directly.

## Anatomy of a beacon

A beacon is just a set of key/value parameters. With `RT` + `NavigationTiming`
you'll typically see (abbreviated):

| Param | Meaning |
|-------|---------|
| `u` | URL of the page |
| `r` | Referrer |
| `t_done` | Total page load time (ms) |
| `t_resp` | Back‑end time (request start → first byte/response) |
| `t_page` | Front‑end time (`t_done − t_resp`) |
| `rt.start` | How the start time was determined (e.g. `navigation`) |
| `rt.bmr` | Boomerang's own load timing |
| `nt_*` | Raw NavigationTiming values (e.g. `nt_nav_st`, `nt_load_st`) |
| `v` | Boomerang version |
| `pgu` | Page group URL (if set) |

Your `beacon_url` endpoint receives these via the query string (GET / `<IMG>`) or
as `application/x-www-form-urlencoded` body (POST / `sendBeacon`).

## Example

See [`examples/05-api.html`](./examples/05-api.html). It demonstrates `addVar`,
`hasVar`, `now`, and subscribing to both `before_beacon` and `beacon`:

```javascript
BOOMR.subscribe("before_beacon", function (data) {
  console.log("t_done =", data.t_done, "ms; url =", data.u);
});

BOOMR.init({ beacon_url: "/beacon", autorun: true });

// Tag this page for an A/B test
BOOMR.addVar("ab_bucket", Math.random() < 0.5 ? "a" : "b");
```

## Exercise

1. On the example page, add a var `team` set to your name, and confirm it appears
   on the beacon object in the console.
2. Subscribe to the `beacon` event and `removeVar("team")` inside it. Reload and
   reason about why one‑off vars are usually cleared on `beacon` rather than
   `before_beacon`.
3. Use `BOOMR.now()` to measure how long a `for` loop of 1,000,000 iterations
   takes and add it as `loop_ms`.

## Solution / hints

```javascript
var start = BOOMR.now();
for (var i = 0; i < 1e6; i++) { /* busy work */ }
BOOMR.addVar("loop_ms", Math.round(BOOMR.now() - start));
```

* Clearing on `beacon` (after send) guarantees the value was actually included in
  the beacon that just went out, and won't accidentally linger onto the *next*
  beacon. Clearing in `before_beacon` would remove it before it's sent.
* Alternatively, `BOOMR.addVar("team", "me", true)` (the `singleBeacon` flag)
  auto‑clears the var after one beacon without a manual `removeVar`.

➡ Next: [Lesson 6 — Page load timing with RT](./lesson-06-rt-page-load-timing.md)
