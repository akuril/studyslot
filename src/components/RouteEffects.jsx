import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// [pattern, title] pairs. The first pattern that matches wins.
const PAGE_TITLES = [
  [/^\/$/, 'Dashboard'],
  [/^\/today$/, 'Today'],
  [/^\/assignments$/, 'Assignments'],
  [/^\/assignments\/new$/, 'Add Assignment'],
  [/^\/assignments\/[^/]+\/edit$/, 'Edit Assignment'],
  [/^\/assignments\/[^/]+$/, 'Assignment Details'],
  [/^\/classes$/, 'My Classes'],
  [/^\/classes\/[^/]+$/, 'Class Details'],
  [/^\/week$/, 'Week Planner'],
  [/^\/month$/, 'Month Calendar'],
  [/^\/done$/, 'Done'],
];

function getPageTitle(pathname) {
  // Treat "/classes/" the same as "/classes"
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const match = PAGE_TITLES.find(([pattern]) => pattern.test(path));
  return match ? match[1] : 'Page Not Found';
}

function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${getPageTitle(pathname)} · HomeworkHQ`;
  }, [pathname]);

  return null;
}

export default RouteEffects;