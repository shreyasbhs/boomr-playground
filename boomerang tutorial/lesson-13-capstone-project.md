# Lesson 13 — Capstone Project

**Goal:** Combine everything into a realistic monitoring setup: a built Boomerang
bundle, a page that emits page‑load, SPA, XHR, error and custom beacons, a server
that receives and stores them, and a tiny report.

This is open‑ended. Below is a recommended spec, a suggested architecture, and a
checklist. A reference implementation lives in
[`examples/13-capstone/`](./examples/13-capstone).

## The brief

Build RUM for a small "store" demo that has:

* An initial page load (measured by RT + NavigationTiming + PaintTiming).
* A product list loaded via `fetch` (XHR beacon).
* Client‑side navigation to a product detail "route" (SPA beacon).
* A deliberate error path (Errors plugin).
* Business tagging: every beacon carries `page_group` and a `build_id`.
* A backend that stores beacons and prints a summary (avg `t_done`, error count,
  beacons per page group).

## Suggested steps

### 1. Build a tailored bundle

Create `plugins.user.json` with exactly what this app needs:

```json
{
  "plugins": [
    "plugins/config-override.js",
    "plugins/page-params.js",
    "plugins/auto-xhr.js",
    "plugins/spa.js",
    "plugins/history.js",
    "plugins/rt.js",
    "plugins/painttiming.js",
    "plugins/navtiming.js",
    "plugins/restiming.js",
    "plugins/compression.js",
    "plugins/errors.js"
  ]
}
```

```bash
grunt clean build
# -> build/boomerang-<version>.min.js
```

### 2. Configure Boomerang on the page

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  instrument_xhr: true,
  AutoXHR: { monitorFetch: true, alwaysSendXhr: true },
  History: { enabled: true, auto: true },
  Errors: { enabled: true },
  ResourceTiming: { enabled: true, clearOnBeacon: true }
});

BOOMR.addVar({ build_id: "2024.06.1", page_group: "home" });

// Update page_group on each SPA navigation
BOOMR.subscribe("spa_navigation", function () {
  BOOMR.addVar("page_group", location.pathname.replace(/\//g, "") || "home");
});
```

### 3. Generate the four beacon types

* **Page load:** just load the page.
* **XHR:** `fetch("/api/products")` on a button click.
* **SPA:** `history.pushState({}, "", "/product/42")` + render detail.
* **Error:** a button that throws.

### 4. Receive and store beacons

A Node server that serves the page, accepts GET+POST beacons, appends them to a
JSON/NDJSON file, and exposes `/report`:

```javascript
// pseudo-handler
function onBeacon(data) {
  store.push({
    ts: Date.now(),
    type: data["http.initiator"] || "page-load",
    pg: data.page_group,
    u: data.u,
    t_done: Number(data.t_done) || null,
    has_error: !!data.err
  });
}
```

`/report` aggregates: count by `type`, average `t_done` per `page_group`, total
errors.

### 5. Verify

* Load the page → a page‑load (`spa_hard` if SPA active) beacon stored.
* Click "load products" → an XHR/fetch beacon.
* Navigate to a product → an SPA beacon with the new `page_group`.
* Click "break it" → a beacon with a populated `err` param.
* Hit `/report` → see the aggregates.

## Acceptance checklist

- [ ] Custom build produced in `build/` from `plugins.user.json`.
- [ ] Page‑load beacon includes `t_done`, `nt_*`, `pt.fcp`.
- [ ] At least one `xhr`/fetch beacon captured.
- [ ] At least one `spa` beacon captured with the correct `page_group`.
- [ ] An error is captured in the `err` parameter.
- [ ] Every beacon carries `build_id` and `page_group`.
- [ ] Server stores beacons and `/report` shows aggregates.
- [ ] Endpoint responds `204` quickly (no heavy work in request path).

## Stretch goals

* Add the **Continuity** plugin (cutting‑edge flavor) and capture **CLS**,
  **TTI**, and rage clicks.
* Add a **nonce** to each page render and validate it server‑side (Lesson 10).
* Add **opt‑in** consent gating (Lesson 12) so no beacon fires before consent.
* Forward stored beacons to a real backend (boomcatch, Basic RUM, or
  OpenTelemetry) instead of a flat file.
* Compute **percentiles** (p50/p75/p95) of `t_done` per page group instead of a
  simple average — percentiles are how RUM is really analyzed.

## Where to go next

* Skim the source of a plugin you use a lot (e.g. `plugins/rt.js`,
  `plugins/auto-xhr.js`) to deepen your understanding.
* Read the full docs: <https://akamai.github.io/boomerang/>.
* Explore `doc/howtos/` for more recipes (buffer tuning, delaying page load,
  additional timers).
* Contribute back — see `doc/contributing.md`.

🎉 **Congratulations** — you've gone from "what is RUM?" to building, customizing,
extending, and operating Boomerang end to end.
