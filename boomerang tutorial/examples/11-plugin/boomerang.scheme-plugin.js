/**
 * Example Boomerang plugin for the tutorial (Lesson 11).
 *
 * Adds basic page info to the beacon:
 *   <prefix>.scheme  -> "dark" | "light" (prefers-color-scheme)
 *   <prefix>.imgs    -> number of <img> elements (if countImages !== false)
 *   <prefix>.vw      -> viewport width
 *   <prefix>.vh      -> viewport height
 *
 * Config:
 *   PageInfo: { prefix: "pi", countImages: true }
 */
(function () {
  // Make sure BOOMR is defined (the plugin may load before boomerang.js)
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  // Don't double-register
  if (BOOMR.plugins.PageInfo) {
    return;
  }

  // Private state with defaults
  var impl = {
    initialized: false,
    complete: false,
    prefix: "pi",
    countImages: true
  };

  impl.onPageReady = function () {
    var scheme = (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";

    BOOMR.addVar(impl.prefix + ".scheme", scheme);
    BOOMR.addVar(impl.prefix + ".vw", window.innerWidth);
    BOOMR.addVar(impl.prefix + ".vh", window.innerHeight);

    if (impl.countImages !== false) {
      BOOMR.addVar(impl.prefix + ".imgs", document.images.length);
    }

    impl.complete = true;
  };

  BOOMR.plugins.PageInfo = {
    init: function (config) {
      // Import user config into impl
      BOOMR.utils.pluginConfig(impl, config, "PageInfo", ["prefix", "countImages"]);

      // Subscribe only once
      if (!impl.initialized) {
        BOOMR.subscribe("page_ready", impl.onPageReady, null, impl);
        impl.initialized = true;
      }

      return this;
    },

    is_complete: function () {
      return impl.complete;
    }
  };
}());
