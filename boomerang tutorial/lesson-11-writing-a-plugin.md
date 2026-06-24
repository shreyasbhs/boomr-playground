# Lesson 11 — Writing Your Own Plugin

**Goal:** Build a custom Boomerang plugin from the official skeleton, understand
the plugin lifecycle, and add it to a build.

## Concepts

Plugins are how *all* measurement is added to Boomerang — including your own
site‑specific needs. A plugin is a self‑contained IIFE that attaches an object to
`BOOMR.plugins`.

### The plugin contract

Every plugin object should provide:

* **`init(config)`** — called by `BOOMR.init()`. Read your config, subscribe to
  events, set things up. Must return `this`. **`init` may be called more than
  once** (re‑configuration), so guard one‑time setup with a flag.
* **`is_complete()`** — return `true` when your plugin has finished its work and
  it's OK to send the beacon. Returning `false` can hold the beacon back until
  you're ready.

### The official skeleton

From `doc/creating-plugins.md`:

```javascript
/**
 * Skeleton template for all boomerang plugins.
 */
(function () {
  // Make sure BOOMR is defined — your plugin might load before boomerang.js
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  // Private state — the recommended way to encapsulate internals
  var impl = {
    complete: false,
    myOption: "default"
  };

  BOOMR.plugins.MyPlugin = {
    init: function (config) {
      // List user-configurable properties and import them from config
      var properties = ["myOption"];
      BOOMR.utils.pluginConfig(impl, config, "MyPlugin", properties);

      // Subscribe to BOOMR events here (do this only once)
      if (!impl.initialized) {
        BOOMR.subscribe("page_ready", this.onPageReady, null, this);
        impl.initialized = true;
      }

      return this;
    },

    onPageReady: function () {
      // Do measurement, add data to the beacon
      BOOMR.addVar("myplugin.hello", "world");
      impl.complete = true;
    },

    is_complete: function () {
      // Return true when it's OK to send the beacon
      return impl.complete;
    }
  };
}());
```

### Lifecycle, step by step

1. The script loads and registers `BOOMR.plugins.MyPlugin`.
2. `BOOMR.init(config)` calls every plugin's `init`, passing the same `config`.
   Your plugin reads `config.MyPlugin` via `BOOMR.utils.pluginConfig`.
3. You subscribe to events (`page_ready`, `before_beacon`, `xhr_load`, …).
4. When the page is ready, Boomerang checks each plugin's `is_complete()`. The
   beacon is sent once all plugins report complete.
5. On `before_beacon`, all currently‑set vars (yours included via `addVar`) are
   serialized onto the beacon.

### Handy `BOOMR.utils` helpers

* `BOOMR.utils.pluginConfig(impl, config, "Name", props)` — copies named config
  props into your `impl`, returns `true` if config existed.
* `BOOMR.utils.addListener` / `removeListener` — cross‑browser event binding.
* `BOOMR.utils.getCookie` / `setCookie` — session cookies.
* `BOOMR.utils.cleanupURL`, `BOOMR.utils.hashQueryString` — URL helpers.
* `BOOMR.now()` — high‑res timestamp.

### Holding the beacon back

If your plugin measures something asynchronous that must be on the page‑load
beacon, return `false` from `is_complete()` until done, then call
`BOOMR.sendBeacon()` (or simply flip your flag and let RT proceed). Be careful —
never block the beacon forever, or nothing gets reported.

## Example

A complete, self‑contained plugin that records the page's color scheme and how
many `<img>` elements it has. See
[`examples/11-plugin/boomerang.scheme-plugin.js`](./examples/11-plugin/boomerang.scheme-plugin.js)
and [`examples/11-plugin/11-plugin.html`](./examples/11-plugin/11-plugin.html).

```javascript
(function () {
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};
  if (BOOMR.plugins.PageInfo) { return; }

  var impl = { complete: false, prefix: "pi" };

  BOOMR.plugins.PageInfo = {
    init: function (config) {
      BOOMR.utils.pluginConfig(impl, config, "PageInfo", ["prefix"]);

      if (!impl.initialized) {
        BOOMR.subscribe("page_ready", impl.onPageReady, null, impl);
        impl.initialized = true;
      }
      return this;
    },
    is_complete: function () { return impl.complete; }
  };

  impl.onPageReady = function () {
    var scheme = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    BOOMR.addVar(impl.prefix + ".scheme", scheme);
    BOOMR.addVar(impl.prefix + ".imgs", document.images.length);
    impl.complete = true;
  };
}());
```

Enable it like any plugin:

```javascript
BOOMR.init({
  beacon_url: "/beacon",
  PageInfo: { prefix: "page" }   // -> page.scheme, page.imgs on the beacon
});
```

## Exercise

1. Extend the example plugin to also report the viewport size as
   `pi.vw` / `pi.vh` (`window.innerWidth` / `innerHeight`).
2. Make the plugin configurable so the user can disable image counting via
   `PageInfo: { countImages: false }`. (Add `"countImages"` to the properties
   list and default it in `impl`.)
3. Add your plugin to a build: append its path to `plugins.user.json`, run
   `grunt clean build`, and verify the bundle still produces beacons with your
   vars.

## Solution / hints

* Add `"countImages"` to the `pluginConfig` properties array and guard the
  `addVar` for images with `if (impl.countImages !== false) { ... }`.
* Default values live in the `impl` object (`countImages: true`); `pluginConfig`
  overwrites them only when the user supplies a value.
* For the build step, your plugin file can live anywhere referenced by
  `plugins.user.json`; the build concatenates files in listed order, so put
  framework‑dependent plugins after their dependencies.
* Always guard with `if (BOOMR.plugins.X) { return; }` and an `impl.initialized`
  flag so a double `init` doesn't double‑subscribe.

➡ Next: [Lesson 12 — Privacy: opt‑in / opt‑out](./lesson-12-privacy-opt-in-out.md)
