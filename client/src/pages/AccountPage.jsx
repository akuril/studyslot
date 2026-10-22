import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { homePathFor, isTutor } from '../utils/roles';

const memberSinceFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

// A protected page: only reachable when logged in (see ProtectedRoute).
function AccountPage() {
  const { user, logout } = useAuth();
  const tutor = isTutor(user);

  return (
    <div>
      <PageHeader
        title="My account"
        subtitle={tutor ? 'Your StudySlot tutor account.' : 'Your StudySlot parent account.'}
      />

      <div className="card border-0 shadow-sm mb-4" style={{ maxWidth: '32rem' }}>
        <div className="card-body">
          <div className="d-flex align-items-center gap-3 mb-3">
            <Avatar name={user.name} size="xl" />
            <div className="min-w-0">
              <p className="h4 fw-bold mb-1 text-break">{user.name}</p>
              <span
                className={`badge rounded-pill ${tutor ? 'bg-success-subtle text-success-emphasis' : 'bg-primary-subtle text-primary-emphasis'}`}
              >
                {tutor ? '🧑‍🏫 Tutor' : '👪 Parent / guardian'}
              </span>
            </div>
          </div>
          <dl className="mb-0">
            <dt className="small text-secondary">Email</dt>
            <dd className="fw-semibold text-break">{user.email}</dd>
            <dt className="small text-secondary">Member since</dt>
            <dd className="fw-semibold mb-0">
              {memberSinceFormat.format(new Date(user.createdAt))}
            </dd>
          </dl>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Link to={homePathFor(user)} className="btn btn-primary">
          {tutor ? 'Go to my schedule' : 'Go to my dashboard'}
        </Link>
        {!tutor && (
          <Link to="/services" className="btn btn-outline-primary">
            Browse tutoring services
          </Link>
        )}
        <button type="button" className="btn btn-outline-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default AccountPage;
