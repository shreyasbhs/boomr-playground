/**
 * Beacon Inspector — captures and displays boomerang beacons in real time.
 */
(function () {
  "use strict";

  const body = document.getElementById("inspector-body");
  const countEl = document.getElementById("beacon-count");
  const clearBtn = document.getElementById("btn-clear-beacons");
  const toggleBtn = document.getElementById("btn-toggle-inspector");

  let beaconCount = 0;

  // Categorize beacon params for organized display
  const PARAM_SECTIONS = {
    "Timing": ["t_done", "t_page", "t_resp", "t_other", "t_load"],
    "Navigation Timing": key => key.startsWith("nt_"),
    "Paint Timing": key => key.startsWith("pt."),
    "Resource Timing": ["restiming"],
    "Event Timing": key => key.startsWith("et."),
    "Memory & DOM": key => key.startsWith("mem.") || key.startsWith("dom.") || key.startsWith("scr.") || key === "cpu.cnc",
    "Network": key => key.startsWith("mob."),
    "Round-Trip": key => key.startsWith("rt."),
    "Errors": ["errors", "err"],
    "Session": ["rt.si", "rt.ss", "rt.sl"],
    "Page Info": ["u", "pgu", "r", "v", "sv", "pid", "n", "http.initiator"],
  };

  function classifyParam(key) {
    for (const [section, matcher] of Object.entries(PARAM_SECTIONS)) {
      if (typeof matcher === "function" && matcher(key)) return section;
      if (Array.isArray(matcher) && matcher.includes(key)) return section;
    }
    return "Other";
  }

  function getBeaconType(vars) {
    if (vars["http.initiator"] === "xhr") return { label: "XHR", cls: "xhr" };
    if (vars["http.initiator"] === "spa") return { label: "SPA Soft", cls: "spa" };
    if (vars["http.initiator"] === "spa_hard") return { label: "SPA Hard", cls: "spa" };
    if (vars["http.initiator"] === "bfcache") return { label: "BFCache", cls: "page-load" };
    if (vars["rt.quit"]) return { label: "Unload", cls: "unload" };
    if (vars.errors) return { label: "Error", cls: "error" };
    return { label: "Page Load", cls: "page-load" };
  }

  function formatValue(val) {
    if (val === undefined || val === null) return "-";
    const s = String(val);
    if (s.length > 80) return s.substring(0, 77) + "...";
    return s;
  }

  function createBeaconCard(vars) {
    const type = getBeaconType(vars);
    const card = document.createElement("div");
    card.className = "beacon-card";

    // Header
    const header = document.createElement("div");
    header.className = "beacon-card-header";

    const typeBadge = document.createElement("span");
    typeBadge.className = `beacon-card-type ${type.cls}`;
    typeBadge.textContent = type.label;

    const timing = document.createElement("span");
    const tDone = vars.t_done ? `${vars.t_done}ms` : "-";
    timing.textContent = `t_done: ${tDone}`;
    timing.style.color = "var(--text-muted)";
    timing.style.fontSize = "11px";
    timing.style.fontFamily = "var(--mono)";

    header.appendChild(typeBadge);
    header.appendChild(timing);

    // Body — grouped by sections
    const bodyDiv = document.createElement("div");
    bodyDiv.className = "beacon-card-body";

    // Group params
    const groups = {};
    for (const key of Object.keys(vars)) {
      if (key === "_ts") continue;
      const section = classifyParam(key);
      if (!groups[section]) groups[section] = [];
      groups[section].push(key);
    }

    // Preferred order
    const order = ["Timing", "Navigation Timing", "Paint Timing", "Event Timing", "Resource Timing",
                   "Memory & DOM", "Network", "Round-Trip", "Session", "Page Info", "Errors", "Other"];

    for (const section of order) {
      const keys = groups[section];
      if (!keys || keys.length === 0) continue;

      const title = document.createElement("div");
      title.className = "beacon-section-title";
      title.textContent = section;
      bodyDiv.appendChild(title);

      keys.sort();
      for (const key of keys) {
        const row = document.createElement("div");
        row.className = "beacon-row";
        row.innerHTML = `<span class="beacon-key">${key}</span><span class="beacon-val" title="${String(vars[key])}">${formatValue(vars[key])}</span>`;
        bodyDiv.appendChild(row);
      }
    }

    // Toggle
    header.addEventListener("click", () => bodyDiv.classList.toggle("open"));

    card.appendChild(header);
    card.appendChild(bodyDiv);
    return card;
  }

  // Listen for beacons from the BOOMR before_beacon subscription
  window.addEventListener("boomr-beacon", (e) => {
    const vars = e.detail;
    beaconCount++;
    countEl.textContent = `${beaconCount} beacon${beaconCount !== 1 ? "s" : ""}`;

    // Remove empty message
    const emptyMsg = body.querySelector(".inspector-empty");
    if (emptyMsg) emptyMsg.remove();

    const card = createBeaconCard(vars);
    body.insertBefore(card, body.firstChild);

    // Auto-expand latest
    card.querySelector(".beacon-card-body").classList.add("open");

    // Collapse previous
    const cards = body.querySelectorAll(".beacon-card");
    if (cards.length > 1) {
      cards[1].querySelector(".beacon-card-body").classList.remove("open");
    }
  });

  // Also listen to SSE stream for beacons from iframes / other pages
  const evtSource = new EventSource("/beacon-stream");
  evtSource.onmessage = function (e) {
    try {
      // We only use SSE as a fallback; the CustomEvent above is primary
    } catch (err) { /* ignore */ }
  };

  // Clear beacons
  clearBtn.addEventListener("click", () => {
    body.innerHTML = '<p class="inspector-empty">No beacons captured yet. Interact with a scenario to see beacon data here.</p>';
    beaconCount = 0;
    countEl.textContent = "0 beacons";
  });

  // Toggle inspector collapse
  let inspectorCollapsed = false;
  toggleBtn.addEventListener("click", () => {
    const inspector = document.getElementById("inspector");
    inspectorCollapsed = !inspectorCollapsed;
    if (inspectorCollapsed) {
      inspector.style.width = "0";
      inspector.style.minWidth = "0";
      inspector.style.overflow = "hidden";
      toggleBtn.textContent = "◀";
    } else {
      inspector.style.width = "";
      inspector.style.minWidth = "";
      inspector.style.overflow = "";
      toggleBtn.textContent = "▶";
    }
  });
})();
