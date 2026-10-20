import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import RouteEffects from './RouteEffects';

function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="d-flex flex-column min-vh-100">
      <a
        href="#main-content"
        className="visually-hidden-focusable btn btn-primary position-absolute top-0 start-0 m-2"
        style={{ zIndex: 2000 }}
      >
        Skip to main content
      </a>

      <RouteEffects />
      <Navbar />

      <main id="main-content" className="container py-4 flex-grow-1" tabIndex="-1">
        {/* key={pathname} resets the boundary when the page changes, so one crash doesn't stick. */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

export default Layout;
