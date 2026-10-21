import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/services', label: 'Services', icon: '📚' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, status, logout } = useAuth();

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  // On a protected page, ProtectedRoute then sends the user home.
  // On a public page (e.g. Services), they simply stay where they are.
  function handleLogout() {
    closeMenu();
    logout();
  }

  const { pathname } = useLocation();
  const linkClass = ({ isActive }) => `nav-link px-3 ${isActive ? 'active' : ''}`;
  // "My bookings" also stays highlighted while viewing or changing one booking.
  const bookingsLinkClass = ({ isActive }) =>
    linkClass({ isActive: isActive || pathname.startsWith('/bookings/') });

  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom shadow-sm sticky-top">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-primary" onClick={closeMenu}>
          🎓 StudySlot
        </Link>

        <button
          type="button"
          className="navbar-toggler"
          onClick={toggleMenu}
          aria-controls="main-nav"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div id="main-nav" className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto mt-2 mt-lg-0 gap-1">
            {navItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass} onClick={closeMenu}>
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
            {user && (
              <li className="nav-item">
                <NavLink to="/dashboard" className={bookingsLinkClass} onClick={closeMenu}>
                  <span aria-hidden="true">🗓️</span>
                  My bookings
                </NavLink>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <NavLink to="/account" className={linkClass} onClick={closeMenu}>
                  <span aria-hidden="true">👤</span>
                  {user.name.split(' ')[0]}
                </NavLink>
              </li>
            )}
          </ul>

          {/* Nothing is shown while a saved login is being checked, to avoid a flash
              of "Log in" for someone who is actually logged in. */}
          {status === 'ready' && (
            <div className="d-flex flex-column flex-lg-row gap-2 ms-lg-3 mt-2 mt-lg-0">
              {user ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary nav-button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-outline-primary nav-button"
                    onClick={closeMenu}
                  >
                    Log in
                  </Link>
                  <Link to="/register" className="btn btn-primary nav-button" onClick={closeMenu}>
                    Create account
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="ms-lg-2 my-2 my-lg-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
