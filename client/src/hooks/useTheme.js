import { useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

const THEME_SETTINGS = ['auto', 'light', 'dark'];
const DARK_QUERY = '(prefers-color-scheme: dark)';

function getDeviceTheme() {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/**
 * Manages light/dark mode.
 * themeSetting = what the user chose ('auto' | 'light' | 'dark')
 * activeTheme  = what's actually showing ('light' | 'dark')
 */
export function useTheme() {
  const [themeSetting, setThemeSetting] = useState(() => {
    const saved = loadFromStorage('theme', 'auto');
    return THEME_SETTINGS.includes(saved) ? saved : 'auto';
  });

  const [deviceTheme, setDeviceTheme] = useState(getDeviceTheme);

  const activeTheme = themeSetting === 'auto' ? deviceTheme : themeSetting;

  // 1. Follow the device's light/dark setting when it changes (e.g. at sunset).
  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_QUERY);

    function handleDeviceChange(event) {
      setDeviceTheme(event.matches ? 'dark' : 'light');
    }

    mediaQuery.addEventListener('change', handleDeviceChange);
    return () => mediaQuery.removeEventListener('change', handleDeviceChange);
  }, []);

  // 2. Apply the theme to the whole page.
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', activeTheme);
  }, [activeTheme]);

  // 3. Remember the user's choice.
  useEffect(() => {
    saveToStorage('theme', themeSetting);
  }, [themeSetting]);

  // 4. Always print in light mode (dark pages waste ink and are hard to read on paper).
  useEffect(() => {
    function useLightForPrinting() {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    function restoreAfterPrinting() {
      document.documentElement.setAttribute('data-bs-theme', activeTheme);
    }

    window.addEventListener('beforeprint', useLightForPrinting);
    window.addEventListener('afterprint', restoreAfterPrinting);

    return () => {
      window.removeEventListener('beforeprint', useLightForPrinting);
      window.removeEventListener('afterprint', restoreAfterPrinting);
    };
  }, [activeTheme]);

  // Auto → Light → Dark → Auto …
  function cycleTheme() {
    setThemeSetting((current) => {
      const nextIndex = (THEME_SETTINGS.indexOf(current) + 1) % THEME_SETTINGS.length;
      return THEME_SETTINGS[nextIndex];
    });
  }

  return { themeSetting, activeTheme, cycleTheme };
}