import { Link } from 'react-router-dom';
import BookingStatusBadge from './BookingStatusBadge';
import { formatDateTime } from '../utils/bookingTime';

function BookingCard({ booking }) {
  const { serviceSnapshot } = booking;

  return (
    <article className="card border-0 shadow-sm h-100 booking-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <p className="fw-semibold mb-0">
            <time dateTime={booking.startTime}>{formatDateTime(booking.startTime)}</time>
          </p>
          <BookingStatusBadge booking={booking} />
        </div>
        <h3 className="h6 fw-bold mb-1">
          <Link
            to={`/bookings/${booking.id}`}
            className="stretched-link text-body text-decoration-none"
          >
            {serviceSnapshot.name}
          </Link>
        </h3>
        <p className="small text-secondary mb-0">
          {booking.studentFirstName} (grade {booking.studentGrade}) · {serviceSnapshot.tutorName} ·{' '}
          {serviceSnapshot.durationMinutes} min
        </p>
      </div>
    </article>
  );
}

export default BookingCard;
