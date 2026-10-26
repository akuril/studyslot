import { createContext, useContext } from 'react';

// Shared login state. The provider component lives in AuthProvider.jsx
// (kept separate so Vite's Fast Refresh works; same pattern as HomeworkHQ's planner context).
export const AuthContext = createContext(null);

/**
 * Lets any component read and change the login state:
 *   const { user, status, login, register, logout, updateUser, sessionExpired, signedOutReason } = useAuth();
 *   status: 'restoring' (checking a saved login) | 'ready'
 *   signedOutReason: 'logout' | 'expired' | null
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth() must be used inside <AuthProvider>.');
  }

  return context;
}
