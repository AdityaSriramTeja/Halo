chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Listen for keyboard commands (global shortcuts)
chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-mic") {
        // Send message to the side panel to toggle the mic
        chrome.runtime.sendMessage({ type: "TOGGLE_MIC" }).catch(() => {
            // Ignore error if side panel is not open
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getShortcut") {
        chrome.commands.getAll((commands) => {
            const command = commands.find(
                (cmd) => cmd.name === "_execute_action"
            );
            sendResponse({
                shortcut: command ? command.shortcut : "Ctrl+Shift+Z",
            });
        });
        return true;
    }
});
