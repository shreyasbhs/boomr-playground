# Lesson 1 — What is RUM & Boomerang?

**Goal:** Understand the problem Boomerang solves and the big‑picture of how it
works, before you write any code.

## Concepts

### Real User Monitoring (RUM)

There are two broad ways to measure web performance:

* **Synthetic monitoring** — a robot/agent in a data center loads your page on a
  schedule. Consistent, but it is *not* your real users on real devices and
  networks.
* **Real User Monitoring (RUM)** — JavaScript on the page measures the
  experience of *actual visitors* and sends the data back to you. You learn how
  fast your site *really* is for the people who use it.

Boomerang is a **RUM** library. Quoting the project:

> boomerang is a JavaScript library that measures the page load time experienced
> by real users… With boomerang, you find out exactly how fast your users think
> your site is.

### What Boomerang captures

All of these are optional and provided by individual **plugins**:

* Page characteristics: URL, referrer.
* Overall page load time (via the [NavigationTiming API]).
* DNS, TCP, request and response timings.
* Browser characteristics: screen size, orientation, memory, visibility state.
* DOM characteristics: node count, HTML length, images, scripts.
* [ResourceTiming] data to reconstruct the page's waterfall.
* Bandwidth & latency, mobile connection type, DNS latency.
* JavaScript errors.
* `XMLHttpRequest` instrumentation.
* Single Page App (SPA) interactions.
* Modern UX metrics: First Contentful Paint, Largest Contentful Paint,
  Cumulative Layout Shift, First Input Delay, Time to Interactive.

### The two core ideas

1. **Plugins** do the measuring. The core `boomerang.js` framework on its own
   "will not do anything interesting" — you combine it with plugins.
2. **Beacons** carry the data. When measurement is complete, Boomerang sends the
   collected data to a URL you configure (`beacon_url`) as a **beacon** — a
   small HTTP request whose query string / body contains the metrics.

```
[ User's browser ]                         [ Your server ]
  page loads
  plugins measure  --->  BOOMR builds  --->  beacon HTTP request
                          a beacon            (?t_done=523&u=...)  --->  log / analyze
```

### A key design goal: don't slow the page down

Boomerang is built to avoid the [Observer Effect] — the act of measuring should
not change what you measure. It can be loaded **asynchronously** so that even if
`boomerang.js` is slow or unavailable, your page load is not delayed. We'll cover
that in Lesson 3.

## How it measures page load (high level)

Modern browsers expose the **NavigationTiming API**, which gives high‑resolution
timestamps for each stage of a navigation (DNS, connect, request, response, DOM,
load). Boomerang uses it when available to compute Page Load Time.

For very old browsers without NavigationTiming, Boomerang falls back to a cookie
trick: it records a timestamp on `onbeforeunload` of the *previous* page and
compares it to `onload` of the *new* page. (See `doc/methodology.md`.) You rarely
need to think about this today, but it explains why Boomerang sometimes can't
measure the very first page a visitor lands on in legacy browsers.

## Exercise

No coding yet — answer these to check your understanding:

1. Name one thing RUM tells you that synthetic monitoring cannot.
2. Why must you include at least one plugin for Boomerang to be useful?
3. What is a "beacon"?
4. Why does Boomerang care so much about loading asynchronously?

## Solution / hints

1. RUM reflects your *actual* users' devices, networks, geographies and cache
   states — the real distribution of experiences, not one lab machine.
2. The core framework only provides infrastructure (config, events, beacon
   sending). The *measurements themselves* live in plugins like `RT`. With no
   plugin, nothing decides when/what to measure, so no beacon fires.
3. A beacon is the HTTP request Boomerang sends to your `beacon_url` carrying the
   measured data (as URL query parameters or POST body).
4. Because measuring performance must not *worsen* performance (the Observer
   Effect). Async loading means a slow `boomerang.js` never delays `onload`.

➡ Next: [Lesson 2 — Getting started](./lesson-02-getting-started.md)

[NavigationTiming API]: https://www.w3.org/TR/navigation-timing/
[ResourceTiming]: https://www.w3.org/TR/resource-timing-1/
[Observer Effect]: https://en.wikipedia.org/wiki/Observer_effect_(information_technology)
