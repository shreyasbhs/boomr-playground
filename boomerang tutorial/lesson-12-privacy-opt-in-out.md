# Lesson 12 — Privacy: Opt‑In / Opt‑Out

**Goal:** Make Boomerang comply with privacy regulations (GDPR, CCPA) using
consent‑driven opt‑in and opt‑out.

> **Disclaimer:** This lesson is educational, not legal advice. Because Boomerang
> sets cookies, it may be treated as "cookie technology" subject to data
> protection law. Consult a lawyer for your specific situation.

## Concepts

Different jurisdictions require different consent models:

* **Opt‑out** (e.g. CCPA) — you may load Boomerang and send data by default, but
  must stop when the user requests it.
* **Opt‑in** (e.g. GDPR) — you must obtain freely‑given, specific, informed
  consent *before* collecting/sending data.

### Cookies Boomerang uses

| Cookie | Lifetime | Purpose |
|--------|----------|---------|
| `RT` | 7 days | Session info: pages visited, session start, last URL (no PII) |
| `BA` | 7 days | Bandwidth plugin (no PII) |
| `BOOMR_CONSENT` | 1 year | Records the visitor's opt‑in / opt‑out choice |

### The Consent Inlined Plugin

Boomerang ships a special **Consent Inlined Plugin** (`ConsentInlinedPlugin`)
that is **injected *before* the loader snippet** (it is not part of the normal
build). It exposes two global helpers:

* `window.BOOMR_OPT_OUT()` — stop sending beacons, delete `RT` and `BA` cookies,
  and set `BOOMR_CONSENT=opted-out`.
* `window.BOOMR_OPT_IN()` — allow sending; set `BOOMR_CONSENT=opted-in`.

The `BOOMR_CONSENT` cookie lets Boomerang remember the choice across page
navigations.

### Three scenarios

**1. Opt‑out allowed** (collect by default, stop on request):

```html
<script>
  window.BOOMR_CONSENT_CONFIG = { enabled: true };
</script>
<script>/* minified Consent Inlined Plugin code here */</script>
<!-- then the Boomerang loader snippet -->
```

Call `window.BOOMR_OPT_OUT()` from your cookie‑banner's "deny" handler.

**2. Opt‑in required, Boomerang loaded but silent until consent:**

```html
<script>
  window.BOOMR_CONSENT_CONFIG = { enabled: true, optInRequired: true };
</script>
<script>/* minified Consent Inlined Plugin code here */</script>
<!-- then the Boomerang loader snippet -->
```

Boomerang loads but **holds beacons** until `window.BOOMR_OPT_IN()` is called.
The first beacon after opt‑in carries `cip.in` and `cip.v` (consent plugin
version) params.

**3. Opt‑in required, don't even load Boomerang until consent** — wrap the loader
snippet in a function and only call it after consent:

```html
<script>
  var BOOMERANG_LOADER_SNIPPET_WRAPPER = function () {
    (function () {
      // ... full Boomerang loader snippet ...
    })();
  };
  function onOptIn() {
    BOOMERANG_LOADER_SNIPPET_WRAPPER();  // load Boomerang only now
  }
</script>
```

### Wiring to a consent library (Osano example)

```javascript
function onCookieConsentChange(consent) {
  if (consent === "deny")  { window.BOOMR_OPT_OUT(); }
  if (consent === "allow") { window.BOOMR_OPT_IN(); }
}

window.addEventListener("load", function () {
  window.cookieconsent.initialise({
    type: "opt-in",
    content: { href: "https://www.example.com/policies/" },
    onInitialise: onCookieConsentChange,
    onStatusChange: onCookieConsentChange,
    onRevokeChoice: onCookieConsentChange
  });
});
```

## Example

See [`examples/12-consent.html`](./examples/12-consent.html). It simulates a
consent banner with **Opt‑in** and **Opt‑out** buttons and a stub of the consent
helpers, logging cookie and beacon state so you can watch the behavior change.

> The real `ConsentInlinedPlugin` minified code isn't bundled into the open build
> — the example **stubs** `BOOMR_OPT_IN`/`BOOMR_OPT_OUT` so you can follow the
> flow without it. In production, inject the real plugin (see
> `doc/howtos/howto-opt-out-or-opt-in.md`).

## Exercise

1. In `examples/12-consent.html`, start in **opt‑in‑required** mode: confirm no
   beacon is logged until you click **Opt In**.
2. After opt‑in, reload the page and confirm the `BOOMR_CONSENT=opted-in` cookie
   makes data flow without re‑prompting.
3. Click **Opt Out** and verify (a) beacons stop, and (b) the `RT`/`BA` cookies
   are cleared while `BOOMR_CONSENT=opted-out` is set.

## Solution / hints

* The `BOOMR_CONSENT` cookie is what carries the decision between page loads — on
  the next page, the Consent plugin reads it and resumes the prior choice without
  re‑asking.
* In **opt‑in‑required** mode, beacons are *held*, not lost — they flush after
  `BOOMR_OPT_IN()`. The first one is tagged with `cip.in`/`cip.v`.
* If you must guarantee Boomerang never even *loads* before consent (strictest
  GDPR reading), use scenario 3 (wrap the loader snippet) rather than scenario 2.

➡ Next: [Lesson 13 — Capstone project](./lesson-13-capstone-project.md)
