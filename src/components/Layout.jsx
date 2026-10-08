import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import UndoToast from './UndoToast';
import ErrorBoundary from './ErrorBoundary';
import RouteEffects from './RouteEffects';
import { usePlanner } from '../context/PlannerContext';

function Layout() {
  const { pathname } = useLocation();
  const { storageError } = usePlanner();

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
        {storageError && (
          <div className="alert alert-warning d-print-none" role="alert">
            <strong>⚠️ Your changes can't be saved right now.</strong> This browser is blocking
            storage (for example, in some private browsing modes) or it's full. Anything you
            change will be lost when you close this tab.
          </div>
        )}

        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer />
      <UndoToast />
    </div>
  );
}

export default Layout;