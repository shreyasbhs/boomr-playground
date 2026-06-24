# Lesson 10 — Receiving & Reading Beacons

**Goal:** Understand what happens to a beacon after it leaves the browser — how to
receive it on a server, and how to inspect/modify it in JavaScript before it's
sent.

## Concepts

Boomerang collects data; **you** decide what to do with it. The two halves are:

1. **Read it in the browser** (for debugging, last‑minute tagging, or sending
   elsewhere).
2. **Receive it on a server** (the usual production path) and analyze in
   aggregate.

### Reading beacon data in the browser

Subscribe to the `before_beacon` event to inspect — and still modify — the beacon
just before it's sent:

```javascript
BOOMR.subscribe("before_beacon", function (beaconData) {
  if (beaconData.u && beaconData.u.indexOf("/checkout") !== -1) {
    beaconData.is_checkout = 1;   // you can still add data here
  }
  console.log("Sending beacon:", beaconData);
});
```

Subscribe to the `beacon` event to react *after* a beacon is sent — typically to
clear one‑off vars:

```javascript
BOOMR.subscribe("beacon", function (beaconData) {
  BOOMR.removeVar("is_checkout");
});
```

This is also how you'd forward beacons to a second analytics system, or assert on
metrics in automated tests.

### The beacon endpoint (`beacon_url`)

`beacon_url` is an HTTP(S) endpoint that must accept beacon data **two ways**:

* **GET** — data in the query string, sent via an `<IMG>` request (works
  everywhere, size‑limited by URL length).
* **POST** — `application/x-www-form-urlencoded` body, sent via
  `XMLHttpRequest` or `navigator.sendBeacon()` (used for larger payloads like
  ResourceTiming).

Boomerang chooses automatically (`beacon_type: "AUTO"`); large beacons use POST.

A minimal Node.js receiver:

```javascript
const http = require("http");
const { parse } = require("querystring");

http.createServer((req, res) => {
  if (req.url.startsWith("/beacon")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const data = req.method === "POST"
        ? parse(body)
        : parse(req.url.split("?")[1] || "");
      console.log("Got beacon:", {
        url: data.u, t_done: data.t_done, t_resp: data.t_resp
      });
      // Respond fast & cheap — 204 No Content, no body
      res.writeHead(204);
      res.end();
    });
  } else {
    res.writeHead(404); res.end();
  }
}).listen(3000, () => console.log("Beacon server on :3000"));
```

> **Performance tip from the docs:** make the endpoint lightweight — log the
> request and immediately return **`204 No Content`**, then batch‑process the data
> offline. Don't do heavy work in the request path.

### Existing open‑source receivers

You don't have to build your own. The docs list ready‑made collectors, e.g.
**boomcatch**, **boomerang‑express**, **Basic RUM** (backoffice + beacon catcher),
the **Boomerang‑OpenTelemetry** plugin, and more.

### Protecting your beacon endpoint

From `doc/howtos/howto-read-data-from-a-beacon.md`:

* **DoS:** rate‑limit by IP at the server/OS level; respond with `204` quickly.
* **Fake beacons** (someone copied your page including your `beacon_url`):
  * Check the **Referer** header and reject foreign domains (stops the clueless
    case).
  * For determined abusers, use a **nonce/crumb**: a one‑time token you generate
    server‑side per page render, attach via `BOOMR.addVar`, and validate at the
    endpoint. Note JavaScript can't fully prevent a motivated attacker from
    replaying a valid beacon.

## Example

See [`examples/10-server/`](./examples/10-server) for a runnable beacon receiver
plus an HTML page pointed at it.

```bash
cd "boomerang tutorial/examples/10-server"
node server.js
# then open http://localhost:3000/ in your browser and watch the terminal
```

The server serves the page **and** receives its beacons, printing the key timers
to the terminal.

## Exercise

1. Run the example server and confirm you see the beacon's `t_done` printed when
   you load the page.
2. Modify the server to also log any custom var you add with `BOOMR.addVar`
   (e.g. `page_group`).
3. Add a `before_beacon` handler in the page that **rejects/aborts** sending if
   the URL contains `/private` (hint: you can't easily cancel, but you *can*
   `removeVar` sensitive fields — practice scrubbing data before send).

## Solution / hints

* All vars you add (`addVar`) arrive as ordinary query/body params — just read
  `data.page_group` in the server.
* `before_beacon` can't reliably *cancel* a beacon, but it's the right place to
  **scrub** sensitive data: delete properties off the `beaconData` object or
  `BOOMR.removeVar(...)` so they never leave the browser.
* Keep the endpoint's response a bare `204` for speed; do analysis from the logs
  asynchronously.

➡ Next: [Lesson 11 — Writing your own plugin](./lesson-11-writing-a-plugin.md)
