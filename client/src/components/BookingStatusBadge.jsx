import { getDisplayStatus } from '../utils/bookingTime';

const STYLES = {
  upcoming: { label: 'Upcoming', className: 'bg-success-subtle text-success-emphasis' },
  completed: { label: 'Completed', className: 'bg-secondary-subtle text-secondary-emphasis' },
  cancelled: { label: 'Cancelled', className: 'bg-danger-subtle text-danger-emphasis' },
};

/** Status pill, plus a "Rescheduled" pill when the time was changed (decision A, Step 6). */
function BookingStatusBadge({ booking }) {
  const style = STYLES[getDisplayStatus(booking)];

  return (
    <span className="d-inline-flex flex-wrap gap-1">
      <span className={`badge rounded-pill ${style.className}`}>{style.label}</span>
      {booking.rescheduleCount > 0 && (
        <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
          Rescheduled
        </span>
      )}
    </span>
  );
}

export default BookingStatusBadge;
