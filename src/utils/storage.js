// All HomeworkHQ keys start with this prefix, so they're easy to find
// in DevTools and won't clash with other apps on the same address (localhost).
const STORAGE_PREFIX = 'homeworkhq-';

// ===== Save status: a tiny "external store" React can subscribe to =====

let saveFailed = false;
const listeners = new Set();

function markSaveFailed() {
  if (saveFailed) {
    return;
  }

  saveFailed = true;
  listeners.forEach((listener) => listener());
}

/** Lets React listen for save-status changes. Returns an "unsubscribe" function. */
export function subscribeToSaveStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True if any save has failed since the page loaded. */
export function getSaveFailed() {
  return saveFailed;
}

// ===== Loading and saving =====

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
    console.error(`HomeworkHQ: could not load "${key}" from storage.`, error);
    return fallbackValue;
  }
}

/**
 * Saves a value to localStorage as JSON text.
 * Returns true if it worked. If the browser refuses (blocked or full),
 * returns false and notifies any subscribers.
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`HomeworkHQ: could not save "${key}" to storage.`, error);
    markSaveFailed();
    return false;
  }
}