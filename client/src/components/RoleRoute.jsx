import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../utils/roles';

/**
 * Inside <ProtectedRoute>: pages for ONE kind of account. Anyone else is sent to
 * their own dashboard. (The server enforces the same rule with 403 responses;
 * this only keeps people out of pages that would not work for them.)
 */
function RoleRoute({ role }) {
  const { user } = useAuth();
  if (user.role !== role) {
    return <Navigate to={homePathFor(user)} replace />;
  }
  return <Outlet />;
}

export default RoleRoute;
