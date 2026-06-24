# Lesson 3 — Loading Boomerang Asynchronously

**Goal:** Understand *why* and *how* to load Boomerang without blocking your
page, using the official loader snippet.

## Concepts

### Why async?

A normal `<script src="boomerang.js"></script>` is **render/onload blocking**: if
that file is slow to download, your page's `onload` is delayed — and now your
performance‑measuring tool has *hurt* performance (the Observer Effect again).

Loading asynchronously ensures that **even if `boomerang.js` is unavailable or
slow, your host page is not affected.**

### Three async strategies (from least to most safe)

1. **Plain async script in the document** — simple, but still blocks `onload` on
   most browsers.
2. **Preload `<link rel="preload">`** — modern browsers fetch the script without
   blocking, then execute it.
3. **IFRAME loader** — load Boomerang inside a hidden `about:blank` iframe so it
   is fully isolated from the host page's `onload`.

The official **loader snippet** does all of this for you: it tries Preload first,
falls back to the IFRAME method, and falls back again to a plain script tag for
ancient IE. You can find it in `snippets/loader-snippet.js` and in the project
`README.md`.

### The loader snippet

Place this near the **top** of your HTML `<head>`. Set `BOOMR.url` to the URL of
your built Boomerang file:

```html
<script>
(function() {
  // Boomerang Loader Snippet
  if (window.BOOMR && (window.BOOMR.version || window.BOOMR.snippetExecuted)) {
    return;
  }
  window.BOOMR = window.BOOMR || {};
  window.BOOMR.snippetStart = new Date().getTime();
  window.BOOMR.snippetExecuted = true;

  // NOTE: Set your built Boomerang URL here
  window.BOOMR.url = "https://your-cdn.example.com/boomerang-1.815.0.min.js";

  var where = document.currentScript || document.getElementsByTagName("script")[0],
      parentNode = where.parentNode,
      promoted = false,
      LOADER_TIMEOUT = 3000;

  // ... (Preload + IFRAME fallback logic — see snippets/loader-snippet.js) ...
})();
</script>
```

> Use the **full** snippet from `snippets/loader-snippet.js` (or the minified one
> in the README) in real projects — the block above is abbreviated to show the
> shape.

### Two important details

* **Script `id` matters.** The injected script must have id `boomr-if-as`
  (IFRAME mode) or `boomr-scr-as` (Preload mode). Boomerang looks for those ids
  to detect that it is running inside the loader and to find its own URL. The
  snippet sets these for you — don't change them.
* **`BOOMR` is still exported to the parent window** even when Boomerang runs
  inside the loader iframe, so the rest of your code (e.g. `BOOMR.addVar(...)`)
  works unchanged.

### Knowing when Boomerang has loaded

Because loading is async, you don't know exactly when `BOOMR` is ready. Subscribe
to the `onBoomerangLoaded` custom event on `document`:

```javascript
document.addEventListener("onBoomerangLoaded", function (e) {
  // e.detail.BOOMR is the BOOMR global
  e.detail.BOOMR.addVar("loaded_via", "async");
});
```

Boomerang also fires `onBeforeBoomerangBeacon` and `onBoomerangBeacon` events on
`document` just before and during beaconing.

### Where do I still call `BOOMR.init()`?

With async loading you typically bundle your `BOOMR.init({...})` call **into the
build** as a final plugin (the sample is `plugins/zzz-last-plugin.js`), so it
runs automatically once the async Boomerang loads. Alternatively, call it inside
the `onBoomerangLoaded` handler above.

## Example

See [`examples/03-async.html`](./examples/03-async.html). It uses a trimmed
loader that points at the repo's source `boomerang.js` and logs when Boomerang is
ready and when each beacon fires. Open DevTools → Console.

## Exercise

1. Open `examples/03-async.html` and confirm in the console that the page's own
   `load` event is **not** delayed by Boomerang (the "page load fired" log should
   appear promptly even if you throttle the network in DevTools).
2. In DevTools → Network, throttle to "Slow 3G" and reload. Notice the page is
   interactive while Boomerang is still loading.
3. Add a `document.addEventListener("onBoomerangLoaded", ...)` handler that calls
   `BOOMR.addVar("snippet_method", BOOMR.snippetMethod)` and inspect which method
   was used (`p` = preload, `i`/`if` = iframe, `s` = script).

## Solution / hints

* `BOOMR.snippetMethod` is set by the loader to record how it loaded:
  `"p"` (preload), `"i"`/`"if"` (iframe), `"s"` (script fallback).
* The whole point of the exercise: with async loading, the host page's `load`
  event does not wait for Boomerang. Under throttling you can clearly see the gap.
* In production, host the **built** `boomerang-<version>.min.js` on a CDN with a
  far‑future `max-age` cache header — the versioned file never changes.

➡ Next: [Lesson 4 — Plugins & building](./lesson-04-plugins-and-building.md)
