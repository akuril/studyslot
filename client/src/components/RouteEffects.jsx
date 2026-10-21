import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// [pattern, title] pairs. The first pattern that matches wins.
// New pages add their own pair here as they are built.
const PAGE_TITLES = [
  [/^\/$/, 'Home'],
  [/^\/services$/, 'Tutoring Services'],
  [/^\/services\/[^/]+\/book$/, 'Book a Session'],
  [/^\/services\/[^/]+$/, 'Service Details'], // replaced by the service name once loaded
  [/^\/login$/, 'Log In'],
  [/^\/register$/, 'Create Account'],
  [/^\/account$/, 'My Account'],
  [/^\/dashboard$/, 'My Bookings'],
  [/^\/bookings\/[^/]+\/edit$/, 'Change Booking'],
  [/^\/bookings\/[^/]+$/, 'Booking Details'],
];

function getPageTitle(pathname) {
  // Treat "/services/" the same as "/services"
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const match = PAGE_TITLES.find(([pattern]) => pattern.test(path));
  return match ? match[1] : 'Page Not Found';
}

function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${getPageTitle(pathname)} · StudySlot`;
  }, [pathname]);

  return null;
}

export default RouteEffects;
