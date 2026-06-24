# Lesson 8 — XHR & Single Page Apps

**Goal:** Measure activity *after* the initial page load — AJAX calls and SPA
route changes — using the AutoXHR, SPA, and History plugins.

## Concepts

Traditional `RT` measures the **first** full page load. But modern apps do most
of their work *after* that: fetching data with `XMLHttpRequest`/`fetch` and
navigating between "pages" without a real browser navigation. Boomerang measures
these as additional beacons.

### AutoXHR (`plugins/auto-xhr.js`)

AutoXHR **automatically instruments `XMLHttpRequest`** (and, when enabled,
`fetch`). When an XHR completes — and any DOM mutations it triggered settle — it
can send an **XHR beacon** describing that interaction.

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  instrument_xhr: true,
  AutoXHR: {
    monitorFetch: true,         // also instrument window.fetch
    fetchBodyUsedWait: 1000,    // wait for response body to be consumed
    alwaysSendXhr: true         // beacon every XHR, not just SPA-related ones
  }
});
```

XHR beacons carry `http.initiator=xhr` and the timing of the request. AutoXHR
fires the `xhr_load` event when an instrumented XHR finishes — you can subscribe
to it.

AutoXHR also watches the DOM **mutations** caused by a click/XHR so it can tell
when an interaction has truly "finished" (e.g. content rendered), not just when
the network call returned.

### SPA (`plugins/spa.js`)

The base plugin required for **Single Page App** measurement. It defines the
concept of a **soft navigation** (a route change that doesn't reload the page)
and emits the `spa_init` and `spa_navigation` events. It does not work alone —
you pair it with a framework plugin.

### History (`plugins/history.js`)

The general SPA framework plugin. It hooks into `window.history`
(`pushState`/`replaceState`/`popstate`) so it works with **React Router**,
**Vue Router**, and other `history`‑based routers — and it now also covers the
old **Angular**, **Backbone**, and **Ember** integrations.

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  History: {
    enabled: true,
    auto: true   // automatically hook history API route changes
  }
});
```

For frameworks that need manual control, you can drive navigations yourself:

```javascript
// Tell Boomerang a soft navigation is starting
BOOMR.plugins.SPA.route_change();
```

### How an SPA navigation is measured

1. The router changes route (e.g. `history.pushState`).
2. History/SPA detect it → a **soft navigation** begins; `spa_navigation` fires.
3. AutoXHR watches the XHRs/fetches and DOM mutations the new route triggers.
4. When activity settles, Boomerang sends an SPA beacon with `http.initiator` of
   `spa_hard` (the first one, replacing the page‑load beacon) or `spa` (later
   soft navigations).

So a typical SPA session produces: one `spa_hard` beacon (initial load) + one
`spa` beacon per subsequent route change + optional `xhr` beacons.

## Example

See [`examples/08-spa.html`](./examples/08-spa.html). It's a tiny SPA with two
"routes" driven by `history.pushState` and a button that does a `fetch`:

```javascript
BOOMR.subscribe("before_beacon", function (data) {
  console.log("beacon:", data["http.initiator"] || "page-load",
              "url:", data.u, "t_done:", data.t_done);
});

BOOMR.init({
  beacon_url: "/beacon",
  instrument_xhr: true,
  AutoXHR: { monitorFetch: true, alwaysSendXhr: true },
  History: { enabled: true, auto: true }
});
```

Click around and watch separate beacons appear for each route change and fetch.

## Exercise

1. On the example page, add a third route and a navigation link to it. Confirm a
   new `spa` beacon fires when you navigate to it.
2. Add a button that performs a slow `fetch` (e.g. to
   `https://httpbin.org/delay/1`) and observe the XHR/fetch beacon's `t_done`
   roughly matching the delay.
3. Subscribe to `spa_navigation` and log the route URL each time it fires.

## Solution / hints

* `BOOMR.subscribe("spa_navigation", function (data) { console.log(data); })`
  fires at the **start** of each soft navigation.
* The **first** SPA beacon is `http.initiator = spa_hard` (it stands in for the
  page‑load beacon); subsequent ones are `spa`. Pure AJAX beacons are
  `http.initiator = xhr`.
* If route‑change beacons don't fire, confirm your router actually uses the
  History API (`pushState`). Hash‑only (`#/route`) routers may need the route to
  be signalled manually via `BOOMR.plugins.SPA.route_change()`.
* `alwaysSendXhr: true` is what makes *every* XHR beacon; without it, AutoXHR
  primarily beacons XHRs associated with SPA navigations.

➡ Next: [Lesson 9 — Errors, custom data & custom events](./lesson-09-errors-and-custom-data.md)
