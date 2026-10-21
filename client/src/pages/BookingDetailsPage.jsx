import { useCallback, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { useApiData } from '../hooks/useApiData';
import { cancelBooking, getBooking } from '../api/bookings';
import { formatDateTime, formatSessionTime, isChangeable } from '../utils/bookingTime';
import { formatPrice } from '../utils/services';

function BookingDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const loadBooking = useCallback((signal) => getBooking(id, { signal }), [id]);
  const { data, error, isLoading, retry } = useApiData(loadBooking);

  // After cancelling, show the server's updated booking instead of the loaded one.
  const [updated, setUpdated] = useState(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState(
    location.state && typeof location.state.message === 'string' ? location.state.message : '',
  );

  const booking = updated && data && updated.id === data.id ? updated : data;

  async function handleCancel() {
    if (isCancelling) {
      return;
    }
    setIsCancelling(true);
    setActionError('');
    try {
      const cancelled = await cancelBooking(booking.id);
      setUpdated(cancelled);
      setMessage('This booking has been cancelled.');
      setIsConfirmingCancel(false);
    } catch (cancelError) {
      setActionError(cancelError.message);
    } finally {
      setIsCancelling(false);
    }
  }

  const backLink = (
    <Link to="/dashboard" className="btn btn-link px-0 mb-3">
      ← My bookings
    </Link>
  );

  if (isLoading) {
    return (
      <div>
        {backLink}
        <LoadingState label="Loading booking…" />
      </div>
    );
  }
  if (error && [400, 403, 404].includes(error.status)) {
    // Someone else's booking (403) looks the same as a missing one to the visitor.
    return (
      <EmptyState
        icon="🔒"
        title="Booking not found"
        message="This booking doesn't exist or isn't on your account."
      >
        <Link to="/dashboard" className="btn btn-primary">
          Go to my bookings
        </Link>
      </EmptyState>
    );
  }
  if (error) {
    return (
      <div>
        {backLink}
        <ErrorState title="We couldn't load this booking" error={error} onRetry={retry} />
      </div>
    );
  }

  const { serviceSnapshot } = booking;
  const canChange = isChangeable(booking);

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        {backLink}

        {message && (
          <div
            className="alert alert-success d-flex justify-content-between align-items-start"
            role="status"
          >
            <span>{message}</span>
            <button
              type="button"
              className="btn-close"
              aria-label="Dismiss"
              onClick={() => setMessage('')}
            ></button>
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
              <h1 className="h3 fw-bold mb-0">{serviceSnapshot.name}</h1>
              <BookingStatusBadge booking={booking} />
            </div>
            <p className="lead mb-4">
              <time dateTime={booking.startTime}>
                {formatSessionTime(booking.startTime, booking.endTime)}
              </time>
            </p>

            <dl className="row mb-0">
              <dt className="col-sm-4 text-secondary fw-normal">Student</dt>
              <dd className="col-sm-8 fw-semibold">
                {booking.studentFirstName} (grade {booking.studentGrade})
              </dd>
              <dt className="col-sm-4 text-secondary fw-normal">Tutor</dt>
              <dd className="col-sm-8 fw-semibold">{serviceSnapshot.tutorName}</dd>
              <dt className="col-sm-4 text-secondary fw-normal">Length</dt>
              <dd className="col-sm-8 fw-semibold">{serviceSnapshot.durationMinutes} minutes</dd>
              <dt className="col-sm-4 text-secondary fw-normal">Price</dt>
              <dd className="col-sm-8 fw-semibold">
                {formatPrice(serviceSnapshot.priceCents)}{' '}
                <span className="fw-normal small text-secondary">(paid to the tutor)</span>
              </dd>
              <dt className="col-sm-4 text-secondary fw-normal">Notes</dt>
              <dd className="col-sm-8 notes-text">
                {booking.notes || <span className="text-secondary">None</span>}
              </dd>
              {booking.rescheduleCount > 0 && (
                <>
                  <dt className="col-sm-4 text-secondary fw-normal">Originally booked for</dt>
                  <dd className="col-sm-8">{formatDateTime(booking.originalStartTime)}</dd>
                </>
              )}
              {booking.cancelledAt && (
                <>
                  <dt className="col-sm-4 text-secondary fw-normal">Cancelled on</dt>
                  <dd className="col-sm-8">{formatDateTime(booking.cancelledAt)}</dd>
                </>
              )}
            </dl>

            {actionError && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {actionError}
              </div>
            )}

            {canChange && !isConfirmingCancel && (
              <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                <Link to={`/bookings/${booking.id}/edit`} className="btn btn-primary">
                  Reschedule or edit notes
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => setIsConfirmingCancel(true)}
                >
                  Cancel booking
                </button>
              </div>
            )}

            {canChange && isConfirmingCancel && (
              <div
                className="alert alert-warning mt-4 mb-0"
                role="alertdialog"
                aria-labelledby="cancel-question"
              >
                <p id="cancel-question" className="fw-semibold">
                  Cancel this session? This can&apos;t be undone.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling…' : 'Yes, cancel it'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsConfirmingCancel(false)}
                    disabled={isCancelling}
                  >
                    Keep my booking
                  </button>
                </div>
              </div>
            )}

            {!canChange && booking.status === 'confirmed' && (
              <p className="small text-secondary mt-4 mb-0">
                Sessions can be changed or cancelled until 2 hours before they start.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsPage;
