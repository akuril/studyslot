import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import BookingCard from '../components/BookingCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../api/bookings';
import { daysUntil, getDisplayStatus } from '../utils/bookingTime';

function describeDaysAway(days) {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
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

function DashboardPage() {
  const { user } = useAuth();
  const loadBookings = useCallback((signal) => getMyBookings({ signal }), []);
  const { data: bookings, error, isLoading, retry } = useApiData(loadBookings);

  const header = (
    <PageHeader title="My bookings" subtitle={`Welcome back, ${user.name.split(' ')[0]}!`}>
      <Link to="/services" className="btn btn-primary">
        + Book a session
      </Link>
    </PageHeader>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <LoadingState label="Loading your bookings…" />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {header}
        <ErrorState title="We couldn't load your bookings" error={error} onRetry={retry} />
      </div>
    );
  }

  // Group by the CALCULATED status (completed = confirmed and already ended).
  const now = new Date();
  const upcoming = bookings.filter((booking) => getDisplayStatus(booking, now) === 'upcoming');
  const completed = bookings
    .filter((booking) => getDisplayStatus(booking, now) === 'completed')
    .reverse(); // most recent first
  const cancelled = bookings.filter((booking) => booking.status === 'cancelled').reverse();
  const nextSession = upcoming[0];

  if (bookings.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          icon="🗓️"
          title="No sessions booked yet"
          message="Browse tutoring services and book your student's first session."
        >
          <Link to="/services" className="btn btn-primary btn-lg">
            Browse services
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      {header}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatCard icon="🗓️" label="Upcoming sessions" value={upcoming.length} tone="primary" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            icon="⏰"
            label="Next session"
            value={nextSession ? describeDaysAway(daysUntil(nextSession.startTime, now)) : '—'}
            message={nextSession ? nextSession.serviceSnapshot.name : 'Nothing scheduled'}
            tone="warning"
            to={nextSession ? `/bookings/${nextSession.id}` : undefined}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard icon="✅" label="Completed" value={completed.length} tone="success" />
        </div>
      </div>

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
