import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/today', label: 'Today', icon: '🎯' },
  { to: '/assignments', label: 'Assignments', icon: '📝' },
  { to: '/week', label: 'Calendar', icon: '📅', alsoActiveOn: ['/month'] },
  { to: '/classes', label: 'Classes', icon: '🎒' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function getLinkClass(item, isActive) {
    const isAlsoActive = item.alsoActiveOn ? item.alsoActiveOn.includes(location.pathname) : false;
    return `nav-link px-3 ${isActive || isAlsoActive ? 'active' : ''}`;
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom shadow-sm sticky-top">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-primary" onClick={closeMenu}>
          📚 HomeworkHQ
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
                  className={({ isActive }) => getLinkClass(item, isActive)}
                  onClick={closeMenu}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <Link
            to="/assignments/new"
            className="btn btn-primary ms-lg-3 mt-2 mt-lg-0 mb-2 mb-lg-0 w-100 add-button"
            onClick={closeMenu}
          >
            + Add Assignment
          </Link>
          <div className="ms-lg-2 mb-2 mb-lg-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;