import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

/**
 * Wraps pages that need a login. Logged-out visitors are sent to /login, and come
 * back to the page they wanted afterwards.
 *
 * This only improves the EXPERIENCE. Real security is on the server: every
 * protected API route checks the token itself (Steps 17-18).
 */
function ProtectedRoute() {
  const { user, status, signedOutReason } = useAuth();
  const location = useLocation();

  if (status === 'restoring') {
    return <LoadingState label="Checking your login…" />;
  }

  // Just clicked "Log out" on a protected page: go home, not to the login form.
  if (!user && signedOutReason === 'logout') {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
