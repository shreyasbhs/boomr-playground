const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3456;

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
