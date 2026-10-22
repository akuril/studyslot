import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import StatCard from '../components/StatCard';
import BookingStatusBadge from '../components/BookingStatusBadge';
import CompleteSessionForm from '../components/CompleteSessionForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import WeekSchedule from '../components/WeekSchedule';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { getTutorSessions } from '../api/tutor';
import {
  easternDateString,
  formatDateTime,
  getDisplayStatus,
  needsCompleting,
} from '../utils/bookingTime';

function TutorSessionCard({ session, onCompleted }) {
  return (
    <article className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <p className="fw-semibold mb-0">
            <time dateTime={session.startTime}>{formatDateTime(session.startTime)}</time>
          </p>
          {needsCompleting(session) ? (
            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
              To mark completed
            </span>
          ) : (
            <BookingStatusBadge booking={session} />
          )}
        </div>
        <div className="d-flex align-items-center gap-2 mb-2">
          <Avatar name={session.studentFirstName} size="sm" />
          <div className="min-w-0">
            <h3 className="h6 fw-bold mb-0">
              {session.studentFirstName}{' '}
              <span className="fw-normal text-secondary">· Grade {session.studentGrade}</span>
            </h3>
            <p className="small text-secondary mb-0 text-truncate">
              {session.serviceSnapshot.name} · {session.serviceSnapshot.durationMinutes} min
            </p>
          </div>
        </div>
        <p className="small notes-text flex-grow-1">
          <span className="text-secondary">Parent&apos;s notes: </span>
          {session.notes || <span className="text-secondary">none</span>}
        </p>
        {session.tutorSummary && (
          <p className="small notes-text">
            <span className="text-secondary">Your summary: </span>
            {session.tutorSummary}
          </p>
        )}
        <div className="d-flex flex-wrap gap-2 mt-auto">
          {needsCompleting(session) && (
            <CompleteSessionForm booking={session} onCompleted={onCompleted} compact />
          )}
          <Link to={`/bookings/${session.id}`} className="btn btn-sm btn-outline-primary">
            Details
            <span className="visually-hidden">
              : {session.studentFirstName}, {formatDateTime(session.startTime)}
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function SessionSection({ title, sessions, emptyText, onCompleted }) {
  const headingId = `tutor-section-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section className="mb-4" aria-labelledby={headingId}>
      <h2 id={headingId} className="h5 fw-bold mb-3">
        {title} <span className="text-secondary fw-normal">({sessions.length})</span>
      </h2>
      {sessions.length === 0 ? (
        <p className="text-secondary">{emptyText}</p>
      ) : (
        <div className="row g-3">
          {sessions.map((session) => (
            <div className="col-12 col-md-6 col-xl-4" key={session.id}>
              <TutorSessionCard session={session} onCompleted={onCompleted} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// The tutor's own dashboard: today, this week, sessions to wrap up, and history.
function TutorDashboardPage() {
  const { user } = useAuth();
  const load = useCallback((signal) => getTutorSessions({ signal }), []);
  const { data, error, isLoading, retry } = useApiData(load);
  // Sessions marked completed on this page (shown immediately, without reloading).
  const [completedById, setCompletedById] = useState({});

  const banner = (
    <section className="welcome-banner tutor-banner rounded-4 shadow-sm p-4 mb-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div className="flex-grow-1">
          <p className="text-white-75 small fw-semibold text-uppercase mb-1">Tutor dashboard</p>
          <h1 className="h3 fw-bold mb-1">Welcome, {user.name}!</h1>
          <p className="text-white-75 mb-0">
            Your sessions, students, and parents&apos; notes in one place.
          </p>
        </div>
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <div>
        {banner}
        <LoadingState label="Loading your sessions…" />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {banner}
        <ErrorState title="We couldn't load your sessions" error={error} onRetry={retry} />
      </div>
    );
  }

  const handleCompleted = (updated) =>
    setCompletedById((current) => ({ ...current, [updated.id]: updated }));
  const sessions = data.map((session) => completedById[session.id] || session);

  const now = new Date();
  const today = easternDateString(now);
  const active = sessions.filter((session) => session.status === 'confirmed');
  const todays = active.filter(
    (session) => easternDateString(new Date(session.startTime)) === today,
  );
  const toComplete = active.filter((session) => needsCompleting(session, now));
  const upcoming = active.filter((session) => new Date(session.startTime) > now);
  const completed = sessions
    .filter(
      (session) => getDisplayStatus(session, now) === 'completed' && !needsCompleting(session, now),
    )
    .reverse();
  const cancelled = sessions.filter((session) => session.status === 'cancelled').reverse();

  return (
    <div>
      {banner}

      {sessions.length === 0 && (
        <div className="alert alert-info" role="status">
          No sessions yet. When parents book your services, they appear here.
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatCard icon="📅" label="Today" value={todays.length} tone="primary" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard icon="🗓️" label="Upcoming" value={upcoming.length} tone="warning" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            icon="📝"
            label="To mark completed"
            value={toComplete.length}
            tone={toComplete.length > 0 ? 'danger' : 'success'}
          />
        </div>
      </div>

      <WeekSchedule
        sessions={sessions}
        title="Your week"
        describe={(session) => ({
          title: `${session.studentFirstName} (gr. ${session.studentGrade})`,
          subtitle: session.serviceSnapshot.name,
        })}
      />

      {toComplete.length > 0 && (
        <SessionSection
          title="Ready to mark completed"
          sessions={toComplete}
          emptyText=""
          onCompleted={handleCompleted}
        />
      )}
      <SessionSection
        title="Upcoming"
        sessions={upcoming}
        emptyText="No upcoming sessions."
        onCompleted={handleCompleted}
      />
      <SessionSection
        title="Completed"
        sessions={completed}
        emptyText="No completed sessions yet."
        onCompleted={handleCompleted}
      />
      {cancelled.length > 0 && (
        <SessionSection
          title="Cancelled"
          sessions={cancelled}
          emptyText=""
          onCompleted={handleCompleted}
        />
      )}
    </div>
  );
}

export default TutorDashboardPage;
