import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { useApiData } from '../hooks/useApiData';
import { getBooking, updateBooking } from '../api/bookings';
import { easternDateOf, formatDateTime, isChangeable } from '../utils/bookingTime';
import { NOTES_MAX } from '../utils/bookingValidation';

// Mounted only after the booking has loaded, so the form can start from its values.
function EditBookingForm({ booking }) {
  const navigate = useNavigate();
  const durationMinutes = booking.serviceSnapshot.durationMinutes;
  const [form, setForm] = useState({
    date: easternDateOf(booking.startTime),
    startTime: booking.startTime,
    notes: booking.notes,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    // Send ONLY what changed. The API accepts nothing except startTime and notes.
    const changes = {};
    if (form.startTime && form.startTime !== booking.startTime) {
      changes.startTime = form.startTime;
    }
    if (form.notes.trim() !== booking.notes) {
      changes.notes = form.notes.trim();
    }

    const clientErrors = {};
    if (!form.startTime) {
      clientErrors.startTime = 'Choose a start time';
    }
    if (form.notes.length > NOTES_MAX) {
      clientErrors.notes = `Notes must be at most ${NOTES_MAX} characters`;
    }
    setErrors(clientErrors);
    setServerError('');
    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    if (Object.keys(changes).length === 0) {
      setServerError('Nothing has changed yet.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBooking(booking.id, changes);
      navigate(`/bookings/${booking.id}`, {
        replace: true,
        state: {
          message: changes.startTime ? 'Your session was rescheduled.' : 'Your notes were saved.',
        },
      });
    } catch (error) {
      const fieldErrors = error.fieldErrors || {};
      if (
        error.status === 409 &&
        changes.startTime &&
        !error.message.includes('no longer be changed')
      ) {
        fieldErrors.startTime = error.message;
      }
      setErrors(fieldErrors);
      setServerError(Object.keys(fieldErrors).length ? '' : error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert alert-danger" role="alert">
          {serverError}
        </div>
      )}

      <TimeSlotPicker
        date={form.date}
        startTime={form.startTime}
        durationMinutes={durationMinutes}
        onDateChange={(value) => {
          setForm((current) => ({ ...current, date: value, startTime: '' }));
          setErrors((current) => ({ ...current, startTime: '' }));
        }}
        onTimeChange={(value) => {
          setForm((current) => ({ ...current, startTime: value }));
          setErrors((current) => ({ ...current, startTime: '' }));
        }}
        error={errors.startTime}
      />

      <div className="mb-4">
        <label htmlFor="edit-notes" className="form-label fw-semibold">
          Notes for the tutor
        </label>
        <textarea
          id="edit-notes"
          className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
          rows={3}
          maxLength={NOTES_MAX}
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          aria-describedby="edit-notes-count"
        />
        <div id="edit-notes-count" className="form-text">
          {form.notes.length}/{NOTES_MAX} characters
        </div>
        {errors.notes && <div className="invalid-feedback d-block">{errors.notes}</div>}
      </div>

      <div className="d-flex flex-column flex-sm-row gap-2">
        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
        <Link to={`/bookings/${booking.id}`} className="btn btn-outline-secondary btn-lg">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function EditBookingPage() {
  const { id } = useParams();
  const loadBooking = useCallback((signal) => getBooking(id, { signal }), [id]);
  const { data: booking, error, isLoading, retry } = useApiData(loadBooking);

  if (isLoading) {
    return <LoadingState label="Loading booking…" />;
  }
  if (error && [400, 403, 404].includes(error.status)) {
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
    return <ErrorState title="We couldn't load this booking" error={error} onRetry={retry} />;
  }
  if (!isChangeable(booking)) {
    return (
      <EmptyState
        icon="⏳"
        title="This booking can't be changed"
        message="Sessions can be changed until 2 hours before they start, and cancelled sessions can't be changed."
      >
        <Link to={`/bookings/${booking.id}`} className="btn btn-primary">
          Back to booking
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        <Link to={`/bookings/${booking.id}`} className="btn btn-link px-0 mb-3">
          ← Back to booking
        </Link>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h1 className="h3 fw-bold mb-1">Change booking</h1>
            <p className="text-secondary mb-4">
              {booking.serviceSnapshot.name} for {booking.studentFirstName} · currently{' '}
              {formatDateTime(booking.startTime)}
            </p>
            <EditBookingForm booking={booking} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditBookingPage;
