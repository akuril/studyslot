import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

const memberSinceFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

// A protected page: only reachable when logged in (see ProtectedRoute).
function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <PageHeader title="My account" subtitle="Your StudySlot parent account." />

      <div className="card border-0 shadow-sm mb-4" style={{ maxWidth: '32rem' }}>
        <div className="card-body">
          <dl className="mb-0">
            <dt className="small text-secondary">Name</dt>
            <dd className="fw-semibold">{user.name}</dd>
            <dt className="small text-secondary">Email</dt>
            <dd className="fw-semibold">{user.email}</dd>
            <dt className="small text-secondary">Member since</dt>
            <dd className="fw-semibold mb-0">
              {memberSinceFormat.format(new Date(user.createdAt))}
            </dd>
          </dl>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Link to="/services" className="btn btn-primary">
          Browse tutoring services
        </Link>
        <button type="button" className="btn btn-outline-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default AccountPage;
