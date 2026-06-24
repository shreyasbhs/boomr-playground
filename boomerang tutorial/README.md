# Learn Boomerang — A Step‑by‑Step Tutorial

Welcome! This is a hands‑on course for learning **Boomerang**, the open‑source
JavaScript library for **Real User Monitoring (RUM)**. By the end you'll be able
to include Boomerang on a site, choose and build the right plugins, read the
performance data it captures, add your own custom measurements, and even write
your own plugin.

Boomerang is maintained by Akamai. This tutorial is written against the version
in this repository (`boomerang.js`, currently **v1.815.0**) and references the
real plugins in `plugins/` and docs in `doc/`.

> **boomerang always comes back, except when it hits something.**

## Who this is for

* Front‑end / full‑stack developers who want to measure how fast their pages
  feel to real users.
* Performance engineers evaluating a RUM solution.
* Anyone who wants to understand or extend the Boomerang codebase.

**Prerequisites:** comfortable with HTML and JavaScript, a little Node.js for
the build steps, and basic command‑line use.

## How to use this tutorial

Each lesson is a standalone Markdown file. Work through them in order — later
lessons build on earlier ones. Every lesson has:

* **Goal** — what you'll learn.
* **Concepts** — the theory, tied to real Boomerang APIs and files.
* **Example** — copy‑pasteable code.
* **Exercise** — something to try yourself.
* **Solution / hints** — at the end of the lesson.

A small runnable HTML sandbox is provided in [`examples/`](./examples) so you can
see beacons in your browser's DevTools Network tab without any backend.

## Lessons

| # | Lesson | What you'll learn |
|---|--------|-------------------|
| 1 | [What is RUM & Boomerang](./lesson-01-what-is-rum-and-boomerang.md) | The problem RUM solves and how Boomerang fits in |
| 2 | [Getting started — synchronous include](./lesson-02-getting-started.md) | Add Boomerang to a page and fire your first beacon |
| 3 | [Loading asynchronously](./lesson-03-async-loading.md) | The non‑blocking loader snippet and why it matters |
| 4 | [Plugins & building Boomerang](./lesson-04-plugins-and-building.md) | `plugins.json`, flavors, and `grunt clean build` |
| 5 | [Core BOOMR API & the beacon](./lesson-05-core-api-and-beacon.md) | `init`, vars, events, and the anatomy of a beacon |
| 6 | [Page load timing with RT](./lesson-06-rt-page-load-timing.md) | `t_done`, `t_resp`, `t_page` and custom timers |
| 7 | [Browser timing plugins](./lesson-07-timing-plugins.md) | NavigationTiming, PaintTiming, ResourceTiming |
| 8 | [XHR & Single Page Apps](./lesson-08-xhr-and-spa.md) | AutoXHR, SPA and History plugins |
| 9 | [Errors, custom data & custom events](./lesson-09-errors-and-custom-data.md) | `addVar`, `requestStart`, `responseEnd`, error tracking |
| 10 | [Receiving & reading beacons](./lesson-10-reading-beacons.md) | Beacon endpoints and the `before_beacon`/`beacon` events |
| 11 | [Writing your own plugin](./lesson-11-writing-a-plugin.md) | The plugin skeleton and lifecycle |
| 12 | [Privacy: opt‑in / opt‑out](./lesson-12-privacy-opt-in-out.md) | Consent and respecting user privacy |
| 13 | [Capstone project](./lesson-13-capstone-project.md) | Put it all together on a real page |

## Quick reference

* Build a deployable bundle: `grunt clean build` → output in `build/`.
* Minimum to fire a beacon: `boomerang.js` + at least one plugin (usually `RT`).
* Official docs: <https://akamai.github.io/boomerang/>
* Source: <https://github.com/akamai/boomerang>

Happy measuring! Start with [Lesson 1](./lesson-01-what-is-rum-and-boomerang.md).
