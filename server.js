const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3456;
const BOOMERANG_BUILD_DIR = path.join(__dirname, "..", "build");
const SPECULATION_TARGETS = [
  "/prerender/overview",
  "/prerender/metrics",
  "/prerender/network",
];

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

function getBoomerangCandidates(variant) {
  if (variant === "min") {
    return [
      "boomerang-1.0.0.min.js",
      "boomerang.min.js",
      "boomerang-1.0.0.js",
      "boomerang.js",
    ];
  }

  return [
    "boomerang-1.0.0-debug.js",
    "boomerang.debug.js",
    "boomerang-1.0.0.js",
    "boomerang.js",
  ];
}

function pickBoomerangAsset(variant) {
  const candidates = getBoomerangCandidates(variant);
  const found = candidates.find(file => fileExists(path.join(BOOMERANG_BUILD_DIR, file)));
  return found || "boomerang-1.0.0-debug.js";
}

function getRequestedVariant(req) {
  const requested = String(req.query.boomr || "").toLowerCase();
  if (requested === "debug" || requested === "min" || requested === "edge") {
    return requested;
  }

  const envVariant = String(process.env.BOOMERANG_VARIANT || "").toLowerCase();
  if (envVariant === "debug" || envVariant === "min" || envVariant === "edge") {
    return envVariant;
  }

  if (String(process.env.BOOMERANG_DEBUG || "").toLowerCase() === "true") {
    return "debug";
  }

  return "min";
}

function buildRuntimeConfig(req) {
  const variant = getRequestedVariant(req);
  const shouldLoadLocalBoomerang = variant !== "edge";
  const boomerangFile = shouldLoadLocalBoomerang ? pickBoomerangAsset(variant) : null;

  return {
    boomerangVariant: variant,
    loadLocalBoomerang: shouldLoadLocalBoomerang,
    boomerangFile,
    boomerangUrl: boomerangFile ? `/boomerang/${boomerangFile}` : null,
    speculationTargets: SPECULATION_TARGETS,
  };
}

// ─── Beacon collector ────────────────────────────────────────────────
const beacons = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Collect beacons (GET and POST)
app.get("/beacon", (req, res) => {
  const beacon = { ...req.query, _ts: Date.now() };
  beacons.push(beacon);
  if (beacons.length > 200) beacons.shift();
  res.status(204).end();
});

app.post("/beacon", (req, res) => {
  const beacon = { ...req.body, _ts: Date.now() };
  beacons.push(beacon);
  if (beacons.length > 200) beacons.shift();
  res.status(204).end();
});

// SSE stream for live beacon updates
app.get("/beacon-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let lastIndex = beacons.length;
  const interval = setInterval(() => {
    while (lastIndex < beacons.length) {
      res.write(`data: ${JSON.stringify(beacons[lastIndex])}\n\n`);
      lastIndex++;
    }
  }, 300);

  req.on("close", () => clearInterval(interval));
});

// Return recent beacons as JSON
app.get("/api/beacons", (_req, res) => {
  res.json(beacons.slice(-50));
});

app.get("/api/runtime-config", (req, res) => {
  res.json(buildRuntimeConfig(req));
});

// ─── Configurable simulation endpoints ───────────────────────────────

// Delayed response — simulates slow TTFB
// Usage: /api/slow?delay=2000
app.get("/api/slow", (req, res) => {
  const delay = Math.min(parseInt(req.query.delay, 10) || 1000, 30000);
  setTimeout(() => {
    res.json({ ok: true, delay, message: `Response delayed by ${delay}ms` });
  }, delay);
});

// Large payload — simulates large document / API response
// Usage: /api/large?size=500 (KB)
app.get("/api/large", (req, res) => {
  const sizeKB = Math.min(parseInt(req.query.size, 10) || 100, 5000);
  const chunk = "x".repeat(1024);
  const body = [];
  for (let i = 0; i < sizeKB; i++) body.push(chunk);
  res.json({ ok: true, sizeKB, payload: body.join("") });
});

// Error endpoint — simulates server errors
// Usage: /api/error?status=500
app.get("/api/error", (req, res) => {
  const status = parseInt(req.query.status, 10) || 500;
  res.status(status).json({ error: true, status, message: `Simulated ${status} error` });
});

// Redirect chain — simulates redirects
// Usage: /api/redirect?hops=3
app.get("/api/redirect", (req, res) => {
  const hops = Math.min(parseInt(req.query.hops, 10) || 1, 10);
  if (hops > 1) {
    res.redirect(302, `/api/redirect?hops=${hops - 1}`);
  } else {
    res.json({ ok: true, message: "Final destination after redirects" });
  }
});

// Chunked / streaming response — simulates slow transfer
// Usage: /api/stream?chunks=5&interval=500
app.get("/api/stream", (req, res) => {
  const chunks = Math.min(parseInt(req.query.chunks, 10) || 5, 20);
  const interval = Math.min(parseInt(req.query.interval, 10) || 500, 5000);
  res.setHeader("Content-Type", "text/plain");
  let sent = 0;
  const timer = setInterval(() => {
    res.write(`Chunk ${++sent} of ${chunks}\n`);
    if (sent >= chunks) {
      clearInterval(timer);
      res.end();
    }
  }, interval);
});

