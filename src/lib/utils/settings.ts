/**
 * Settings Storage Utility
 * Manages user proficiency settings in Chrome storage
 */

import {
  LanguageProficiencySettings,
  DEFAULT_SETTINGS,
} from "@/types/settings";

const SETTINGS_KEY = "halo_language_settings";

/**
 * Load user's language proficiency settings from Chrome storage
 */
export async function loadSettings(): Promise<LanguageProficiencySettings> {
  try {
    if (!chrome?.storage?.local) {
      console.warn("Chrome storage not available, using defaults");
      return DEFAULT_SETTINGS;
    }

    const result = await chrome.storage.local.get(SETTINGS_KEY);
    if (result[SETTINGS_KEY]) {
      return result[SETTINGS_KEY] as LanguageProficiencySettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user's language proficiency settings to Chrome storage
 */
export async function saveSettings(
  settings: LanguageProficiencySettings
): Promise<void> {
  try {
    if (!chrome?.storage?.local) {
      console.warn("Chrome storage not available");
      return;
    }

    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    console.log("Settings saved successfully:", settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}
