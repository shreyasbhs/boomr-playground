# Lesson 2 — Getting Started (Synchronous Include)

**Goal:** Put Boomerang on a page the simplest possible way and watch your first
beacon fire in the browser.

## Concepts

The simplest way to use Boomerang is the **synchronous** method: include
`boomerang.js` and one or more plugins as plain `<script>` tags, then call
`BOOMR.init()`.

```html
<script src="boomerang.js"></script>
<script src="plugins/rt.js"></script>
<!-- any other plugins you want -->
<script>
  BOOMR.init({
    beacon_url: "http://yoursite.com/beacon/"
  });
</script>
```

Three rules to remember:

1. **Load `boomerang.js` first**, then plugins. The core defines the `BOOMR`
   global that plugins attach themselves to.
2. **You must include at least one plugin** (it doesn't have to be `RT`) or the
   beacon will never fire. Boomerang needs *something* that decides "measurement
   is complete, send the beacon."
3. **Configure `beacon_url`** — where the data is sent. Each plugin can also take
   its own config inside the same `BOOMR.init()` object:

```javascript
BOOMR.init({
  beacon_url: "http://yoursite.com/beacon/",
  ResourceTiming: {
    enabled: true,
    clearOnBeacon: true
  }
});
```

> The synchronous method is the easiest to learn with, but for production the
> **asynchronous** method (Lesson 3) is recommended because it can't block your
> page load.

## Where do `boomerang.js` and `plugins/*.js` come from?

In this repository they are the source files in the root and `plugins/`
directories. In production you normally ship a single **built** bundle (Lesson
4) instead of many separate files. For learning, the raw source files work fine.

## Example: a self‑contained page (no backend needed)

You don't need a real beacon server to *see* beacons — Boomerang sends them as
requests you can watch in DevTools. The included sandbox uses a fake beacon URL
and lets you read the data with the `before_beacon` event.

Open [`examples/01-basic.html`](./examples/01-basic.html) directly in a browser
(or serve the repo with any static server), then open DevTools → **Console** to
see the beacon contents, and DevTools → **Network** (filter: `beacon`) to see the
beacon request itself.

Key part of that file:

```html
<script src="../../boomerang.js"></script>
<script src="../../plugins/rt.js"></script>
<script src="../../plugins/navtiming.js"></script>
<script>
  // Log every beacon to the console before it is sent
  BOOMR.subscribe("before_beacon", function (data) {
    console.log("Beacon about to be sent:", data);
  });

  BOOMR.init({
    // A harmless endpoint; the request will 404/empty but you can see it fire
    beacon_url: "/beacon",
    // Send the beacon as soon as the page is ready (good for demos)
    autorun: true
  });
</script>
```

When the page finishes loading you'll see a console object containing fields like
`t_done` (page load time in ms), `u` (the page URL), `rt.start`, and more. That
object *is* the beacon.

## Exercise

1. Copy `examples/01-basic.html` to `examples/01-exercise.html`.
2. Add the **Memory** plugin (`plugins/memory.js`) to the page.
3. Reload and find the new memory‑related fields on the beacon (hint: they start
   with `dom.` and `mem.`).
4. Bonus: add `plugins/painttiming.js` and look for `pt.fcp` (First Contentful
   Paint) on the beacon.

## Solution / hints

* Add the script tag **after** `boomerang.js` but it can go before or after other
  plugins — order among plugins rarely matters for the basics:

  ```html
  <script src="../../plugins/memory.js"></script>
  ```

* The Memory plugin adds DOM counts (`dom.ln` = number of nodes, `dom.img` =
  images, `dom.script` = scripts, `dom.sz` = HTML size) and, in supporting
  browsers, JS heap usage (`mem.total`, `mem.used`, `mem.limit`).
* `pt.fcp` only appears in browsers that support the Paint Timing API and only
  once a contentful paint has happened.
* If **no** beacon fires, check the console for errors and confirm at least one
  plugin (RT) loaded *after* `boomerang.js`.

➡ Next: [Lesson 3 — Loading asynchronously](./lesson-03-async-loading.md)
