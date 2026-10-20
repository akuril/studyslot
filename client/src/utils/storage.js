// Small browser-storage helpers. In StudySlot, localStorage holds only
// per-device preferences (the theme). Accounts and bookings live on the server.

// Every StudySlot key starts with this prefix, so they're easy to find in DevTools
// and won't clash with other apps on the same address (localhost).
const STORAGE_PREFIX = 'studyslot-';

/**
 * Loads a value from localStorage.
 * Returns `fallbackValue` if nothing is saved yet, or if loading fails.
 */
export function loadFromStorage(key, fallbackValue) {
  try {
    const savedText = localStorage.getItem(STORAGE_PREFIX + key);

    if (savedText === null) {
      return fallbackValue;
    }

    return JSON.parse(savedText);
  } catch (error) {
    console.error(`StudySlot: could not load "${key}" from storage.`, error);
    return fallbackValue;
  }
}

/**
 * Saves a value to localStorage as JSON text.
 * Returns true if it worked, false if the browser refused (blocked or full).
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`StudySlot: could not save "${key}" to storage.`, error);
    return false;
  }
}