// Image endpoint — returns a dynamically generated image with optional delay
// Usage: /api/image?delay=1000&width=400&height=300
app.get("/api/image", (req, res) => {
  const delay = Math.min(parseInt(req.query.delay, 10) || 0, 30000);
  const w = parseInt(req.query.width, 10) || 200;
  const h = parseInt(req.query.height, 10) || 200;
  const color = req.query.color || "4f46e5";

  // Generate a simple SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#${color}"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="white"
          text-anchor="middle" dominant-baseline="middle">${w}x${h} (${delay}ms)</text>
  </svg>`;

  setTimeout(() => {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store");
    res.send(svg);
  }, delay);
});

// SPA data endpoint — returns page content for simulated SPA navigation
app.get("/api/spa-page/:page", (req, res) => {
  const delay = Math.min(parseInt(req.query.delay, 10) || 200, 10000);
  const pages = {
    home: { title: "Home", content: "Welcome to the SPA playground." },
    about: { title: "About", content: "This is the about page loaded via XHR." },
    dashboard: { title: "Dashboard", content: "Dashboard with performance data." },
    settings: { title: "Settings", content: "Application settings page." },
  };
  const page = pages[req.params.page] || { title: "Unknown", content: "Page not found." };
  setTimeout(() => res.json(page), delay);
});

function renderPrerenderPage(pageName, runtimeConfig) {
  const prettyName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  const localBoomerangScript = runtimeConfig.loadLocalBoomerang && runtimeConfig.boomerangUrl
    ? `<script src="${runtimeConfig.boomerangUrl}"></script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prerender Target: ${prettyName}</title>
  <style>
    :root {
      --bg: #0f1117;
      --bg-card: #1c1f2e;
      --border: #2a2d3e;
      --text: #e1e4ed;
      --muted: #8b8fa3;
      --accent: #6366f1;
      --ok: #22c55e;
    }
    body {
      margin: 0;
      padding: 28px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    h1 { margin: 0 0 6px; }
    p { color: var(--muted); }
    .card {
      margin-top: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .row { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--border); padding: 6px 0; }
    .row:last-child { border-bottom: none; }
    .k { color: var(--muted); font-family: Menlo, Monaco, monospace; }
    .v { color: var(--ok); font-family: Menlo, Monaco, monospace; }
    .links { margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap; }
    a {
      color: var(--text);
      text-decoration: none;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      background: #141824;
    }
    a:hover { border-color: var(--accent); color: #a9b0ff; }
  </style>
</head>
<body>
  <h1>Prerender Target: ${prettyName}</h1>
  <p>This page is a speculation-rules prerender destination. Use these values to verify activation behavior.</p>

  <div class="card">
    <div class="row"><span class="k">document.prerendering</span><span class="v" id="diag-prerendering">-</span></div>
    <div class="row"><span class="k">visibilityState</span><span class="v" id="diag-visibility">-</span></div>
    <div class="row"><span class="k">activationStart</span><span class="v" id="diag-activation">-</span></div>
    <div class="row"><span class="k">navigation.type</span><span class="v" id="diag-nav-type">-</span></div>
  </div>

  <div class="links">
    <a href="/">Back to Playground</a>
    <a href="/prerender/overview">Overview</a>
    <a href="/prerender/metrics">Metrics</a>
    <a href="/prerender/network">Network</a>
  </div>

  <script>
    window.BOOMR_mq = window.BOOMR_mq || [];
  </script>
  ${localBoomerangScript}
  <script>
    (function () {
      var initialized = false;

      function initIfAvailable() {
        if (initialized || !window.BOOMR) return false;
        BOOMR.init({
          beacon_url: "/beacon",
          instrument_xhr: true,
          autorun: true,
          ResourceTiming: { enabled: true, clearOnBeacon: false }
        });
        initialized = true;
        return true;
      }

      if (!initIfAvailable()) {
        var attempts = 0;
        var timer = setInterval(function () {
          attempts++;
          if (initIfAvailable() || attempts >= 100) {
            clearInterval(timer);
          }
        }, 100);
      }
    })();

    (function () {
      function updateDiagnostics() {
        var nav = performance.getEntriesByType("navigation")[0];
        var activation = nav && typeof nav.activationStart === "number" ? nav.activationStart.toFixed(2) + "ms" : "n/a";

        document.getElementById("diag-prerendering").textContent = String(!!document.prerendering);
        document.getElementById("diag-visibility").textContent = document.visibilityState;
        document.getElementById("diag-activation").textContent = activation;
        document.getElementById("diag-nav-type").textContent = nav ? nav.type : "n/a";
      }

      updateDiagnostics();
      document.addEventListener("visibilitychange", updateDiagnostics);

      if ("onprerenderingchange" in document) {
        document.addEventListener("prerenderingchange", updateDiagnostics);
      }
    })();
  </script>
</body>
</html>`;
}

app.get("/prerender/:page", (req, res) => {
  const page = req.params.page;
  const allowed = new Set(["overview", "metrics", "network"]);

  if (!allowed.has(page)) {
    res.status(404).send("Unknown prerender page");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(renderPrerenderPage(page, buildRuntimeConfig(req)));
});

// ─── Static files ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// Serve boomerang build from repo
app.use("/boomerang", express.static(path.join(__dirname, "..", "build")));

// Serve boomerang plugins source (for individual loading)
app.use("/plugins", express.static(path.join(__dirname, "..", "plugins")));

// Serve boomerang core source
app.get("/boomerang-src.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "boomerang.js"));
});

// ─── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🚀 Boomerang Playground running at http://localhost:${PORT}\n`);
});
