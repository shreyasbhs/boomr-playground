# Boomerang Performance Playground

An interactive web app for learning web performance metrics and how [Boomerang](https://github.com/akamai/boomerang) measures them — with hands-on experiments.

## Quick Start

```bash
cd boomr-playground
npm install
npm start
```

Then open **http://localhost:3456** in your browser.

> **Prerequisite:** Boomerang build files must exist in `../build`. Run `grunt clean build` from the repo root if needed.

## What's Inside

### Scenarios

| Scenario | What You Learn |
|----------|---------------|
| **Page Load Timing** | `t_done`, `t_resp`, `t_page` — slow server vs heavy DOM |
| **Navigation Timing** | Full `nt_*` waterfall — DNS, TCP, SSL, TTFB, DOM processing |
| **Paint Timing** | First Paint, First Contentful Paint, Largest Contentful Paint |
| **Resource Timing** | Resource waterfall, `restiming` compression |
| **Largest Contentful Paint** | LCP candidates — text, images, background images |
| **FID & INP** | Main thread blocking, interaction responsiveness |
| **Long Tasks** | Blocking time, Total Blocking Time calculation |
| **XHR & Fetch** | Instrumented network requests, error tracking |
| **SPA Navigation** | Soft navigation via History API |
| **Error Tracking** | JS errors, promise rejections, XHR failures |
| **Network & Bandwidth** | Network Information API, download speed |

### Configurable Server Endpoints

| Endpoint | Params | Purpose |
|----------|--------|---------|
| `/api/slow` | `?delay=2000` | Delayed response (simulates slow TTFB) |
| `/api/large` | `?size=500` | Large payload in KB |
| `/api/error` | `?status=500` | HTTP error responses |
| `/api/redirect` | `?hops=3` | Redirect chains |
| `/api/stream` | `?chunks=5&interval=500` | Streaming/chunked response |
| `/api/image` | `?delay=1000&width=400&height=300&color=ff0000` | Dynamic SVG images |
| `/api/spa-page/:page` | `?delay=200` | SPA page content |

### Beacon Inspector

The right panel shows **live beacon data** from Boomerang, organized by metric category:
- Timing (t_done, t_page, t_resp)
- Navigation Timing (nt_*)
- Paint Timing (pt.*)
- Event Timing (et.*)
- Resource Timing
- Memory & DOM
- Network info
- Session data

## Architecture

```
boomr-playground/
├── server.js              # Express server with simulation endpoints
├── package.json
├── public/
│   ├── index.html         # Main SPA shell
│   ├── css/style.css      # Dark-theme UI
│   └── js/
│       ├── app.js          # Navigation + interactive handlers
│       ├── scenarios.js    # Scenario content & descriptions
│       └── beacon-inspector.js  # Live beacon display
```

## Port

Default: `3456`. Override with `PORT` env variable:

```bash
PORT=8080 npm start
```

## Boomerang Build Mode (Debug vs Minified)

This app loads Boomerang dynamically from `/api/runtime-config` and supports choosing debug or minified builds:

- Environment default (recommended for hosting):

```bash
BOOMERANG_VARIANT=min npm start
```

- Force debug build:

```bash
BOOMERANG_VARIANT=debug npm start
```

- Per-request override via query param:

```text
http://localhost:3456/?boomr=debug
http://localhost:3456/?boomr=min
http://localhost:3456/?boomr=edge
```

Edge-injected mode (no local Boomerang script tag in app HTML):

```bash
BOOMERANG_VARIANT=edge npm start
```

Use this when Akamai Edge injects the Boomerang loader snippet for you. In `edge` mode, the app does not include any Boomerang file and waits for injected `BOOMR` to appear.

The prerender target pages (`/prerender/*`) also honor the same `?boomr=...` override.
