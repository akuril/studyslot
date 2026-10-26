import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import ChangePasswordForm from '../components/ChangePasswordForm';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import ProfileForm from '../components/ProfileForm';
import StatCard from '../components/StatCard';
import { getAccountSummary } from '../api/auth';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { homePathFor, isTutor } from '../utils/roles';
import { formatGradeBand, formatPrice } from '../utils/services';

const memberSinceFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

// The numbers at the top right: what this account has done so far.
function AccountStats({ summary, tutor }) {
  const { bookings } = summary;
  return (
    <div className="row g-3">
      <div className="col-6">
        <StatCard icon="🗓️" label="Upcoming sessions" value={bookings.upcoming} tone="primary" />
      </div>
      <div className="col-6">
        <StatCard icon="✅" label="Completed" value={bookings.completed} tone="success" />
      </div>
      {tutor ? (
        <div className="col-6">
          <StatCard
            icon="📝"
            label="To mark completed"
            value={bookings.needsCompleting}
            tone="warning"
            to={bookings.needsCompleting > 0 ? '/tutor' : undefined}
          />
        </div>
      ) : (
        <div className="col-6">
          <StatCard
            icon="🧒"
            label="Saved students"
            value={summary.students}
            tone="warning"
            to="/dashboard"
          />
        </div>
      )}
      <div className="col-6">
        <StatCard icon="🚫" label="Cancelled" value={bookings.cancelled} tone="secondary" />
      </div>
    </div>
  );
}

// Tutors only: the services linked to their account.
function TutorServices({ services }) {
  return (
    <section className="card border-0 shadow-sm mt-4" aria-labelledby="my-services-title">
      <div className="card-body">
        <h2 id="my-services-title" className="h5 fw-bold mb-3">
          My services <span className="text-secondary fw-normal">({services.length})</span>
        </h2>
        {services.length === 0 ? (
          <p className="text-secondary mb-0">No services are linked to your account yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {services.map((service) => (
              <li
                key={service.id}
                className="list-group-item px-0 d-flex flex-wrap justify-content-between align-items-center gap-2"
              >
                <div className="min-w-0">
                  <Link to={`/services/${service.id}`} className="fw-semibold text-body">
                    {service.name}
                  </Link>
                  <div className="small text-secondary">
                    {formatGradeBand(service.gradeBand)} · {service.durationMinutes} min ·{' '}
                    {formatPrice(service.priceCents)}
                  </div>
                </div>
                {!service.isActive && (
                  <span className="badge rounded-pill text-bg-secondary">Not listed</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// A protected page: only reachable when logged in (see ProtectedRoute).
function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const tutor = isTutor(user);
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const loadSummary = useCallback((signal) => getAccountSummary({ signal }), []);
  const { data: summary, error, isLoading, retry } = useApiData(loadSummary);

  function handleSaved(updatedUser) {
    updateUser(updatedUser);
    setIsEditing(false);
    setSavedMessage('Your profile was updated.');
  }

  return (
    <div>
      <PageHeader
        title="My account"
        subtitle={tutor ? 'Your StudySlot tutor account.' : 'Your StudySlot parent account.'}
      />

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <section className="card border-0 shadow-sm h-100" aria-labelledby="profile-title">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <Avatar name={user.name} size="xl" />
                <div className="min-w-0">
                  <h2 id="profile-title" className="h4 fw-bold mb-1 text-break">
                    {user.name}
                  </h2>
                  <span
                    className={`badge rounded-pill ${tutor ? 'bg-success-subtle text-success-emphasis' : 'bg-primary-subtle text-primary-emphasis'}`}
                  >
                    {tutor ? '🧑‍🏫 Tutor' : '👪 Parent / guardian'}
                  </span>
                </div>
              </div>

              {savedMessage && !isEditing && (
                <div className="alert alert-success py-2" role="status">
                  {savedMessage}
                </div>
              )}

              {isEditing ? (
                <ProfileForm
                  user={user}
                  tutor={tutor}
                  onSaved={handleSaved}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <dl className="mb-3">
                    <dt className="small text-secondary">Email</dt>
                    <dd className="fw-semibold text-break">{user.email}</dd>
                    <dt className="small text-secondary">Member since</dt>
                    <dd className="fw-semibold">
                      {memberSinceFormat.format(new Date(user.createdAt))}
                    </dd>
                    {tutor && (
                      <>
                        <dt className="small text-secondary">Bio</dt>
                        <dd className="mb-0 text-break">
                          {user.bio ? user.bio : <span className="text-secondary">No bio yet.</span>}
                        </dd>
                      </>
                    )}
                  </dl>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setSavedMessage('');
                      setIsEditing(true);
                    }}
                  >
                    Edit profile
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="col-12 col-lg-6">
          {isLoading && <LoadingState label="Loading your activity…" />}
          {error && (
            <ErrorState title="We couldn't load your activity" error={error} onRetry={retry} />
          )}
          {summary && <AccountStats summary={summary} tutor={tutor} />}
        </div>
      </div>

      {summary && tutor && <TutorServices services={summary.services} />}

      <section
        className="card border-0 shadow-sm mt-4"
        style={{ maxWidth: '32rem' }}
        aria-labelledby="password-title"
      >
        <div className="card-body">
          <h2 id="password-title" className="h5 fw-bold mb-1">
            Change password
          </h2>
          <p className="small text-secondary">
            You&apos;ll stay logged in on this device. Other devices stay logged in until their
            login expires.
          </p>
          <ChangePasswordForm />
        </div>
      </section>

      <div className="d-flex flex-wrap gap-2 mt-4">
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
