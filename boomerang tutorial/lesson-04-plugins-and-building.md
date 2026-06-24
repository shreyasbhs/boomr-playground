# Lesson 4 — Plugins & Building Boomerang

**Goal:** Understand the plugin architecture, choose the right plugins, and
produce a deployable bundle with Grunt.

## Concepts

### Architecture: core + plugins

Boomerang is split into:

* **`boomerang.js`** — the core framework: configuration, the event system, var
  management, and beacon sending. On its own it does nothing measurable.
* **`plugins/*.js`** — each plugin adds one capability (page‑load timing, errors,
  resource timing, SPA support, …). You bundle the ones you need.

### `plugins.json` — what gets built

The build reads `plugins.json` at the repo root. Its top‑level `"plugins": []`
array lists every plugin included in a **full** build, **in load order**:

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
    "plugins/errors.js"
    // ... many more ...
  ]
}
```

> Want a custom set without editing the tracked file? Create a
> **`plugins.user.json`** — if present it is used *instead of* `plugins.json` and
> is git‑ignored.

### Build "flavors"

`plugins.json` also defines `"flavors"` — named bundles for common needs. From
this repo:

| Flavor | Purpose |
|--------|---------|
| `minimal` | Smallest useful mPulse build |
| `default` | Minimal + ResourceTiming |
| `default-errors` | Default + error tracking |
| `default-spa` | Default + Single Page App support |
| `default-spa-errors` | Default + SPA + errors |
| `cutting-edge` | Adds the Continuity (UX) metrics |
| `cutting-edge-errors` / `cutting-edge-spa` | …with errors / SPA |

### Which plugins do I actually need?

From `doc/building.md`, the recommendations are:

* **Traditional website (minimum):**
  * `RT` — round‑trip / page load timing (**required to fire a beacon**)
  * `NavigationTiming` — detailed navigation phases
* **Add for richer data:** `PaintTiming`, `ResourceTiming`, `Memory`, `Errors`.
* **Single Page App, additionally:**
  * `AutoXHR` — tracks `XMLHttpRequest`s and interactions
  * `SPA` — required base for SPA measurement
  * `History` — React / `window.history` (and Angular/Backbone/Ember) support

A short description of every plugin lives in `doc/building.md`.

### Building with Grunt

The build bundles `boomerang.js` + the listed plugins (in order) into
`build/boomerang-<version>.min.js`.

```bash
# one‑time: install the Grunt CLI globally
npm install -g grunt-cli

# install project deps
npm install

# clean previous output and build everything in plugins.json
grunt clean build
```

Main targets:

* `clean` — empties `build/`
* `build` — builds a fresh bundle
* `lint` — runs lint over the project
* `test` — runs the test suite

Build a specific flavor and version:

```bash
grunt clean build --build-flavor=minimal --build-number=1000
```

This produces a bundle whose revision matches the flavor (e.g. `1.1000.10` for
`minimal`). Versioning follows **SemVer** `major.minor.revision`; `major` comes
from `releaseVersion` in `package.json`, `minor` from `--build-number`, and
`revision` from `--build-revision` (or the flavor's `revision`).

## Example

Try a minimal build from the repo root:

```bash
grunt clean build --build-flavor=minimal
ls build/
```

You should see a `boomerang-*.js` (debug) and `boomerang-*.min.js` (minified)
plus source maps. The `.min.js` is what you deploy and reference from the loader
snippet's `BOOMR.url` (Lesson 3).

## Exercise

1. Create a `plugins.user.json` containing only the plugins for a **traditional
   site with errors and resource timing**: `config-override`, `page-params`,
   `rt`, `navtiming`, `restiming`, `painttiming`, `errors`, plus
   `compression`.
2. Run `grunt clean build` and confirm a new bundle appears in `build/`.
3. Compare its file size to a full build. (Fewer plugins → smaller, faster.)

## Solution / hints

`plugins.user.json`:

```json
{
  "plugins": [
    "plugins/config-override.js",
    "plugins/page-params.js",
    "plugins/rt.js",
    "plugins/navtiming.js",
    "plugins/restiming.js",
    "plugins/painttiming.js",
    "plugins/compression.js",
    "plugins/errors.js"
  ]
}
```

* `config-override` and `page-params` are commonly included first; `compression`
  lets data‑heavy plugins (like ResourceTiming) compress their payload.
* If `grunt` isn't found, you skipped `npm install -g grunt-cli`. You can also use
  the local binary: `./node_modules/.bin/grunt clean build`.
* Remember to **delete `plugins.user.json`** afterward if you want the default
  full build back, since it overrides `plugins.json` whenever present.

➡ Next: [Lesson 5 — Core BOOMR API & the beacon](./lesson-05-core-api-and-beacon.md)
