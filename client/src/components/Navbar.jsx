import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

// More links (Services, My Bookings, Log in) are added as those pages are built.
const navItems = [{ to: '/', label: 'Home', icon: '🏠', end: true }];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

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
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link px-3 ${isActive ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="ms-lg-2 mb-2 mb-lg-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
