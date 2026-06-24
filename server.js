const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { marked } = require("marked");

const app = express();
const PORT = process.env.PORT || 3456;
const HTTP_PORT = process.env.HTTP_PORT || 3457;

// Run both HTTP and HTTPS servers when enabled (e.g. BOTH=true / RUN_BOTH=true)
const RUN_BOTH = /^(1|true|yes)$/i.test(
  String(process.env.BOTH || process.env.RUN_BOTH || "")
);

// Load SSL certificates for HTTPS
const certPath = path.join(__dirname, "certs");
const keyPath = path.join(certPath, "server.key");
const certFile = path.join(certPath, "server.crt");

let sslOptions = null;
if (fs.existsSync(keyPath) && fs.existsSync(certFile)) {
  sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFile)
  };
}
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
  const pageContentMap = {
    overview: {
      subtitle: "Overview of prerender activation and page lifecycle.",
      body: `
  <div class="card">
    <h2>What this page demonstrates</h2>
    <ul>
      <li>This URL is listed in the speculation rules list on the main app.</li>
      <li>If prerendered, activation should be faster and <code>activationStart</code> may be non-zero.</li>
      <li>After activation, Boomerang sends regular page-load beacons from this route.</li>
    </ul>
  </div>
  <div class="card">
    <h2>Validation checklist</h2>
    <ol>
      <li>Open this page from the Speculation Rules scenario links.</li>
      <li>Confirm diagnostics values updated after navigation.</li>
      <li>Compare with direct hard navigation to this URL.</li>
    </ol>
  </div>
      `,
    },
    metrics: {
      subtitle: "Metrics-focused prerender target with lightweight timing summary.",
      body: `
  <div class="card">
    <h2>Performance quick view</h2>
    <div class="row"><span class="k">DOM Content Loaded</span><span class="v" id="metric-dcl">-</span></div>
    <div class="row"><span class="k">Load Event End</span><span class="v" id="metric-load-end">-</span></div>
    <div class="row"><span class="k">Response End</span><span class="v" id="metric-response-end">-</span></div>
  </div>
  <div class="card">
    <h2>What to compare</h2>
    <p>Use this page to compare timings between prerender activation and direct navigation. Timing values are taken from <code>PerformanceNavigationTiming</code>.</p>
  </div>
      `,
    },
    network: {
      subtitle: "Network-focused prerender target with connection information.",
      body: `
  <div class="card">
    <h2>Connection summary</h2>
    <div class="row"><span class="k">effectiveType</span><span class="v" id="net-effective-type">-</span></div>
    <div class="row"><span class="k">downlink</span><span class="v" id="net-downlink">-</span></div>
    <div class="row"><span class="k">rtt</span><span class="v" id="net-rtt">-</span></div>
    <div class="row"><span class="k">saveData</span><span class="v" id="net-save-data">-</span></div>
  </div>
  <div class="card">
    <h2>Usage</h2>
    <p>This route helps validate prerender behavior while also checking network context that Boomerang may include for mobile/network metrics.</p>
  </div>
      `,
    },
  };
  const selectedContent = pageContentMap[pageName] || {
    subtitle: "Prerender destination page.",
    body: '<div class="card"><p>No specific content configured for this page.</p></div>',
  };
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
    h2 { margin: 0 0 10px; font-size: 18px; }
    p { color: var(--muted); }
    ul, ol { margin: 0; padding-left: 20px; color: var(--text); }
    li { margin-bottom: 8px; }
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
  <p>${selectedContent.subtitle}</p>

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

  ${selectedContent.body}

  <script>
    window.BOOMR_mq = window.BOOMR_mq || [];
  </script>
  ${localBoomerangScript}
  <script>

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

    (function () {
      var nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        var dcl = document.getElementById("metric-dcl");
        var loadEnd = document.getElementById("metric-load-end");
        var responseEnd = document.getElementById("metric-response-end");
        if (dcl) dcl.textContent = nav.domContentLoadedEventEnd.toFixed(2) + "ms";
        if (loadEnd) loadEnd.textContent = nav.loadEventEnd.toFixed(2) + "ms";
        if (responseEnd) responseEnd.textContent = nav.responseEnd.toFixed(2) + "ms";
      }

      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        var et = document.getElementById("net-effective-type");
        var dl = document.getElementById("net-downlink");
        var rtt = document.getElementById("net-rtt");
        var sd = document.getElementById("net-save-data");

        if (et) et.textContent = conn.effectiveType || "n/a";
        if (dl) dl.textContent = (conn.downlink != null ? conn.downlink + " Mbps" : "n/a");
        if (rtt) rtt.textContent = (conn.rtt != null ? conn.rtt + "ms" : "n/a");
        if (sd) sd.textContent = conn.saveData ? "true" : "false";
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

// ─── Markdown renderer ───────────────────────────────────────────────
function renderMarkdownPage(markdownPath) {
  const mdContent = fs.readFileSync(markdownPath, 'utf8');
  const htmlContent = marked(mdContent);
  const title = path.basename(markdownPath, '.md');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
   * { margin: 0; padding: 0; box-sizing: border-box; }
   body {
     font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
     background: #0f1419;
     color: #e1e4ed;
     line-height: 1.6;
     padding: 40px 20px;
   }
   .container { max-width: 900px; margin: 0 auto; }
   .back-link {
     display: inline-block;
     margin-bottom: 20px;
     padding: 8px 16px;
     background: #667eea;
     color: white;
     text-decoration: none;
     border-radius: 4px;
     font-weight: 500;
     transition: background 0.3s;
   }
   .back-link:hover { background: #764ba2; }
   .content {
     background: #1c1f2e;
     border: 1px solid #2a2d3e;
     border-radius: 8px;
     padding: 40px;
   }
   h1, h2, h3, h4, h5, h6 {
     margin-top: 24px;
     margin-bottom: 12px;
     color: #fff;
   }
   h1 { font-size: 2em; margin-top: 0; }
   h2 { font-size: 1.5em; border-bottom: 1px solid #2a2d3e; padding-bottom: 8px; }
   h3 { font-size: 1.25em; }
   p { margin-bottom: 16px; }
   ul, ol { margin-left: 24px; margin-bottom: 16px; }
   li { margin-bottom: 8px; }
   code {
     background: #0f1419;
     border: 1px solid #2a2d3e;
     border-radius: 3px;
     padding: 2px 6px;
     font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
     font-size: 0.9em;
     color: #79c0ff;
   }
   pre {
     background: #0f1419;
     border: 1px solid #2a2d3e;
     border-radius: 6px;
     padding: 16px;
     overflow-x: auto;
     margin-bottom: 16px;
   }
   pre code {
     background: none;
     border: none;
     padding: 0;
     color: #79c0ff;
   }
   blockquote {
     border-left: 4px solid #667eea;
     padding-left: 16px;
     margin-left: 0;
     margin-bottom: 16px;
     color: #8b8fa3;
     font-style: italic;
   }
   a {
     color: #79c0ff;
     text-decoration: none;
     border-bottom: 1px dotted #667eea;
   }
   a:hover { text-decoration: underline; }
   table {
     border-collapse: collapse;
     width: 100%;
     margin-bottom: 16px;
   }
   th, td {
     border: 1px solid #2a2d3e;
     padding: 8px 12px;
     text-align: left;
   }
   th { background: #2a2d3e; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
   <a href="/tutorial-hub.html" class="back-link">← Back to Tutorial Hub</a>
   <div class="content">
     ${htmlContent}
   </div>
  </div>
</body>
</html>`;
}

// Serve markdown files as HTML
app.get('/boomerang%20tutorial/*.md', (req, res) => {
  const filePath = path.join(__dirname, 'boomerang tutorial', req.params[0] + '.md');
  try {
   if (!fs.existsSync(filePath)) {
     res.status(404).send('Lesson not found');
     return;
   }
   res.setHeader('Content-Type', 'text/html; charset=utf-8');
   res.send(renderMarkdownPage(filePath));
  } catch (err) {
   console.error('Error rendering markdown:', err);
   res.status(500).send('Error loading lesson');
  }
});

// ─── Static files ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// Serve tutorial files from root
app.use("/boomerang%20tutorial", express.static(path.join(__dirname, "boomerang tutorial")));

// Serve boomerang build from repo
app.use("/boomerang", express.static(path.join(__dirname, "..", "build")));

// Serve boomerang plugins source (for individual loading)
app.use("/plugins", express.static(path.join(__dirname, "..", "plugins")));

// Serve boomerang core source
app.get("/boomerang-src.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "boomerang.js"));
});

// ─── Start ───────────────────────────────────────────────────────────
function startHttp(port) {
  app.listen(port, () => {
    console.log(`\n  🚀 Boomerang Playground running at http://localhost:${port}\n`);
  });
}

if (sslOptions) {
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`\n  🚀 Boomerang Playground running at https://localhost:${PORT}\n`);
  });
  if (RUN_BOTH) {
    startHttp(HTTP_PORT);
  }
} else {
  if (RUN_BOTH) {
    console.warn("⚠️  SSL certificates not found. Running over HTTP only.");
  } else {
    console.warn("⚠️  SSL certificates not found. Running over HTTP instead.");
  }
  startHttp(PORT);
}
