// Focus Mode Content Script
// This script removes distracting elements from web pages

// Prevent multiple injections
if (window.haloFocusModeLoaded) {
  console.log("[Halo Focus Mode] Already loaded, skipping");
} else {
  window.haloFocusModeLoaded = true;

  let isFocusModeActive = false;
  const focusModeClass = "halo-focus-mode-hidden";

  // Comprehensive selectors for elements to hide in focus mode
  const SELECTORS = {
    images: [
      'img:not([role="presentation"])',
      "figure",
      "picture",
      '[class*="image"]',
      '[class*="photo"]',
      '[class*="picture"]',
      '[id*="image"]',
      '[id*="photo"]',
    ].join(", "),
    videos: [
      "video",
      'iframe[src*="youtube"]',
      'iframe[src*="vimeo"]',
      'iframe[src*="dailymotion"]',
      'iframe[src*="twitch"]',
      '[class*="video"]',
      '[id*="video"]',
    ].join(", "),
    sidebars: [
      "aside",
      '[role="complementary"]',
      '[class*="sidebar"]',
      '[class*="side-bar"]',
      '[class*="rail"]',
      '[id*="sidebar"]',
      '[id*="side-bar"]',
      '[id*="rail"]',
      ".widget",
      '[class*="widget"]',
      '[class*="aside"]',
    ].join(", "),
    headers: [
      "header",
      '[role="banner"]',
      '[class*="header"]',
      '[class*="masthead"]',
      '[id*="header"]',
      '[id*="masthead"]',
      "nav",
      '[role="navigation"]',
      '[class*="navbar"]',
      '[class*="nav-bar"]',
      '[class*="navigation"]',
      '[id*="navbar"]',
      '[id*="navigation"]',
    ].join(", "),
    footers: [
      "footer",
      '[role="contentinfo"]',
      '[class*="footer"]',
      '[id*="footer"]',
    ].join(", "),
    ads: [
      '[class*="ad-"]',
      '[class*="ads-"]',
      '[id*="ad-"]',
      '[id*="ads-"]',
      '[class*="advertisement"]',
      '[id*="advertisement"]',
      '[class*="sponsor"]',
      '[id*="sponsor"]',
      ".ad",
      "#ad",
    ].join(", "),
    social: [
      '[class*="social"]',
      '[class*="share"]',
      '[id*="social"]',
      '[id*="share"]',
    ].join(", "),
    related: [
      '[class*="related"]',
      '[class*="recommended"]',
      '[id*="related"]',
      '[id*="recommended"]',
    ].join(", "),
  };

  // Create and inject CSS for focus mode
  function injectFocusModeStyles() {
    const styleId = "halo-focus-mode-styles";

    // Check if styles already exist
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
    .${focusModeClass} {
      display: none !important;
      visibility: hidden !important;
    }
  `;

    document.head.appendChild(style);
  }

  // Apply focus mode by hiding distracting elements
  function applyFocusMode() {
    console.log("[Halo Focus Mode] Activating focus mode...");

    // Hide all specified elements
    const allSelectors = [
      { selector: SELECTORS.images, name: "images" },
      { selector: SELECTORS.videos, name: "videos" },
      { selector: SELECTORS.sidebars, name: "sidebars" },
      { selector: SELECTORS.headers, name: "headers" },
      { selector: SELECTORS.footers, name: "footers" },
      { selector: SELECTORS.ads, name: "ads" },
      { selector: SELECTORS.social, name: "social" },
      { selector: SELECTORS.related, name: "related" },
    ];

    let hiddenCount = 0;

    allSelectors.forEach(({ selector }) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          // Don't hide if already hidden or if it's a tiny element
          if (element.offsetWidth === 0 || element.offsetHeight === 0) return;

          element.classList.add(focusModeClass);
          element.setAttribute("data-halo-focus-hidden", "true");
          hiddenCount++;
        });
      } catch (e) {
        console.warn("[Halo Focus Mode] Error applying selector:", selector, e);
      }
    });

    console.log(
      `[Halo Focus Mode] Focus mode activated - ${hiddenCount} elements hidden`
    );
  }

  // Remove focus mode and restore all elements
  function removeFocusMode() {
    console.log("[Halo Focus Mode] Deactivating focus mode...");

    // Restore all hidden elements
    const hiddenElements = document.querySelectorAll(
      `[data-halo-focus-hidden="true"]`
    );
    hiddenElements.forEach((element) => {
      element.classList.remove(focusModeClass);
      element.removeAttribute("data-halo-focus-hidden");
    });

    console.log("[Halo Focus Mode] Focus mode deactivated");
  }

  // Toggle focus mode
  function toggleFocusMode(enabled) {
    isFocusModeActive = enabled;

    if (enabled) {
      applyFocusMode();
      startObserver();
    } else {
      removeFocusMode();
      stopObserver();
    }

    // Store state in sessionStorage for page refreshes
    try {
      sessionStorage.setItem("halo-focus-mode", enabled ? "true" : "false");
    } catch (e) {
      console.warn("[Halo Focus Mode] Could not save state:", e);
    }
  }

  // MutationObserver to handle dynamically added content
  let observer = null;

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      let shouldReapply = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldReapply = true;
          break;
        }
      }

      if (shouldReapply && isFocusModeActive) {
        // Debounce the reapply
        clearTimeout(window.haloFocusModeTimeout);
        window.haloFocusModeTimeout = setTimeout(() => {
          applyFocusMode();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("[Halo Focus Mode] Observer started for dynamic content");
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
      console.log("[Halo Focus Mode] Observer stopped");
    }
  }

  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TOGGLE_FOCUS_MODE") {
      console.log(
        "[Halo Focus Mode] Received toggle message:",
        message.enabled
      );
      toggleFocusMode(message.enabled);
      sendResponse({ success: true, enabled: isFocusModeActive });
      return true;
    }

    if (message.type === "GET_FOCUS_MODE_STATE") {
      sendResponse({ enabled: isFocusModeActive });
      return true;
    }
  });

  // Initialize: Inject styles and check for stored state
  function initialize() {
    injectFocusModeStyles();

    // Check if focus mode was active before page reload
    try {
      const storedState = sessionStorage.getItem("halo-focus-mode");
      if (storedState === "true") {
        toggleFocusMode(true);
      }
    } catch (e) {
      console.warn("[Halo Focus Mode] Could not restore state:", e);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  console.log("[Halo Focus Mode] Content script loaded");
} // End of window.haloFocusModeLoaded check
