/**
 * Main application controller — handles navigation, scenario loading,
 * and interactive action handlers for each scenario.
 */
(function () {
  "use strict";

  const contentEl = document.getElementById("content");
  const navItems = document.querySelectorAll(".nav-item");
  let currentScenario = "intro";

  // ─── Navigation ────────────────────────────────────────────────────

  function loadScenario(name) {
    const fn = window.SCENARIOS[name];
    if (!fn) return;

    currentScenario = name;
    contentEl.innerHTML = fn();

    // Update sidebar active state
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.scenario === name);
    });

    // Bind interactive handlers for this scenario
    bindHandlers(name);

    // Scroll content to top
    contentEl.scrollTop = 0;
  }

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      loadScenario(item.dataset.scenario);
    });
  });

  // ─── Utility helpers ───────────────────────────────────────────────

  function log(logId, msg, level) {
    const logEl = document.getElementById(logId);
    if (!logEl) return;
    logEl.style.display = "block";
    const entry = document.createElement("div");
    entry.className = "log-entry";
    const ts = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="log-time">[${ts}]</span> <span class="log-${level || "info"}">${msg}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function clearLog(logId) {
    const logEl = document.getElementById(logId);
    if (logEl) { logEl.innerHTML = ""; logEl.style.display = "none"; }
  }

  function blockMainThread(ms) {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      // Busy-wait to simulate CPU-bound work
      Math.random() * Math.random();
    }
  }

  function formatMs(val) {
    if (val === undefined || val === null) return "-";
    return Math.round(val) + "ms";
  }

  // ─── Scenario handlers ────────────────────────────────────────────

  function bindHandlers(name) {
    switch (name) {
      case "page-load": bindPageLoad(); break;
      case "navigation-timing": bindNavTiming(); break;
      case "paint-timing": bindPaintTiming(); break;
      case "resource-timing": bindResourceTiming(); break;
      case "lcp": bindLCP(); break;
      case "fid-inp": bindFidInp(); break;
      case "long-tasks": bindLongTasks(); break;
      case "speculation-prerender": bindSpeculationPrerender(); break;
      case "xhr-fetch": bindXhrFetch(); break;
      case "spa": bindSpa(); break;
      case "errors": bindErrors(); break;
      case "bandwidth": bindBandwidth(); break;
    }
  }

  // ─── Page Load ─────────────────────────────────────────────────────

  function bindPageLoad() {
    const runBtn = document.getElementById("pl-run");
    const domRunBtn = document.getElementById("pl-dom-run");

    runBtn.addEventListener("click", () => {
      const delay = document.getElementById("pl-delay").value;
      const area = document.getElementById("pl-action-area");
      area.classList.add("active");
      area.innerHTML = '<p style="color:var(--yellow)">Loading page with server delay...</p>';
      clearLog("pl-log");
      log("pl-log", `Fetching /api/slow?delay=${delay}`, "info");

      const start = performance.now();
      fetch(`/api/slow?delay=${delay}`)
        .then(r => r.json())
        .then(data => {
          const elapsed = Math.round(performance.now() - start);
          area.innerHTML = `<p style="color:var(--green)">✓ Response received in <strong>${elapsed}ms</strong></p>
            <p style="color:var(--text-muted);font-size:12px">Server delay was ${delay}ms. The extra time is network + processing overhead.</p>`;
          area.classList.remove("active");
          log("pl-log", `Response received in ${elapsed}ms (server delay: ${delay}ms)`, "ok");
          log("pl-log", "Check the Beacon Inspector for an XHR beacon with t_done ≈ " + elapsed + "ms", "info");
        })
        .catch(err => {
          area.innerHTML = `<p style="color:var(--red)">✗ Error: ${err.message}</p>`;
          log("pl-log", `Error: ${err.message}`, "err");
        });
    });

    domRunBtn.addEventListener("click", () => {
      const count = parseInt(document.getElementById("pl-dom-count").value, 10);
      const area = document.getElementById("pl-dom-area");
      area.classList.add("active");
      area.innerHTML = '<p style="color:var(--yellow)">Generating DOM nodes...</p>';

      const start = performance.now();
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const div = document.createElement("div");
        div.style.cssText = "width:4px;height:4px;display:inline-block;margin:1px;border-radius:2px;background:hsl(" + (i % 360) + ",70%,50%)";
        fragment.appendChild(div);
      }

      requestAnimationFrame(() => {
        area.innerHTML = "";
        area.appendChild(fragment);
        const elapsed = Math.round(performance.now() - start);
        const note = document.createElement("p");
        note.style.cssText = "color:var(--green);font-size:12px;margin-top:12px";
        note.textContent = `✓ Created ${count} DOM nodes in ${elapsed}ms`;
        area.appendChild(note);
        area.classList.remove("active");
      });
    });
  }

  // ─── Navigation Timing ────────────────────────────────────────────

  function bindNavTiming() {
    const readBtn = document.getElementById("nt-read");

    // Animate timeline with real data
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav) {
      const total = nav.loadEventEnd || nav.domComplete || nav.responseEnd;
      if (total > 0) {
        function pct(val) { return (val / total * 100).toFixed(1); }
        function setBar(id, start, end, label) {
          const el = document.getElementById(id);
          if (el && end > start) {
            el.style.left = pct(start) + "%";
            el.style.width = Math.max(pct(end - start), 1) + "%";
            el.textContent = Math.round(end - start) + "ms";
          }
        }
        setBar("nt-redirect", nav.redirectStart, nav.redirectEnd);
        setBar("nt-dns", nav.domainLookupStart, nav.domainLookupEnd);
        setBar("nt-tcp", nav.connectStart, nav.connectEnd);
        setBar("nt-ssl", nav.secureConnectionStart || nav.connectStart, nav.secureConnectionStart ? nav.connectEnd : nav.connectStart);
        setBar("nt-req", nav.requestStart, nav.responseStart);
        setBar("nt-resp", nav.responseStart, nav.responseEnd);
        setBar("nt-dom", nav.responseEnd, nav.domComplete);
        setBar("nt-load", nav.loadEventStart, nav.loadEventEnd);
      }
    }

    readBtn.addEventListener("click", () => {
      const metricsEl = document.getElementById("nt-metrics");
      metricsEl.style.display = "grid";
      metricsEl.innerHTML = "";

      if (!nav) {
        metricsEl.innerHTML = '<p style="color:var(--red)">Navigation Timing data not available.</p>';
        return;
      }

      const metrics = [
        { label: "DNS Lookup", value: nav.domainLookupEnd - nav.domainLookupStart, param: "nt_dns_end - nt_dns_st" },
        { label: "TCP Connect", value: nav.connectEnd - nav.connectStart, param: "nt_con_end - nt_con_st" },
        { label: "TTFB", value: nav.responseStart - nav.requestStart, param: "nt_res_st - nt_req_st" },
        { label: "Response", value: nav.responseEnd - nav.responseStart, param: "nt_res_end - nt_res_st" },
        { label: "DOM Interactive", value: nav.domInteractive, param: "nt_domint" },
        { label: "DOM Complete", value: nav.domComplete, param: "nt_domcomp" },
        { label: "Load Event", value: nav.loadEventEnd - nav.loadEventStart, param: "nt_load_end - nt_load_st" },
        { label: "Total", value: nav.loadEventEnd, param: "nt_load_end" },
      ];

      metrics.forEach(m => {
        const card = document.createElement("div");
        card.className = "metric-card";
        card.innerHTML = `
          <div class="metric-value">${formatMs(m.value)}</div>
          <div class="metric-label">${m.label}</div>
          <div class="metric-param">${m.param}</div>`;
        metricsEl.appendChild(card);
      });
    });
  }

  // ─── Paint Timing ─────────────────────────────────────────────────

  function bindPaintTiming() {
    const readBtn = document.getElementById("pt-read");
    const lcpRunBtn = document.getElementById("pt-lcp-run");

    readBtn.addEventListener("click", () => {
      const metricsEl = document.getElementById("pt-metrics");
      metricsEl.style.display = "grid";
      metricsEl.innerHTML = "";

      const paintEntries = performance.getEntriesByType("paint");
      const fp = paintEntries.find(e => e.name === "first-paint");
      const fcp = paintEntries.find(e => e.name === "first-contentful-paint");

      const metrics = [
        { label: "First Paint", value: fp ? fp.startTime : null, param: "pt.fp" },
        { label: "First Contentful Paint", value: fcp ? fcp.startTime : null, param: "pt.fcp" },
      ];

      // Try to get LCP from PerformanceObserver
      try {
        const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
        if (lcpEntries.length > 0) {
          const lcp = lcpEntries[lcpEntries.length - 1];
          metrics.push({ label: "Largest Contentful Paint", value: lcp.renderTime || lcp.loadTime, param: "pt.lcp" });
        }
      } catch (e) { /* LCP may not be available via getEntriesByType */ }

      metrics.forEach(m => {
        const card = document.createElement("div");
        card.className = "metric-card";
        card.innerHTML = `
          <div class="metric-value">${formatMs(m.value)}</div>
          <div class="metric-label">${m.label}</div>
          <div class="metric-param">${m.param}</div>`;
        metricsEl.appendChild(card);
      });

      if (metrics.every(m => m.value === null)) {
        metricsEl.innerHTML = '<div class="metric-card"><div class="metric-value" style="font-size:14px;color:var(--yellow)">Paint Timing API not available in this browser</div></div>';
      }
    });

    lcpRunBtn.addEventListener("click", () => {
      const delay = document.getElementById("pt-img-delay").value;
      const size = document.getElementById("pt-img-size").value;
      const area = document.getElementById("pt-lcp-area");
      area.classList.add("active");
      area.innerHTML = '<p style="color:var(--yellow)">Loading image with ' + delay + 'ms delay...</p>';

      const img = new Image();
      const w = size;
      const h = Math.round(size * 0.75);
      img.src = `/api/image?delay=${delay}&width=${w}&height=${h}&color=6366f1&_t=${Date.now()}`;
      img.style.cssText = "border-radius:8px;max-width:100%";
      img.onload = () => {
        area.innerHTML = "";
        area.appendChild(img);
        const note = document.createElement("p");
        note.style.cssText = "color:var(--green);font-size:12px;margin-top:8px";
        note.textContent = `✓ Image loaded. This ${w}x${h} image may become the new LCP element.`;
        area.appendChild(note);
        area.classList.remove("active");
      };
    });
  }

  // ─── Resource Timing ──────────────────────────────────────────────

  function bindResourceTiming() {
    const runBtn = document.getElementById("rt-run");
    const readPageBtn = document.getElementById("rt-read-page");

    runBtn.addEventListener("click", () => {
      const count = parseInt(document.getElementById("rt-count").value, 10);
      const maxDelay = parseInt(document.getElementById("rt-delay").value, 10);
      clearLog("rt-log");

      log("rt-log", `Loading ${count} resources with delays up to ${maxDelay}ms...`, "info");

      const promises = [];
      for (let i = 0; i < count; i++) {
        const delay = Math.round(Math.random() * maxDelay);
        const start = performance.now();
        promises.push(
          fetch(`/api/slow?delay=${delay}&_r=${i}&_t=${Date.now()}`)
            .then(r => r.json())
            .then(() => {
              const elapsed = Math.round(performance.now() - start);
              log("rt-log", `Resource ${i + 1}: ${elapsed}ms (server delay: ${delay}ms)`, "ok");
              return { index: i, delay, elapsed };
            })
        );
      }

      Promise.all(promises).then(results => {
        log("rt-log", "All resources loaded. Check the Beacon Inspector for XHR beacons.", "info");
        renderWaterfall("rt-waterfall", results);
      });
    });

    readPageBtn.addEventListener("click", () => {
      const entries = performance.getEntriesByType("resource");
      const waterfall = document.getElementById("rt-page-waterfall");
      waterfall.style.display = "block";
      waterfall.innerHTML = "";

      if (entries.length === 0) {
        waterfall.innerHTML = '<p style="color:var(--text-muted);padding:12px">No resource timing entries found.</p>';
        return;
      }

      const maxEnd = Math.max(...entries.map(e => e.responseEnd));

      entries.forEach(entry => {
        const name = entry.name.split("/").pop() || entry.name;
        const row = document.createElement("div");
        row.className = "waterfall-row";

        const pctStart = (entry.startTime / maxEnd * 100).toFixed(1);
        const pctWidth = Math.max(((entry.responseEnd - entry.startTime) / maxEnd * 100), 0.5).toFixed(1);

        const color = entry.initiatorType === "script" ? "var(--orange)" :
                      entry.initiatorType === "css" ? "var(--blue)" :
                      entry.initiatorType === "img" ? "var(--green)" :
                      entry.initiatorType === "fetch" ? "var(--cyan)" :
                      entry.initiatorType === "xmlhttprequest" ? "var(--accent)" : "var(--text-muted)";

        row.innerHTML = `
          <div class="waterfall-name" title="${entry.name}">${name}</div>
          <div class="waterfall-track">
            <div class="waterfall-segment" style="left:${pctStart}%;width:${pctWidth}%;background:${color}"></div>
          </div>
          <div class="waterfall-time">${Math.round(entry.duration)}ms</div>`;
        waterfall.appendChild(row);
      });
    });
  }

  function renderWaterfall(id, results) {
    const el = document.getElementById(id);
    el.style.display = "block";
    el.innerHTML = "";
    const maxElapsed = Math.max(...results.map(r => r.elapsed));

    results.forEach(r => {
      const row = document.createElement("div");
      row.className = "waterfall-row";
      const pctWidth = (r.elapsed / maxElapsed * 100).toFixed(1);
      row.innerHTML = `
        <div class="waterfall-name">Resource ${r.index + 1}</div>
        <div class="waterfall-track">
          <div class="waterfall-segment" style="left:0;width:${pctWidth}%;background:var(--accent)"></div>
        </div>
        <div class="waterfall-time">${r.elapsed}ms</div>`;
      el.appendChild(row);
    });
  }

  // ─── LCP ──────────────────────────────────────────────────────────

  function bindLCP() {
    const addBtn = document.getElementById("lcp-add");
    const clearBtn = document.getElementById("lcp-clear");

    addBtn.addEventListener("click", () => {
      const type = document.getElementById("lcp-type").value;
      const size = document.getElementById("lcp-size").value;
      const area = document.getElementById("lcp-area");

      const dims = { small: 150, medium: 300, large: 600 };
      const dim = dims[size];

      if (type === "text") {
        const textEl = document.createElement("div");
        textEl.style.cssText = `font-size:${dim / 8}px;padding:${dim / 10}px;background:var(--bg-card);border-radius:8px;max-width:100%`;
        textEl.textContent = "This is a large text block that could become the LCP element. ".repeat(Math.ceil(dim / 30));
        area.innerHTML = "";
        area.appendChild(textEl);
      } else if (type === "image-fast") {
        const img = new Image();
        img.src = `/api/image?width=${dim}&height=${Math.round(dim * 0.75)}&color=22c55e&_t=${Date.now()}`;
        img.style.cssText = "border-radius:8px;max-width:100%";
        area.innerHTML = "";
        area.appendChild(img);
      } else if (type === "image-slow") {
        area.innerHTML = '<p style="color:var(--yellow)">Loading slow image (3s delay)...</p>';
        const img = new Image();
        img.src = `/api/image?delay=3000&width=${dim}&height=${Math.round(dim * 0.75)}&color=ef4444&_t=${Date.now()}`;
        img.style.cssText = "border-radius:8px;max-width:100%";
        img.onload = () => { area.innerHTML = ""; area.appendChild(img); };
      } else if (type === "bg-image") {
        const div = document.createElement("div");
        div.style.cssText = `width:${dim}px;height:${Math.round(dim * 0.75)}px;border-radius:8px;background:url('/api/image?width=${dim}&height=${Math.round(dim * 0.75)}&color=3b82f6&_t=${Date.now()}') center/cover`;
        area.innerHTML = "";
        area.appendChild(div);
      }
    });

    clearBtn.addEventListener("click", () => {
      document.getElementById("lcp-area").innerHTML = '<p style="color:var(--text-muted)">LCP candidate elements will appear here.</p>';
    });
  }

  // ─── FID & INP ────────────────────────────────────────────────────

  function bindFidInp() {
    const startBlockBtn = document.getElementById("fid-start-block");

    startBlockBtn.addEventListener("click", () => {
      const blockMs = parseInt(document.getElementById("fid-block").value, 10);
      clearLog("fid-log");
      log("fid-log", `Main thread will block for ${blockMs}ms. Try clicking anywhere during the block!`, "warn");

      // Block starts immediately — the click handler itself causes the delay
      blockMainThread(blockMs);

      log("fid-log", `Block complete. Your click was delayed by ~${blockMs}ms — this is FID.`, "ok");
      log("fid-log", "Check the Beacon Inspector for et.fid in the next beacon.", "info");
    });

    // INP buttons
    const inpArea = document.getElementById("inp-area");
    inpArea.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const work = parseInt(btn.dataset.work, 10);
        clearLog("inp-log");
        log("inp-log", `Processing ${work}ms of work...`, "warn");
        blockMainThread(work);
        log("inp-log", `Done. This interaction took ~${work}ms. If this is the worst, it becomes INP.`, "ok");
      });
    });
  }

  // ─── Long Tasks ───────────────────────────────────────────────────

  function bindLongTasks() {
    const runBtn = document.getElementById("lt-run");

    runBtn.addEventListener("click", () => {
      const duration = parseInt(document.getElementById("lt-duration").value, 10);
      const count = parseInt(document.getElementById("lt-count").value, 10);
      const gap = parseInt(document.getElementById("lt-gap").value, 10);
      const progress = document.getElementById("lt-progress");
      const bar = document.getElementById("lt-bar");

      clearLog("lt-log");
      progress.style.display = "block";
      bar.style.width = "0%";

      let completed = 0;
      const totalTime = count * duration + (count - 1) * gap;

      log("lt-log", `Starting ${count} long tasks of ${duration}ms each (${gap}ms gap)`, "info");
      log("lt-log", `Total Blocking Time = ${count} × max(0, ${duration} - 50) = ${count * Math.max(0, duration - 50)}ms`, "info");

      function runTask(i) {
        if (i >= count) {
          log("lt-log", "All long tasks complete! Check for continuity metrics in the next beacon.", "ok");
          return;
        }

        log("lt-log", `Running task ${i + 1}/${count} (${duration}ms)...`, "warn");

        // Use setTimeout so the browser can update between tasks
        setTimeout(() => {
          blockMainThread(duration);
          completed++;
          bar.style.width = (completed / count * 100) + "%";
          log("lt-log", `Task ${i + 1} complete. Blocking portion: ${Math.max(0, duration - 50)}ms`, "ok");

          setTimeout(() => runTask(i + 1), gap);
        }, 10);
      }

      runTask(0);
    });
  }

  // ─── Speculation Rules / Prerender ───────────────────────────────

  function bindSpeculationPrerender() {
    const applyBtn = document.getElementById("sp-apply-rules");
    const refreshBtn = document.getElementById("sp-refresh-status");

    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function supportsSpeculationRules() {
      return (
        typeof HTMLScriptElement !== "undefined" &&
        typeof HTMLScriptElement.supports === "function" &&
        HTMLScriptElement.supports("speculationrules")
      );
    }

    function getActivationStart() {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav || typeof nav.activationStart !== "number") return "n/a";
      return nav.activationStart.toFixed(2) + "ms";
    }

    function installRulesNow() {
      const targets = (window.APP_RUNTIME && window.APP_RUNTIME.speculationTargets) || [
        "/prerender/overview",
        "/prerender/metrics",
        "/prerender/network",
      ];

      if (!supportsSpeculationRules()) {
        window.dispatchEvent(new CustomEvent("speculation-rules-status", {
          detail: { installed: false, supported: false }
        }));
        refreshStatus();
        return;
      }

      const existing = document.getElementById("dynamic-speculation-rules");
      const rulesScript = existing || document.createElement("script");
      if (!existing) {
        rulesScript.id = "dynamic-speculation-rules";
        rulesScript.type = "application/speculationrules";
        document.head.appendChild(rulesScript);
      }
      rulesScript.textContent = JSON.stringify({
        prefetch: [{ source: "list", urls: targets }],
        prerender: [{ source: "list", urls: targets }],
      });

      window.dispatchEvent(new CustomEvent("speculation-rules-status", {
        detail: { installed: true, supported: true, targets: targets }
      }));

      refreshStatus();
    }

    function refreshStatus() {
      const hasRules = !!document.getElementById("dynamic-speculation-rules");
      const runtime = window.APP_RUNTIME || {};

      setText("sp-support", supportsSpeculationRules() ? "Yes" : "No");
      setText("sp-installed", hasRules ? "Yes" : "No");
      setText("sp-prerendering", String(!!document.prerendering));
      setText("sp-activation", getActivationStart());
      setText("sp-boomr-variant", runtime.boomerangVariant || "unknown");
    }

    if (applyBtn) applyBtn.addEventListener("click", installRulesNow);
    if (refreshBtn) refreshBtn.addEventListener("click", refreshStatus);

    window.addEventListener("speculation-rules-status", refreshStatus);
    window.addEventListener("boomr-runtime-config", refreshStatus);
    document.addEventListener("visibilitychange", refreshStatus);
    document.addEventListener("prerenderingchange", refreshStatus);

    refreshStatus();
  }

  // ─── XHR & Fetch ──────────────────────────────────────────────────

  function bindXhrFetch() {
    const sendBtn = document.getElementById("xhr-send");

    sendBtn.addEventListener("click", () => {
      const endpoint = document.getElementById("xhr-endpoint").value;
      const paramVal = document.getElementById("xhr-param").value;
      const method = document.getElementById("xhr-method").value;

      const paramMap = {
        "/api/slow": "delay",
        "/api/large": "size",
        "/api/error": "status",
        "/api/redirect": "hops",
        "/api/stream": "chunks",
      };

      const paramName = paramMap[endpoint] || "value";
      const url = `${endpoint}?${paramName}=${paramVal}&_t=${Date.now()}`;

      clearLog("xhr-log");
      log("xhr-log", `${method.toUpperCase()} ${url}`, "info");

      const start = performance.now();

      if (method === "fetch") {
        fetch(url)
          .then(r => {
            log("xhr-log", `Status: ${r.status} ${r.statusText}`, r.ok ? "ok" : "err");
            return r.text();
          })
          .then(body => {
            const elapsed = Math.round(performance.now() - start);
            log("xhr-log", `Complete in ${elapsed}ms (${(body.length / 1024).toFixed(1)} KB)`, "ok");
            log("xhr-log", "Check Beacon Inspector for XHR beacon with http.initiator=xhr", "info");
          })
          .catch(err => {
            log("xhr-log", `Error: ${err.message}`, "err");
          });
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
          const elapsed = Math.round(performance.now() - start);
          log("xhr-log", `Status: ${xhr.status} ${xhr.statusText}`, xhr.status < 400 ? "ok" : "err");
          log("xhr-log", `Complete in ${elapsed}ms (${(xhr.responseText.length / 1024).toFixed(1)} KB)`, "ok");
          log("xhr-log", "Check Beacon Inspector for XHR beacon", "info");
        };
        xhr.onerror = function () {
          log("xhr-log", "Network error", "err");
        };
        xhr.send();
      }
    });

    // Update param label based on endpoint
    const endpointSelect = document.getElementById("xhr-endpoint");
    const paramInput = document.getElementById("xhr-param");
    const defaults = {
      "/api/slow": 1000,
      "/api/large": 500,
      "/api/error": 500,
      "/api/redirect": 3,
      "/api/stream": 5,
    };

    endpointSelect.addEventListener("change", () => {
      paramInput.value = defaults[endpointSelect.value] || 1000;
    });
  }

  // ─── SPA Navigation ──────────────────────────────────────────────

  function bindSpa() {
    const demo = document.getElementById("spa-demo");
    const buttons = demo.querySelectorAll(".spa-demo-nav button");
    const contentArea = document.getElementById("spa-content");

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        const delay = document.getElementById("spa-delay").value;

        // Update active tab
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Show loading state
        contentArea.innerHTML = '<p style="color:var(--yellow)">Loading...</p>';
        clearLog("spa-log");
        log("spa-log", `Navigating to /${page} (delay: ${delay}ms)`, "info");

        // Push history state (this triggers Boomerang's SPA tracking)
        history.pushState({ page }, page, `#/spa/${page}`);

        // Fetch page data (Boomerang's AutoXHR will track this)
        const start = performance.now();
        fetch(`/api/spa-page/${page}?delay=${delay}&_t=${Date.now()}`)
          .then(r => r.json())
          .then(data => {
            const elapsed = Math.round(performance.now() - start);
            contentArea.innerHTML = `
              <h3>${data.title}</h3>
              <p>${data.content}</p>
              <p style="color:var(--text-muted);font-size:12px;margin-top:12px">Loaded in ${elapsed}ms</p>`;
            log("spa-log", `Page "${data.title}" loaded in ${elapsed}ms`, "ok");
            log("spa-log", "Check Beacon Inspector for a beacon with http.initiator=xhr", "info");
          })
          .catch(err => {
            contentArea.innerHTML = `<p style="color:var(--red)">Error: ${err.message}</p>`;
          });
      });
    });
  }

  // ─── Errors ───────────────────────────────────────────────────────

  function bindErrors() {
    document.getElementById("err-js").addEventListener("click", () => {
      clearLog("err-log");
      log("err-log", "Throwing a JavaScript error...", "warn");
      try {
        // Use setTimeout so the error is thrown globally (caught by window.onerror)
        setTimeout(() => {
          throw new Error("Playground: Intentional JavaScript Error for testing");
        }, 0);
        log("err-log", "Error thrown via setTimeout. Boomerang's Errors plugin captures it via window.onerror.", "info");
      } catch (e) {
        log("err-log", "Error caught: " + e.message, "err");
      }
    });

    document.getElementById("err-promise").addEventListener("click", () => {
      clearLog("err-log");
      log("err-log", "Creating unhandled promise rejection...", "warn");
      Promise.reject(new Error("Playground: Intentional Unhandled Promise Rejection"));
      log("err-log", "Promise rejected. Boomerang captures this via 'unhandledrejection' event.", "info");
    });

    document.getElementById("err-xhr").addEventListener("click", () => {
      clearLog("err-log");
      log("err-log", "Sending XHR to /api/error?status=500...", "warn");
      fetch("/api/error?status=500&_t=" + Date.now())
        .then(r => {
          log("err-log", `Response: ${r.status} ${r.statusText}`, "err");
          log("err-log", "Boomerang tracks this as an XHR beacon with http.errno=500", "info");
          return r.json();
        })
        .catch(err => log("err-log", err.message, "err"));
    });

    document.getElementById("err-404").addEventListener("click", () => {
      clearLog("err-log");
      log("err-log", "Fetching non-existent URL...", "warn");
      fetch("/api/this-does-not-exist?_t=" + Date.now())
        .then(r => {
          log("err-log", `Response: ${r.status} ${r.statusText}`, "err");
          return r.text();
        })
        .catch(err => log("err-log", err.message, "err"));
    });

    document.getElementById("err-console").addEventListener("click", () => {
      clearLog("err-log");
      log("err-log", "Calling console.error()...", "warn");
      console.error("Playground: Intentional console.error for testing Boomerang error tracking");
      log("err-log", "console.error() called. If Errors plugin wraps console.error, it will be captured.", "info");
    });
  }

  // ─── Bandwidth ────────────────────────────────────────────────────

  function bindBandwidth() {
    document.getElementById("net-read").addEventListener("click", () => {
      const metricsEl = document.getElementById("net-metrics");
      const noApiEl = document.getElementById("net-no-api");

      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) {
        metricsEl.style.display = "none";
        noApiEl.style.display = "block";
        return;
      }

      noApiEl.style.display = "none";
      metricsEl.style.display = "grid";
      metricsEl.innerHTML = "";

      const metrics = [
        { label: "Effective Type", value: conn.effectiveType || "-", param: "mob.etype" },
        { label: "Downlink", value: (conn.downlink || "-") + " Mbps", param: "mob.dl" },
        { label: "RTT", value: (conn.rtt || "-") + "ms", param: "mob.rtt" },
        { label: "Connection Type", value: conn.type || "-", param: "mob.ct" },
        { label: "Save Data", value: conn.saveData ? "Yes" : "No", param: "mob.sd" },
      ];

      metrics.forEach(m => {
        const card = document.createElement("div");
        card.className = "metric-card";
        card.innerHTML = `
          <div class="metric-value" style="font-size:20px">${m.value}</div>
          <div class="metric-label">${m.label}</div>
          <div class="metric-param">${m.param}</div>`;
        metricsEl.appendChild(card);
      });
    });

    document.getElementById("net-download").addEventListener("click", () => {
      const sizeKB = document.getElementById("net-size").value;
      clearLog("net-log");
      log("net-log", `Downloading ${sizeKB} KB payload...`, "info");

      const start = performance.now();
      fetch(`/api/large?size=${sizeKB}&_t=${Date.now()}`)
        .then(r => r.text())
        .then(body => {
          const elapsed = Math.round(performance.now() - start);
          const sizeMB = (body.length / 1024 / 1024).toFixed(2);
          const speedMbps = (body.length * 8 / elapsed / 1000).toFixed(2);
          log("net-log", `Downloaded ${sizeMB} MB in ${elapsed}ms`, "ok");
          log("net-log", `Effective speed: ~${speedMbps} Mbps`, "info");
          log("net-log", "Check Beacon Inspector for XHR beacon with t_done and resource timing data.", "info");
        })
        .catch(err => log("net-log", `Error: ${err.message}`, "err"));
    });
  }

  // ─── Initialize ───────────────────────────────────────────────────
  loadScenario("intro");

})();
