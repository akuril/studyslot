import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import StatCard from '../components/StatCard';
import BookingCard from '../components/BookingCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StudentsPanel from '../components/StudentsPanel';
import WeekSchedule from '../components/WeekSchedule';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { firstNameOf } from '../utils/avatar';
import { getMyBookings } from '../api/bookings';
import { getStudents } from '../api/students';
import { daysUntil, formatDateTime, getDisplayStatus } from '../utils/bookingTime';

function describeDaysAway(days) {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function BookingSection({ title, bookings, emptyText }) {
  return (
    <section className="mb-4" aria-labelledby={`section-${title}`}>
      <h2 id={`section-${title}`} className="h5 fw-bold mb-3">
        {title} <span className="text-secondary fw-normal">({bookings.length})</span>
      </h2>
      {bookings.length === 0 ? (
        <p className="text-secondary">{emptyText}</p>
      ) : (
        <div className="row g-3">
          {bookings.map((booking) => (
            <div className="col-12 col-md-6 col-xl-4" key={booking.id}>
              <BookingCard booking={booking} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Both lists load together; the page shows once both have arrived.
function loadDashboard(signal) {
  return Promise.all([getMyBookings({ signal }), getStudents({ signal })]).then(
    ([bookings, students]) => ({ bookings, students }),
  );
}

// The parent's own dashboard: greeting, quick actions, stats, students, week, bookings.
function DashboardPage() {
  const { user } = useAuth();
  const load = useCallback((signal) => loadDashboard(signal), []);
  const { data, error, isLoading, retry } = useApiData(load);
  // After adding/editing/removing a student, show the updated list right away.
  const [studentsOverride, setStudentsOverride] = useState(null);

  const now = new Date();
  const firstName = firstNameOf(user.name);

  const banner = (
    <section className="welcome-banner rounded-4 shadow-sm p-4 mb-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div className="flex-grow-1">
          <h1 className="h3 fw-bold mb-1">
            {greetingFor(now)}, {firstName}!
          </h1>
          <p className="text-white-75 mb-0">
            Your StudySlot dashboard: sessions, students, and your week at a glance.
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <Link to="/services" className="btn btn-light fw-semibold">
            + Book a session
          </Link>
          <Link to="/find-help" className="btn btn-outline-light fw-semibold">
            ✨ Find help with AI
          </Link>
        </div>
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <div>
        {banner}
        <LoadingState label="Loading your dashboard…" />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {banner}
        <ErrorState title="We couldn't load your dashboard" error={error} onRetry={retry} />
      </div>
    );
  }

  const { bookings } = data;
  const students = studentsOverride ?? data.students;

  // Group by the CALCULATED status (completed = marked by the tutor, or already ended).
  const upcoming = bookings.filter((booking) => getDisplayStatus(booking, now) === 'upcoming');
  const completed = bookings
    .filter((booking) => getDisplayStatus(booking, now) === 'completed')
    .reverse(); // most recent first
  const cancelled = bookings.filter((booking) => booking.status === 'cancelled').reverse();
  const nextSession = upcoming[0];

  return (
    <div>
      {banner}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatCard icon="🗓️" label="Upcoming sessions" value={upcoming.length} tone="primary" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            icon="⏰"
            label="Next session"
            value={nextSession ? describeDaysAway(daysUntil(nextSession.startTime, now)) : '—'}
            message={
              nextSession
                ? `${nextSession.serviceSnapshot.name} · ${formatDateTime(nextSession.startTime)}`
                : 'Nothing scheduled'
            }
            tone="warning"
            to={nextSession ? `/bookings/${nextSession.id}` : undefined}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard icon="✅" label="Completed" value={completed.length} tone="success" />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-5">
          <StudentsPanel students={students} onChange={setStudentsOverride} />
        </div>
        <div className="col-12 col-lg-7">
          {nextSession ? (
            <section className="card border-0 shadow-sm h-100" aria-labelledby="next-title">
              <div className="card-body">
                <h2 id="next-title" className="h5 fw-bold mb-3">
                  Up next
                </h2>
                <div className="up-next">
                  <BookingCard booking={nextSession} />
                </div>
                <p className="small text-secondary mt-3 mb-0">
                  Open the session to get prep tips, reschedule, or cancel (until 2 hours
                  before).
                </p>
              </div>
            </section>
          ) : (
            <section className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body d-flex flex-column justify-content-center py-5">
                <p className="display-5 mb-2" aria-hidden="true">
                  🗓️
                </p>
                <h2 className="h5 fw-bold">No upcoming sessions</h2>
                <p className="text-secondary">
                  Book a session, or describe what your student needs and get an AI suggestion.
                </p>
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                  <Link to="/services" className="btn btn-primary">
                    Browse services
                  </Link>
                  <Link to="/find-help" className="btn btn-outline-primary">
                    ✨ Find help
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      <WeekSchedule
        sessions={bookings}
        describe={(booking) => ({
          title: booking.serviceSnapshot.name,
          subtitle: `${booking.studentFirstName} · ${booking.serviceSnapshot.tutorName}`,
        })}
      />

      <BookingSection title="Upcoming" bookings={upcoming} emptyText="No upcoming sessions." />
      <BookingSection
        title="Completed"
        bookings={completed}
        emptyText="No completed sessions yet."
      />
      {cancelled.length > 0 && (
        <BookingSection title="Cancelled" bookings={cancelled} emptyText="" />
      )}
    </div>
  );
}

export default DashboardPage;
