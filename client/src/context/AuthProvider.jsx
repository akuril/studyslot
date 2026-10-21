import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { setAuthToken, onUnauthorized } from '../api/client';
import * as authApi from '../api/auth';
import { loadFromStorage, saveToStorage, removeFromStorage, storageKey } from '../utils/storage';

// Where the login token is kept between visits (see "Token storage" in Step 24).
const TOKEN_KEY = 'token';

function readSavedToken() {
  const token = loadFromStorage(TOKEN_KEY, null);
  return typeof token === 'string' && token !== '' ? token : null;
}

export function AuthProvider({ children }) {
  // status: 'restoring' while a saved login is being checked with the server, then 'ready'.
  // signedOutReason: why there's no user: 'logout' (clicked Log out), 'expired'
  // (the server rejected the token), or null (simply not logged in).
  const [state, setState] = useState(() => ({
    user: null,
    status: readSavedToken() ? 'restoring' : 'ready',
    signedOutReason: null,
  }));

  // Clears the login everywhere: memory, the API client, and storage.
  const clearSession = useCallback((signedOutReason) => {
    removeFromStorage(TOKEN_KEY);
    setAuthToken(null);
    setState({ user: null, status: 'ready', signedOutReason });
  }, []);

  // 1. On first load, restore a saved login by asking the server (GET /api/auth/me).
  useEffect(() => {
    const token = readSavedToken();
    if (!token) {
      return undefined;
    }

    const controller = new AbortController();
    setAuthToken(token);

    authApi.getCurrentUser({ signal: controller.signal }).then(
      ({ user }) => setState({ user, status: 'ready', signedOutReason: null }),
      (error) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error.status === 401) {
          // Expired or invalid token: forget it.
          clearSession('expired');
        } else {
          // Server unreachable: keep the saved token so the next visit can try again,
          // but treat the user as logged out for now.
          setAuthToken(null);
          setState({ user: null, status: 'ready', signedOutReason: null });
        }
      },
    );

    return () => controller.abort();
  }, [clearSession]);

  // 2. If any API call later returns 401 (e.g. the token expired mid-visit), log out.
  useEffect(() => {
    onUnauthorized(() => clearSession('expired'));
    return () => onUnauthorized(null);
  }, [clearSession]);

  // 3. Logging out in one tab logs out the other open tabs too.
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === storageKey(TOKEN_KEY) && event.newValue === null) {
        setAuthToken(null);
        setState({ user: null, status: 'ready', signedOutReason: 'logout' });
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const startSession = useCallback(({ token, user }) => {
    saveToStorage(TOKEN_KEY, token);
    setAuthToken(token);
    setState({ user, status: 'ready', signedOutReason: null });
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await authApi.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (details) => startSession(await authApi.register(details)),
    [startSession],
  );

  const logout = useCallback(() => clearSession('logout'), [clearSession]);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      signedOutReason: state.signedOutReason,
      sessionExpired: state.signedOutReason === 'expired',
      login,
      register,
      logout,
    }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
