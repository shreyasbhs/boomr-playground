/**
 * Scenario definitions — each scenario contains the HTML content,
 * interactive controls, and educational descriptions.
 */
window.SCENARIOS = {};

// ─────────────────────────────────────────────────────────────────────
// INTRO
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS.intro = function () {
  return `
<h2 class="scenario-title">Welcome to the Boomerang Playground</h2>
<p class="scenario-subtitle">Learn web performance metrics hands-on by triggering real browser behaviors and watching how Boomerang captures them.</p>

<div class="card">
  <h3>What is Boomerang?</h3>
  <p>Boomerang is a Real User Measurement (RUM) JavaScript library that measures the performance
  experienced by real users visiting your site. It collects metrics from browser APIs (Navigation Timing,
  Resource Timing, Paint Timing, Event Timing, Long Tasks, etc.) and sends them as <strong>beacons</strong>
  to a collection endpoint.</p>
</div>

<div class="card">
  <h3>How This Playground Works</h3>
  <ul>
    <li><strong>Left sidebar</strong> — Choose a metric scenario to explore</li>
    <li><strong>Center panel</strong> — Read explanations, configure parameters, and trigger actions</li>
    <li><strong>Right panel (Beacon Inspector)</strong> — See live beacon data captured by Boomerang</li>
  </ul>
  <div class="info-box">
    <strong>Tip:</strong> Boomerang is already loaded on this page. Every page load and interaction is being measured.
    Check the Beacon Inspector on the right — you should already see a Page Load beacon!
  </div>
</div>

<div class="card">
  <h3>Key Concepts</h3>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-value" style="font-size:20px">t_done</div>
      <div class="metric-label">Total Load Time</div>
      <div class="metric-param">Time from navigation start to load complete</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="font-size:20px">t_resp</div>
      <div class="metric-label">Back-end Time</div>
      <div class="metric-param">Server response time (TTFB)</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="font-size:20px">t_page</div>
      <div class="metric-label">Front-end Time</div>
      <div class="metric-param">t_done minus t_resp</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="font-size:20px">pt.fcp</div>
      <div class="metric-label">First Contentful Paint</div>
      <div class="metric-param">First pixels rendered</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="font-size:20px">pt.lcp</div>
      <div class="metric-label">Largest Contentful Paint</div>
      <div class="metric-param">Largest element rendered</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="font-size:20px">et.fid</div>
      <div class="metric-label">First Input Delay</div>
      <div class="metric-param">Time to process first interaction</div>
    </div>
  </div>
</div>

<div class="card">
  <h3>Boomerang Configuration on This Page</h3>
  <div class="code-block"><span class="kw">BOOMR</span>.init({
  <span class="str">beacon_url</span>: <span class="str">"/beacon"</span>,
  <span class="str">instrument_xhr</span>: <span class="kw">true</span>,
  <span class="str">autorun</span>: <span class="kw">true</span>,
  <span class="str">ResourceTiming</span>: {
    <span class="str">enabled</span>: <span class="kw">true</span>,
    <span class="str">clearOnBeacon</span>: <span class="kw">false</span>
  }
});</div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// PAGE LOAD TIMING
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["page-load"] = function () {
  return `
<h2 class="scenario-title">Page Load Timing</h2>
<p class="scenario-subtitle">Understand how Boomerang measures the total page load experience with t_done, t_resp, and t_page.</p>

<div class="card">
  <h3>How It Works</h3>
  <p>Boomerang's <strong>RT (Round Trip) plugin</strong> measures:</p>
  <ul>
    <li><strong>t_done</strong> — Total time from navigation start to page load complete. This is the "headline" metric.</li>
    <li><strong>t_resp</strong> — Back-end time: from navigation start to first byte received (TTFB).</li>
    <li><strong>t_page</strong> — Front-end time: <code>t_done - t_resp</code>. Time the browser spent rendering.</li>
  </ul>
  <div class="info-box">
    <strong>Beacon params:</strong> <code>t_done</code>, <code>t_resp</code>, <code>t_page</code>, <code>rt.start</code> (start time source: navigation, cookie, etc.)
  </div>
</div>

<div class="card">
  <h3>Simulate: Slow Server Response</h3>
  <p>Load a page in an iframe where the server intentionally delays its response.
  Watch how <code>t_resp</code> increases while <code>t_page</code> stays relatively constant.</p>

  <div class="controls">
    <div class="control-group">
      <label>Server Delay (ms)</label>
      <input type="number" id="pl-delay" value="2000" min="0" max="10000" step="500">
    </div>
    <button class="btn" id="pl-run">Load Page with Delay</button>
  </div>

  <div class="action-area" id="pl-action-area">
    <p style="color:var(--text-muted)">Click "Load Page with Delay" to simulate a slow server.</p>
  </div>

  <div class="result-log" id="pl-log" style="display:none"></div>
</div>

<div class="card">
  <h3>Simulate: Heavy Front-end Rendering</h3>
  <p>This simulates a page where the server responds fast, but the browser has lots of DOM to process.
  Watch <code>t_page</code> grow while <code>t_resp</code> stays low.</p>

  <div class="controls">
    <div class="control-group">
      <label>DOM Nodes to Create</label>
      <input type="number" id="pl-dom-count" value="5000" min="100" max="50000" step="1000">
    </div>
    <button class="btn" id="pl-dom-run">Generate Heavy DOM</button>
  </div>

  <div class="action-area" id="pl-dom-area">
    <p style="color:var(--text-muted)">Click to generate DOM elements and see the impact.</p>
  </div>
</div>

<div class="card">
  <h3>What to Look For in the Beacon</h3>
  <ul>
    <li><code>t_done</code> = total milliseconds for the page to complete loading</li>
    <li><code>t_resp</code> = back-end time (increases with server delay)</li>
    <li><code>t_page</code> = front-end time (increases with DOM complexity)</li>
    <li><code>rt.start</code> = how Boomerang determined the start time (<code>navigation</code> = Navigation Timing API)</li>
    <li><code>rt.tstart</code> = the actual start timestamp</li>
  </ul>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// NAVIGATION TIMING
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["navigation-timing"] = function () {
  return `
<h2 class="scenario-title">Navigation Timing</h2>
<p class="scenario-subtitle">Deep dive into the browser's Navigation Timing API and how Boomerang exposes each phase.</p>

<div class="card">
  <h3>The Navigation Timing Waterfall</h3>
  <p>Every page load goes through distinct phases. The <strong>NavTiming plugin</strong> captures each phase
  from the browser's <code>performance.timing</code> / <code>PerformanceNavigationTiming</code> API.</p>

  <div class="timeline" id="nt-timeline">
    <div class="timeline-bar-group">
      <div class="timeline-label">Redirect</div>
      <div class="timeline-bar-track"><div class="timeline-bar dns" id="nt-redirect" style="left:0%;width:5%">redirect</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">DNS Lookup</div>
      <div class="timeline-bar-track"><div class="timeline-bar dns" id="nt-dns" style="left:5%;width:10%">DNS</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">TCP Connection</div>
      <div class="timeline-bar-track"><div class="timeline-bar tcp" id="nt-tcp" style="left:15%;width:10%">TCP</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">SSL/TLS</div>
      <div class="timeline-bar-track"><div class="timeline-bar ssl" id="nt-ssl" style="left:20%;width:5%">SSL</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">Request (TTFB)</div>
      <div class="timeline-bar-track"><div class="timeline-bar request" id="nt-req" style="left:25%;width:20%">Request</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">Response Download</div>
      <div class="timeline-bar-track"><div class="timeline-bar response" id="nt-resp" style="left:45%;width:10%">Response</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">DOM Processing</div>
      <div class="timeline-bar-track"><div class="timeline-bar dom" id="nt-dom" style="left:55%;width:30%">DOM</div></div>
    </div>
    <div class="timeline-bar-group">
      <div class="timeline-label">Load Event</div>
      <div class="timeline-bar-track"><div class="timeline-bar load" id="nt-load" style="left:85%;width:10%">onLoad</div></div>
    </div>

    <div class="timeline-legend">
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--cyan)"></div> DNS</div>
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--green)"></div> TCP</div>
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--yellow)"></div> SSL</div>
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--orange)"></div> Request</div>
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--blue)"></div> Response</div>
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--accent)"></div> DOM</div>
      <div class="timeline-legend-item"><div class="timeline-legend-dot" style="background:var(--red)"></div> Load</div>
    </div>
  </div>
</div>

<div class="card">
  <h3>Read This Page's Navigation Timing</h3>
  <p>Click the button to read the current page's Navigation Timing values directly from the browser API and see how they map to Boomerang's <code>nt_*</code> beacon parameters.</p>

  <button class="btn" id="nt-read">Read Navigation Timing</button>

  <div class="metric-grid" id="nt-metrics" style="display:none"></div>
</div>

<div class="card">
  <h3>Boomerang Beacon Mapping</h3>
  <div class="code-block"><span class="comment">// Navigation Timing API → Boomerang beacon params</span>
nt_nav_st   = navigationStart       <span class="comment">// Navigation start</span>
nt_red_st   = redirectStart         <span class="comment">// Redirect start</span>
nt_red_end  = redirectEnd           <span class="comment">// Redirect end</span>
nt_dns_st   = domainLookupStart     <span class="comment">// DNS lookup start</span>
nt_dns_end  = domainLookupEnd       <span class="comment">// DNS lookup end</span>
nt_con_st   = connectStart          <span class="comment">// TCP connection start</span>
nt_con_end  = connectEnd            <span class="comment">// TCP connection end</span>
nt_ssl_st   = secureConnectionStart <span class="comment">// SSL negotiation start</span>
nt_req_st   = requestStart          <span class="comment">// Request start</span>
nt_res_st   = responseStart         <span class="comment">// First byte (TTFB)</span>
nt_res_end  = responseEnd           <span class="comment">// Response complete</span>
nt_domint   = domInteractive        <span class="comment">// DOM interactive</span>
nt_domcomp  = domComplete           <span class="comment">// DOM complete</span>
nt_load_st  = loadEventStart        <span class="comment">// Load event start</span>
nt_load_end = loadEventEnd          <span class="comment">// Load event end</span>
nt_first_paint = firstPaint         <span class="comment">// First paint</span></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// PAINT TIMING
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["paint-timing"] = function () {
  return `
<h2 class="scenario-title">Paint Timing (FP / FCP / LCP)</h2>
<p class="scenario-subtitle">Explore how the browser paints content and how Boomerang captures these milestones.</p>

<div class="card">
  <h3>Paint Metrics Explained</h3>
  <ul>
    <li><strong>First Paint (FP)</strong> — The first time anything is rendered to screen (may be just background color).
      Beacon param: <code>pt.fp</code></li>
    <li><strong>First Contentful Paint (FCP)</strong> — First time text, image, or canvas content appears.
      Beacon param: <code>pt.fcp</code></li>
    <li><strong>Largest Contentful Paint (LCP)</strong> — The render time of the largest image or text block visible in the viewport.
      Beacon param: <code>pt.lcp</code></li>
  </ul>
  <div class="info-box">
    <strong>Core Web Vital:</strong> LCP is one of Google's Core Web Vitals. Good = &lt;2.5s, Needs Improvement = 2.5-4s, Poor = &gt;4s.
  </div>
</div>

<div class="card">
  <h3>This Page's Paint Timings</h3>
  <button class="btn" id="pt-read">Read Paint Timings</button>
  <div class="metric-grid" id="pt-metrics" style="display:none"></div>
</div>

<div class="card">
  <h3>Simulate: Late LCP Element</h3>
  <p>Add a large image that loads after a delay. This pushes the LCP later. In the real world, this is like a hero image loading slowly.</p>

  <div class="controls">
    <div class="control-group">
      <label>Image Delay (ms)</label>
      <input type="number" id="pt-img-delay" value="3000" min="0" max="10000" step="500">
    </div>
    <div class="control-group">
      <label>Image Size</label>
      <select id="pt-img-size">
        <option value="200">200x200 (Small)</option>
        <option value="400" selected>400x300 (Medium)</option>
        <option value="800">800x600 (Large)</option>
      </select>
    </div>
    <button class="btn" id="pt-lcp-run">Load Late LCP Image</button>
  </div>

  <div class="action-area" id="pt-lcp-area">
    <p style="color:var(--text-muted)">The late-loading image will appear here.</p>
  </div>
</div>

<div class="card">
  <h3>How Boomerang Captures LCP</h3>
  <p>Boomerang uses the <code>PerformanceObserver</code> API to listen for <code>largest-contentful-paint</code> entries. It records the
  <strong>last</strong> LCP entry before the page becomes hidden or the beacon fires.</p>
  <div class="code-block"><span class="comment">// Simplified LCP observation</span>
<span class="kw">new</span> PerformanceObserver(<span class="kw">function</span>(list) {
  <span class="kw">var</span> entries = list.getEntries();
  <span class="kw">for</span> (<span class="kw">var</span> i = <span class="num">0</span>; i < entries.length; i++) {
    lcpValue = entries[i].renderTime || entries[i].loadTime;
  }
}).observe({ type: <span class="str">"largest-contentful-paint"</span>, buffered: <span class="kw">true</span> });</div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// RESOURCE TIMING
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["resource-timing"] = function () {
  return `
<h2 class="scenario-title">Resource Timing</h2>
<p class="scenario-subtitle">See how Boomerang captures the loading performance of every resource on the page.</p>

<div class="card">
  <h3>How It Works</h3>
  <p>The <strong>ResourceTiming plugin</strong> collects entries from <code>performance.getEntriesByType("resource")</code>
  and compresses them into a compact trie structure in the <code>restiming</code> beacon param.</p>
  <div class="info-box">
    <strong>Why compression?</strong> A typical page loads 50-200 resources. Sending raw timing for each would exceed URL length limits.
    Boomerang encodes durations using base-36 and organizes URLs in a trie to minimize data size.
  </div>
</div>

<div class="card">
  <h3>Simulate: Load Multiple Resources</h3>
  <p>Fetch resources with different delays to see them appear in the resource timing waterfall.</p>

  <div class="controls">
    <div class="control-group">
      <label>Number of Resources</label>
      <input type="number" id="rt-count" value="5" min="1" max="20">
    </div>
    <div class="control-group">
      <label>Max Delay (ms)</label>
      <input type="number" id="rt-delay" value="2000" min="0" max="10000" step="500">
    </div>
    <button class="btn" id="rt-run">Load Resources</button>
  </div>

  <div class="waterfall" id="rt-waterfall" style="display:none"></div>
  <div class="result-log" id="rt-log" style="display:none"></div>
</div>

<div class="card">
  <h3>Read Current Page Resources</h3>
  <p>See all resources loaded by this page from the Resource Timing API.</p>
  <button class="btn" id="rt-read-page">Show Page Resources</button>
  <div class="waterfall" id="rt-page-waterfall" style="display:none"></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// LCP Deep Dive
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS.lcp = function () {
  return `
<h2 class="scenario-title">Largest Contentful Paint (LCP)</h2>
<p class="scenario-subtitle">Understand what elements qualify for LCP and how different loading patterns affect it.</p>

<div class="card">
  <h3>What Counts as LCP?</h3>
  <ul>
    <li><code>&lt;img&gt;</code> elements</li>
    <li><code>&lt;image&gt;</code> inside SVG</li>
    <li><code>&lt;video&gt;</code> poster images</li>
    <li>Elements with CSS <code>background-image</code></li>
    <li>Block-level text elements (<code>&lt;p&gt;</code>, <code>&lt;h1&gt;</code>, etc.)</li>
  </ul>
  <p>LCP reports the <strong>largest</strong> element by visual size in the viewport at the time of render.</p>
  <div class="info-box">
    <strong>Boomerang params:</strong> <code>pt.lcp</code> (time), <code>pt.lcp.src</code> (element source URL), <code>pt.lcp.el</code> (element tag), <code>pt.lcp.id</code> (element ID), <code>pt.lcp.sz</code> (element size)
  </div>
</div>

<div class="card">
  <h3>Experiment: Change What the LCP Element Is</h3>
  <p>Add content to the page and observe how the LCP element changes. The browser continuously updates LCP until
  user interaction or visibility change.</p>

  <div class="controls">
    <div class="control-group">
      <label>Content Type</label>
      <select id="lcp-type">
        <option value="text">Large Text Block</option>
        <option value="image-fast">Fast Image (no delay)</option>
        <option value="image-slow">Slow Image (3s delay)</option>
        <option value="bg-image">CSS Background Image</option>
      </select>
    </div>
    <div class="control-group">
      <label>Size</label>
      <select id="lcp-size">
        <option value="small">Small</option>
        <option value="medium" selected>Medium</option>
        <option value="large">Large</option>
      </select>
    </div>
    <button class="btn" id="lcp-add">Add LCP Candidate</button>
    <button class="btn btn-secondary" id="lcp-clear">Clear Area</button>
  </div>

  <div class="action-area" id="lcp-area">
    <p style="color:var(--text-muted)">LCP candidate elements will appear here.</p>
  </div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// FID & INP
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["fid-inp"] = function () {
  return `
<h2 class="scenario-title">First Input Delay (FID) &amp; Interaction to Next Paint (INP)</h2>
<p class="scenario-subtitle">Measure how responsive the page is to user interactions.</p>

<div class="card">
  <h3>FID vs INP</h3>
  <ul>
    <li><strong>FID (First Input Delay)</strong> — The delay between the user's <em>first</em> interaction (click, tap, keypress)
    and when the browser starts processing it. Beacon param: <code>et.fid</code></li>
    <li><strong>INP (Interaction to Next Paint)</strong> — Measures responsiveness across <em>all</em> interactions during the page lifecycle.
    Reports the worst interaction (98th percentile). Beacon param: <code>et.inp</code></li>
  </ul>
  <div class="info-box">
    <strong>Core Web Vital:</strong> INP replaced FID as a Core Web Vital in March 2024. Good INP = &lt;200ms.
  </div>
</div>

<div class="card">
  <h3>Simulate: Block the Main Thread</h3>
  <p>Before clicking the button below, we'll block the main thread with heavy JavaScript.
  Then your click will be delayed — you'll <em>feel</em> FID and it will show up in the beacon.</p>

  <div class="controls">
    <div class="control-group">
      <label>Block Duration (ms)</label>
      <input type="number" id="fid-block" value="500" min="50" max="5000" step="50">
    </div>
    <button class="btn" id="fid-start-block">Start Blocking, Then Click Me</button>
  </div>

  <div class="result-log" id="fid-log" style="display:none"></div>
</div>

<div class="card">
  <h3>Simulate: Multiple Slow Interactions (INP)</h3>
  <p>INP considers ALL interactions. Click these buttons that have varying processing times.
  The worst one becomes the INP value.</p>

  <div class="action-area" id="inp-area">
    <button class="btn" data-work="50" style="background:var(--green)">Fast (50ms work)</button>
    <button class="btn" data-work="200" style="background:var(--yellow);color:#000">Medium (200ms work)</button>
    <button class="btn" data-work="500" style="background:var(--orange)">Slow (500ms work)</button>
    <button class="btn btn-danger" data-work="1000">Very Slow (1000ms work)</button>
  </div>

  <div class="result-log" id="inp-log" style="display:none"></div>
</div>

<div class="card">
  <h3>How Boomerang Captures Interactions</h3>
  <p>The <strong>EventTiming plugin</strong> uses the Event Timing API (<code>PerformanceObserver</code> for <code>event</code> entries)
  to measure the processing time of each interaction.</p>
  <div class="code-block"><span class="comment">// Beacon parameters</span>
et.fid   = <span class="num">42</span>     <span class="comment">// First Input Delay (ms)</span>
et.inp   = <span class="num">280</span>    <span class="comment">// Interaction to Next Paint (ms)</span>
et.inp.e = <span class="str">"click"</span> <span class="comment">// INP event type</span>
et.inp.t = <span class="num">1234</span>   <span class="comment">// INP interaction timestamp</span>
et.e     = <span class="num">5</span>      <span class="comment">// Total number of interactions</span></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// LONG TASKS
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["long-tasks"] = function () {
  return `
<h2 class="scenario-title">Long Tasks</h2>
<p class="scenario-subtitle">Understand how long-running JavaScript blocks the main thread and degrades user experience.</p>

<div class="card">
  <h3>What is a Long Task?</h3>
  <p>A <strong>Long Task</strong> is any JavaScript execution that takes more than <strong>50ms</strong>.
  During a long task, the browser cannot respond to user input, update animations, or scroll smoothly.</p>
  <p>Boomerang's <strong>Continuity plugin</strong> monitors long tasks using the <code>PerformanceObserver</code>
  Long Tasks API and reports metrics like Time to Interactive (TTI) and Total Blocking Time (TBT).</p>
</div>

<div class="card">
  <h3>Simulate: Long Tasks</h3>
  <p>Create long tasks of different durations. Try scrolling or clicking while they run — you'll notice jank!</p>

  <div class="controls">
    <div class="control-group">
      <label>Task Duration (ms)</label>
      <input type="number" id="lt-duration" value="200" min="10" max="5000" step="50">
    </div>
    <div class="control-group">
      <label>Number of Tasks</label>
      <input type="number" id="lt-count" value="3" min="1" max="20">
    </div>
    <div class="control-group">
      <label>Gap Between (ms)</label>
      <input type="number" id="lt-gap" value="100" min="0" max="2000" step="50">
    </div>
    <button class="btn" id="lt-run">Run Long Tasks</button>
  </div>

  <div class="action-area" id="lt-area">
    <p style="color:var(--text-muted)">Long task execution will be visualized here.</p>
    <div id="lt-progress" style="width:100%;display:none">
      <div style="height:24px;background:var(--bg-card);border-radius:4px;overflow:hidden">
        <div id="lt-bar" style="width:0%;height:100%;background:var(--red);transition:width 0.1s"></div>
      </div>
    </div>
  </div>

  <div class="result-log" id="lt-log" style="display:none"></div>
</div>

<div class="card">
  <h3>Long Tasks vs Total Blocking Time</h3>
  <p><strong>Total Blocking Time (TBT)</strong> is the sum of the "blocking" portions of all long tasks. The blocking portion is everything over 50ms.</p>
  <div class="code-block"><span class="comment">// Example: Three tasks of 200ms, 80ms, 40ms</span>
Task 1: 200ms → blocking portion = 200 - 50 = <span class="num">150ms</span>
Task 2:  80ms → blocking portion =  80 - 50 = <span class="num"> 30ms</span>
Task 3:  40ms → not a long task  =            <span class="num">  0ms</span>
                                     TBT = <span class="num">180ms</span></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// XHR & Fetch
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["xhr-fetch"] = function () {
  return `
<h2 class="scenario-title">XHR &amp; Fetch Instrumentation</h2>
<p class="scenario-subtitle">See how Boomerang automatically tracks AJAX requests and sends beacons for them.</p>

<div class="card">
  <h3>How It Works</h3>
  <p>The <strong>AutoXHR plugin</strong> monkey-patches <code>XMLHttpRequest</code> and <code>fetch()</code> to:
  <ul>
    <li>Measure the time from request start to response complete</li>
    <li>Track response status codes</li>
    <li>Wait for any DOM mutations triggered by the response</li>
    <li>Send a beacon with <code>http.initiator=xhr</code></li>
  </ul>
  <div class="info-box">
    <strong>Key beacon params:</strong> <code>http.initiator</code>, <code>u</code> (XHR URL), <code>pgu</code> (page URL), <code>http.method</code>, <code>http.errno</code> (if error), <code>t_done</code> (XHR total time)
  </div>
</div>

<div class="card">
  <h3>Simulate: XHR Requests</h3>

  <div class="controls">
    <div class="control-group">
      <label>Endpoint</label>
      <select id="xhr-endpoint">
        <option value="/api/slow">Slow Response</option>
        <option value="/api/large">Large Payload</option>
        <option value="/api/error">Server Error</option>
        <option value="/api/redirect">Redirect Chain</option>
        <option value="/api/stream">Streaming Response</option>
      </select>
    </div>
    <div class="control-group">
      <label>Parameter Value</label>
      <input type="number" id="xhr-param" value="1000">
    </div>
    <div class="control-group">
      <label>Method</label>
      <select id="xhr-method">
        <option value="fetch">fetch()</option>
        <option value="xhr">XMLHttpRequest</option>
      </select>
    </div>
    <button class="btn" id="xhr-send">Send Request</button>
  </div>

  <div class="result-log" id="xhr-log" style="display:none"></div>
</div>

<div class="card">
  <h3>Endpoint Reference</h3>
  <div class="code-block"><span class="comment">// Available simulation endpoints:</span>

/api/slow?delay=<span class="num">2000</span>       <span class="comment">// Delayed response (ms)</span>
/api/large?size=<span class="num">500</span>        <span class="comment">// Large payload (KB)</span>
/api/error?status=<span class="num">500</span>      <span class="comment">// HTTP error response</span>
/api/redirect?hops=<span class="num">3</span>      <span class="comment">// Redirect chain</span>
/api/stream?chunks=<span class="num">5</span>&amp;interval=<span class="num">500</span> <span class="comment">// Streaming chunks</span></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// SPA Navigation
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS.spa = function () {
  return `
<h2 class="scenario-title">SPA Navigation</h2>
<p class="scenario-subtitle">Explore how Boomerang tracks navigations in Single Page Applications without full page reloads.</p>

<div class="card">
  <h3>Hard Nav vs Soft Nav</h3>
  <ul>
    <li><strong>Hard Navigation</strong> (<code>http.initiator=spa_hard</code>) — The initial full page load of an SPA. Measured like a normal page load.</li>
    <li><strong>Soft Navigation</strong> (<code>http.initiator=spa</code>) — Route changes within the SPA that use the History API
    (<code>pushState</code>/<code>replaceState</code>) and fetch data via XHR/Fetch. No full page reload.</li>
  </ul>
  <div class="info-box">
    <strong>How Boomerang detects soft navigations:</strong> The History plugin listens for <code>popstate</code> events and patches
    <code>history.pushState</code>/<code>replaceState</code>. When a route change + XHR/Fetch completes, it sends a beacon with <code>http.initiator=spa</code>.
  </div>
</div>

<div class="card">
  <h3>Simulate: SPA Navigation</h3>
  <p>Click the tabs below to simulate SPA route changes. Each click pushes a new history state and fetches page content via XHR.</p>

  <div class="controls">
    <div class="control-group">
      <label>Navigation Delay (ms)</label>
      <input type="number" id="spa-delay" value="500" min="0" max="5000" step="100">
    </div>
  </div>

  <div class="spa-demo" id="spa-demo">
    <div class="spa-demo-nav">
      <button class="active" data-page="home">Home</button>
      <button data-page="about">About</button>
      <button data-page="dashboard">Dashboard</button>
      <button data-page="settings">Settings</button>
    </div>
    <div class="spa-demo-content" id="spa-content">
      <h3>Home</h3>
      <p>Welcome to the SPA playground. Click a tab to navigate.</p>
    </div>
  </div>

  <div class="result-log" id="spa-log" style="display:none"></div>
</div>

<div class="card">
  <h3>What to Look For</h3>
  <ul>
    <li><code>http.initiator</code> = <code>spa</code> for soft navs</li>
    <li><code>u</code> = the XHR URL that fetched the page data</li>
    <li><code>pgu</code> = the page URL after <code>pushState</code></li>
    <li><code>t_done</code> = time from route change to content rendered</li>
    <li><code>rt.tstart</code> = timestamp of the route change</li>
  </ul>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// Error Tracking
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS.errors = function () {
  return `
<h2 class="scenario-title">Error Tracking</h2>
<p class="scenario-subtitle">See how Boomerang captures JavaScript errors, XHR failures, and unhandled promise rejections.</p>

<div class="card">
  <h3>Error Types Tracked</h3>
  <p>The <strong>Errors plugin</strong> captures:</p>
  <ul>
    <li><strong>Runtime JS errors</strong> — via <code>window.onerror</code></li>
    <li><strong>Unhandled Promise rejections</strong> — via <code>unhandledrejection</code> event</li>
    <li><strong>Console errors</strong> — wraps <code>console.error()</code></li>
    <li><strong>XHR/Fetch errors</strong> — HTTP errors (4xx/5xx) and network failures</li>
  </ul>
  <div class="info-box">
    <strong>Beacon params:</strong> Errors are compressed and sent in the <code>err</code> beacon parameter, or as a separate error beacon with <code>http.initiator=error</code>.
  </div>
</div>

<div class="card">
  <h3>Trigger Errors</h3>

  <div class="controls" style="flex-direction:column; align-items:stretch; gap:8px;">
    <button class="btn btn-danger" id="err-js">Throw JavaScript Error</button>
    <button class="btn btn-danger" id="err-promise">Unhandled Promise Rejection</button>
    <button class="btn btn-danger" id="err-xhr">XHR to Error Endpoint (500)</button>
    <button class="btn btn-danger" id="err-404">Fetch Non-Existent URL (404)</button>
    <button class="btn" id="err-console" style="background:var(--yellow);color:#000">Console Error</button>
  </div>

  <div class="result-log" id="err-log" style="display:none"></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// Network & Bandwidth
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS.bandwidth = function () {
  return `
<h2 class="scenario-title">Network &amp; Bandwidth</h2>
<p class="scenario-subtitle">Explore how Boomerang captures network information and connection quality.</p>

<div class="card">
  <h3>Network Information API</h3>
  <p>The <strong>Mobile plugin</strong> reads the browser's Network Information API to report:</p>
  <ul>
    <li><code>mob.ct</code> — Connection type (wifi, cellular, ethernet, etc.)</li>
    <li><code>mob.bw</code> — Downlink bandwidth estimate (Mbps)</li>
    <li><code>mob.etype</code> — Effective connection type (4g, 3g, 2g, slow-2g)</li>
    <li><code>mob.rtt</code> — Round-trip time estimate (ms)</li>
    <li><code>mob.dl</code> — Downlink speed (Mbps)</li>
  </ul>
</div>

<div class="card">
  <h3>Your Current Network Info</h3>
  <button class="btn" id="net-read">Read Network Info</button>
  <div class="metric-grid" id="net-metrics" style="display:none"></div>
  <div class="info-box" id="net-no-api" style="display:none">
    <strong>Note:</strong> The Network Information API is not available in this browser (it's mainly supported in Chromium-based browsers).
  </div>
</div>

<div class="card">
  <h3>Simulate: Large Downloads</h3>
  <p>Download large payloads and observe the transfer speed.</p>

  <div class="controls">
    <div class="control-group">
      <label>Payload Size (KB)</label>
      <input type="number" id="net-size" value="500" min="10" max="5000" step="100">
    </div>
    <button class="btn" id="net-download">Download Payload</button>
  </div>

  <div class="result-log" id="net-log" style="display:none"></div>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// Speculation Rules & Prerender
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["speculation-prerender"] = function () {
  return `
<h2 class="scenario-title">Speculation Rules &amp; Prerender</h2>
<p class="scenario-subtitle">Validate how prerendered navigations behave and how Boomerang beacons look after activation.</p>

<div class="card">
  <h3>How This Is Wired</h3>
  <p>This playground injects a <code>&lt;script type="speculationrules"&gt;</code> block on the main page to prerender a few same-origin URLs. Use the links below to navigate to those pages and verify prerender activation timing.</p>
  <div class="info-box">
    <strong>Note:</strong> Speculation Rules prerender currently works best in Chromium-based browsers. If unsupported, links still work as normal navigations.
  </div>
</div>

<div class="card">
  <h3>Prerender Test Links</h3>
  <p>Open one of these targets from this page. If prerender was successful, the destination page should report <code>navigation.activationStart &gt; 0</code> and/or <code>document.prerendering</code> lifecycle transitions.</p>

  <div class="controls">
    <button class="btn" id="sp-apply-rules">Apply Speculation Rules Now</button>
    <button class="btn btn-secondary" id="sp-refresh-status">Refresh API Status</button>
  </div>

  <div class="metric-grid" id="sp-status-grid">
    <div class="metric-card"><div class="metric-label">Speculation Rules Support</div><div class="metric-value" style="font-size:18px" id="sp-support">-</div></div>
    <div class="metric-card"><div class="metric-label">Rules Installed</div><div class="metric-value" style="font-size:18px" id="sp-installed">-</div></div>
    <div class="metric-card"><div class="metric-label">document.prerendering</div><div class="metric-value" style="font-size:18px" id="sp-prerendering">-</div></div>
    <div class="metric-card"><div class="metric-label">activationStart</div><div class="metric-value" style="font-size:18px" id="sp-activation">-</div></div>
    <div class="metric-card"><div class="metric-label">Boomerang Variant</div><div class="metric-value" style="font-size:18px" id="sp-boomr-variant">-</div></div>
  </div>

  <div class="prerender-links">
    <a class="prerender-link" href="/prerender/overview" data-prerender-preview="/prerender/overview">
      <strong>Open /prerender/overview</strong><br>
      Review the overview page with activation diagnostics and a validation checklist.
    </a>
    <a class="prerender-link" href="/prerender/metrics" data-prerender-preview="/prerender/metrics">
      <strong>Open /prerender/metrics</strong><br>
      Compare navigation timing values such as response end, DOM content loaded, and load event end.
    </a>
    <a class="prerender-link" href="/prerender/network" data-prerender-preview="/prerender/network">
      <strong>Open /prerender/network</strong><br>
      Inspect prerender behavior alongside effective connection type, downlink, RTT, and save-data state.
    </a>
  </div>

  <div class="info-box" style="margin-top:12px">
    <strong>Tip:</strong> You can force Boomerang mode from URL: <code>?boomr=debug</code>, <code>?boomr=min</code>, or <code>?boomr=edge</code>.
  </div>
</div>

<div class="card">
  <h3>Inline Preview</h3>
  <p>Select a prerender target below to load that real route inside the playground, then use the direct link if you want to navigate the full page.</p>

  <div class="controls">
    <a class="btn" id="sp-preview-overview" href="/prerender/overview" data-preview-src="/prerender/overview">Preview Overview</a>
    <a class="btn btn-secondary" id="sp-preview-metrics" href="/prerender/metrics" data-preview-src="/prerender/metrics">Preview Metrics</a>
    <a class="btn btn-secondary" id="sp-preview-network" href="/prerender/network" data-preview-src="/prerender/network">Preview Network</a>
  </div>

  <div class="info-box" id="sp-preview-summary">
    <strong>Previewing:</strong> <code>/prerender/overview</code> — overview diagnostics and validation checklist.
  </div>

  <div class="action-area" style="padding:12px; min-height:auto; align-items:stretch;">
    <iframe
      id="sp-preview-frame"
      title="Prerender Target Preview"
      src="/prerender/overview"
      style="width:100%;height:520px;border:1px solid var(--border);border-radius:8px;background:var(--bg)">
    </iframe>
  </div>
</div>

<div class="card">
  <h3>What to Check</h3>
  <ul>
    <li><code>document.prerendering</code> state and <code>prerenderingchange</code> event on destination pages</li>
    <li><code>PerformanceNavigationTiming.activationStart</code> value (non-zero usually means prerender activation occurred)</li>
    <li>Beacon Inspector entries right after activation/navigation for timing differences vs non-prerender nav</li>
  </ul>
</div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// LCP (Largest Contentful Paint)
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["lcp"] = function () {
  return `
<h2 class="scenario-title">Largest Contentful Paint (LCP)</h2>
<p class="scenario-subtitle">Coming soon — LCP measurement and optimization guide</p>
<div class="card"><p>This scenario is under development.</p></div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// SPA Navigation
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["spa"] = function () {
  return `
<h2 class="scenario-title">SPA Navigation</h2>
<p class="scenario-subtitle">Coming soon — Single Page App navigation tracking</p>
<div class="card"><p>This scenario is under development.</p></div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// Error Tracking
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["errors"] = function () {
  return `
<h2 class="scenario-title">Error Tracking</h2>
<p class="scenario-subtitle">Coming soon — JavaScript error and promise rejection handling</p>
<div class="card"><p>This scenario is under development.</p></div>
`;
};

// ─────────────────────────────────────────────────────────────────────
// Network & Bandwidth
// ─────────────────────────────────────────────────────────────────────
window.SCENARIOS["bandwidth"] = function () {
  return `
<h2 class="scenario-title">Network &amp; Bandwidth</h2>
<p class="scenario-subtitle">Coming soon — Network Information API and bandwidth insights</p>
<div class="card"><p>This scenario is under development.</p></div>
`;
};
