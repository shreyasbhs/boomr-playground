/**
 * Lesson 13 — Capstone beacon server.
 *
 * Serves the capstone page, receives beacons, stores them in memory, and
 * exposes an aggregate report at /report.
 *
 * Run:  node server.js   then open http://localhost:3001/
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { parse } = require("querystring");

const PORT = 3001;
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const PAGE = path.join(__dirname, "index.html");

const store = [];

const MIME = { ".html": "text/html", ".js": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".map": "application/json" };

function onBeacon(data) {
  store.push({
    ts: Date.now(),
    type: data["http.initiator"] || "page-load",
    pg: data.page_group || "(none)",
    u: data.u,
    t_done: Number(data.t_done) || null,
    has_error: !!data.err,
    build_id: data.build_id
  });
}

function report() {
  const byType = {};
  const tDoneByPg = {};
  let errors = 0;

  for (const b of store) {
    byType[b.type] = (byType[b.type] || 0) + 1;
    if (b.has_error) errors++;
    if (b.t_done != null) {
      (tDoneByPg[b.pg] = tDoneByPg[b.pg] || []).push(b.t_done);
    }
  }

  const avgByPg = {};
  for (const pg in tDoneByPg) {
    const arr = tDoneByPg[pg];
    avgByPg[pg] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  return { total: store.length, byType, avg_t_done_by_page_group: avgByPg, errors };
}

function handleBeacon(req, res) {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const query = req.url.split("?")[1] || "";
    const data = req.method === "POST" ? parse(body) : parse(query);
    onBeacon(data);
    console.log("BEACON", data["http.initiator"] || "page-load",
                "pg=" + (data.page_group || "-"), "t_done=" + (data.t_done || "-"));
    res.writeHead(204);
    res.end();
  });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") {
    return fs.readFile(PAGE, (err, buf) => {
      if (err) { res.writeHead(500); return res.end("index.html missing"); }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(buf);
    });
  }
  const filePath = path.join(REPO_ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(REPO_ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(filePath, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith("/beacon")) return handleBeacon(req, res);
  if (req.url.startsWith("/report")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(report(), null, 2));
  }
  if (req.url.startsWith("/api/products")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify([{ id: 42, name: "Boomerang" }]));
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log("Capstone server on http://localhost:" + PORT + "/");
  console.log("Report at      http://localhost:" + PORT + "/report");
});
