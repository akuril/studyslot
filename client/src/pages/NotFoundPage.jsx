import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <p className="display-1 mb-0" aria-hidden="true">
        🤔
      </p>
      <h1 className="h2 fw-bold mt-3">Page not found</h1>
      <p className="text-secondary mb-4">
        We couldn't find that page. It might have moved, or the link has a typo.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        Go to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
