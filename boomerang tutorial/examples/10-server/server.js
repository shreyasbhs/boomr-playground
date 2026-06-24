/**
 * Lesson 10 — minimal beacon receiver + static file server.
 *
 * Serves:
 *   /            -> page.html (in this folder)
 *   /beacon      -> receives GET & POST beacons, prints key timers, returns 204
 *   everything else -> static files from the repo root (so ../../boomerang.js
 *                      style paths resolve for the served page)
 *
 * Run:  node server.js     then open http://localhost:3000/
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { parse } = require("querystring");

const PORT = 3000;
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const PAGE = path.join(__dirname, "page.html");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json"
};

function handleBeacon(req, res) {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const query = req.url.split("?")[1] || "";
    const data = req.method === "POST" ? parse(body) : parse(query);

    console.log("BEACON", {
      type: data["http.initiator"] || "page-load",
      url: data.u,
      page_group: data.page_group,
      t_done: data.t_done,
      t_resp: data.t_resp,
      has_error: !!data.err
    });

    // Respond fast & cheap
    res.writeHead(204);
    res.end();
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") {
    return fs.readFile(PAGE, (err, buf) => {
      if (err) { res.writeHead(500); return res.end("page.html missing"); }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(buf);
    });
  }

  // Prevent path traversal, resolve against repo root
  const filePath = path.join(REPO_ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(REPO_ROOT)) {
    res.writeHead(403); return res.end("forbidden");
  }

  fs.readFile(filePath, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    const type = MIME[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith("/beacon")) {
    return handleBeacon(req, res);
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log("Beacon server + static files on http://localhost:" + PORT + "/");
  console.log("Serving static files from:", REPO_ROOT);
});
