export async function toggleFocusMode(currentState: boolean): Promise<boolean> {
  const newFocusState = !currentState;
  console.log("Toggling focus mode to:", newFocusState);

  try {
    const response = await chrome.runtime.sendMessage({
      action: "toggleFocusMode",
      enabled: newFocusState,
    });

    if (response?.success) {
      console.log("Focus mode toggled successfully");
      return newFocusState;
    } else {
      console.error("Failed to toggle focus mode:", response?.error);
      alert(
        "Failed to toggle focus mode. Please ensure you're on a regular webpage (not chrome:// or extension pages) and try again."
      );
      return currentState;
    }
  } catch (error) {
    console.error("Error toggling focus mode:", error);
    alert(
      "An error occurred. Please ensure you're on a regular webpage and try again."
    );
    return currentState;
  }
}
