# Lesson 7 — Browser Timing Plugins

**Goal:** Use the three big "browser API" plugins — **NavigationTiming**,
**PaintTiming**, and **ResourceTiming** — to capture detailed, modern performance
data.

## Concepts

These plugins surface standard browser Performance APIs onto the beacon. Each is
independent; include the ones you want in your build (Lesson 4).

### NavigationTiming (`plugins/navtiming.js`)

Captures the [NavigationTiming] API: high‑resolution timestamps for each phase of
the navigation. These appear on the beacon prefixed with `nt_`:

| Param | Phase |
|-------|-------|
| `nt_nav_st` | `navigationStart` |
| `nt_dns_st` / `nt_dns_end` | DNS lookup |
| `nt_con_st` / `nt_con_end` | TCP connect |
| `nt_req_st` | Request start |
| `nt_res_st` / `nt_res_end` | Response start / end |
| `nt_domint` | DOM interactive |
| `nt_domcontloaded_st` / `_end` | `DOMContentLoaded` |
| `nt_domcomp` | DOM complete |
| `nt_load_st` / `nt_load_end` | `load` event |

From these you can reconstruct exactly where time went (DNS vs connect vs server
vs DOM). RT uses the same data for `t_done`/`t_resp`.

### PaintTiming (`plugins/painttiming.js`)

Captures user‑perceived rendering milestones:

| Param | Metric |
|-------|--------|
| `pt.fp` | First Paint |
| `pt.fcp` | **First Contentful Paint (FCP)** |
| `pt.lcp` | **Largest Contentful Paint (LCP)** |

FCP and LCP are core "does the page *feel* loaded" metrics — far more meaningful
to users than raw `onload`. Available only in browsers that implement the Paint
Timing / LCP APIs.

### ResourceTiming (`plugins/restiming.js`)

Captures the [ResourceTiming] entries for **every resource** the page loaded
(scripts, images, CSS, fonts, XHRs…), letting you reconstruct the **waterfall**
on the server side. Because this can be large, the data is **compressed** into a
single `restiming` beacon parameter (which is why the `compression` plugin is
often bundled with it).

Useful config:

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  ResourceTiming: {
    enabled: true,
    clearOnBeacon: true,     // call performance.clearResourceTimings() after each beacon
    trimUrls: ["https://www.example.com"]  // shorten URLs to save bytes
  }
});
```

> **Buffer full?** The browser's ResourceTiming buffer is finite (often 150–250
> entries). On busy pages it can fill before Boomerang reads it, dropping
> resources. See `doc/howtos/howto-resourcetiming-buffer.md`. Setting
> `clearOnBeacon: true` (or raising the buffer with
> `performance.setResourceTimingBufferSize(...)`) mitigates this.

### Related newer plugins

* **EventTiming** (`plugins/eventtiming.js`) — input responsiveness, including
  **First Input Delay (FID)**.
* **Continuity** (`plugins/continuity.js`, "cutting‑edge" flavor) — rich UX
  metrics: **Time to Interactive (TTI)**, **Cumulative Layout Shift (CLS)**,
  long tasks, frame rate, rage/dead clicks, and more.

## Example

See [`examples/07-timing.html`](./examples/07-timing.html). It loads RT +
NavigationTiming + PaintTiming + ResourceTiming + compression and prints the
interesting fields:

```javascript
BOOMR.subscribe("before_beacon", function (data) {
  console.log("FCP:", data["pt.fcp"], "LCP:", data["pt.lcp"]);
  console.log("DNS:", data.nt_dns_end - data.nt_dns_st, "ms");
  console.log("restiming bytes:", (data.restiming || "").length);
});

BOOMR.init({
  beacon_url: "/beacon",
  autorun: true,
  ResourceTiming: { enabled: true, clearOnBeacon: true }
});
```

## Exercise

1. On the example page, compute and log the **TCP connect** time
   (`nt_con_end − nt_con_st`) and the **server response** time
   (`nt_res_st − nt_req_st`).
2. Add several `<img>` tags to the page, reload, and watch the `restiming`
   parameter grow. Confirm those images appear (decompress mentally or just note
   the size increase).
3. Compare `pt.fcp` with `t_done`. Which is smaller, and why does that matter for
   how users perceive your page?

## Solution / hints

* `nt_res_st − nt_req_st` is essentially Time To First Byte (TTFB) — a good proxy
  for backend latency.
* `restiming` is compressed (Boomerang's "optimized" format), so it won't read as
  plain URLs; the point of the exercise is to see it *grow* with more resources.
  Backend tooling decodes it into the full waterfall.
* `pt.fcp` is usually **smaller** than `t_done`: users often see meaningful
  content well before `onload`. Optimizing for FCP/LCP improves *perceived*
  speed even when total load time is unchanged.
* No `pt.*` values? Your browser may not support Paint Timing, or you opened the
  file via `file://` with restrictions — serve over `http://` (any static server)
  for best results.

➡ Next: [Lesson 8 — XHR & Single Page Apps](./lesson-08-xhr-and-spa.md)

[NavigationTiming]: https://www.w3.org/TR/navigation-timing/
[ResourceTiming]: https://www.w3.org/TR/resource-timing-1/
