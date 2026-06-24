# Tutorial Examples

Runnable sandboxes for the lessons. Most pages reference Boomerang's **source**
files directly (`../../boomerang.js`, `../../plugins/*.js`) so you don't need to
build anything first.

## Two ways to run

### A. Static server from the repo root (lessons 1–9, 11, 12)

Relative‑path examples work when the **repository root** is served over HTTP.
From the repo root:

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open, e.g.:

```
http://localhost:3000/boomerang%20tutorial/examples/01-basic.html
```

Open DevTools → **Console** (beacon contents) and **Network** filtered to
`beacon` (the request). The `/beacon` endpoint will 404 — that's fine, you can
still see the data and the request attempt.

> Opening the files via `file://` partly works, but some browser APIs
> (PaintTiming, ResourceTiming) behave better over `http://`.

### B. Node beacon servers (lessons 10 & 13)

These come with a tiny Node server that both serves the page **and** receives the
beacons, printing them to the terminal:

```bash
# Lesson 10
node "examples/10-server/server.js"     # http://localhost:3000/

# Lesson 13 capstone
node "examples/13-capstone/server.js"   # http://localhost:3001/  (+ /report)
```

## Files

| Path | Lesson |
|------|--------|
| `01-basic.html` | 2 — synchronous include |
| `03-async.html` | 3 — async loading |
| `05-api.html` | 5 — core API & beacon |
| `06-rt-timers.html` | 6 — RT custom timers |
| `07-timing.html` | 7 — NavigationTiming / PaintTiming / ResourceTiming |
| `08-spa.html` | 8 — XHR & SPA |
| `09-custom.html` | 9 — errors & custom data |
| `10-server/` | 10 — beacon receiver |
| `11-plugin/` | 11 — custom plugin |
| `12-consent.html` | 12 — opt‑in / opt‑out (stubbed) |
| `13-capstone/` | 13 — full capstone |
