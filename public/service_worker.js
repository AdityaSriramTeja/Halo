chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-mic") {
    chrome.runtime.sendMessage({ type: "TOGGLE_MIC" }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getShortcut") {
    chrome.commands.getAll((commands) => {
      const command = commands.find((cmd) => cmd.name === "_execute_action");
      sendResponse({
        shortcut: command ? command.shortcut : "Ctrl+Shift+Z",
      });
    });
    return true;
  }

  if (request.action === "toggleFocusMode") {
    chrome.tabs.query({ active: true, windowType: "normal" }, async (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0]?.id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      const tab = tabs[0];

      if (
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith("chrome-extension://") ||
        tab.url?.startsWith("about:") ||
        tab.url?.startsWith("edge://")
      ) {
        sendResponse({
          success: false,
          error: "Focus mode cannot be used on browser internal pages",
        });
        return;
      }

      try {
        await chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["focus-mode.js"],
          })
          .catch(() => {});
      } catch (e) {
        console.log("Script injection note:", e.message);
      }

      setTimeout(() => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: "TOGGLE_FOCUS_MODE",
            enabled: request.enabled,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Focus mode error:", chrome.runtime.lastError);
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              });
            } else {
              sendResponse({ success: true, response });
            }
          }
        );
      }, 100);
    });
    return true;
  }

  if (request.action === "transformWebsite") {
    chrome.tabs.query({ active: true, windowType: "normal" }, async (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0]?.id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      const tab = tabs[0];

      if (
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith("chrome-extension://") ||
        tab.url?.startsWith("about:") ||
        tab.url?.startsWith("edge://")
      ) {
        sendResponse({
          success: false,
          error: "Transform cannot be used on browser internal pages",
        });
        return;
      }

      try {
        await chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["transform-website.js"],
          })
          .catch(() => {});
      } catch (e) {
        console.log("Transform script injection note:", e.message);
      }

      setTimeout(() => {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "EXTRACT_CONTENT" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Transform error:", chrome.runtime.lastError);
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              });
            } else {
              sendResponse(response);
            }
          }
        );
      }, 100);
    });
    return true;
  }

  if (request.action === "extractQuizContent") {
    chrome.tabs.query({ active: true, windowType: "normal" }, async (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0]?.id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      const tab = tabs[0];

      if (
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith("chrome-extension://") ||
        tab.url?.startsWith("about:") ||
        tab.url?.startsWith("edge://")
      ) {
        sendResponse({
          success: false,
          error: "Quiz cannot be generated on browser internal pages",
        });
        return;
      }

      try {
        await chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["transform-website.js"],
          })
          .catch(() => {
            // Already injected
          });
      } catch (e) {
        console.log("Quiz script injection note:", e.message);
      }

      setTimeout(() => {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "EXTRACT_QUIZ_CONTENT" },
          (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              });
            } else {
              sendResponse(response);
            }
          }
        );
      }, 100);
    });
    return true;
  }

  if (request.action === "showTransformedContent") {
    chrome.tabs.query({ active: true, windowType: "normal" }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0]?.id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          type: "SHOW_TRANSFORMED_CONTENT",
          transformedSegments: request.transformedSegments,
          delimiter: request.delimiter,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse(response);
          }
        }
      );
    });
    return true;
  }
});
