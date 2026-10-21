import { bookingDateRange, listTimeSlots } from '../utils/bookingTime';

/**
 * Date + time pickers that only offer allowed slots (Eastern Time).
 * `date` is "YYYY-MM-DD"; `startTime` is the chosen slot's ISO string (or '').
 */
function TimeSlotPicker({ date, startTime, durationMinutes, onDateChange, onTimeChange, error }) {
  const { min, max } = bookingDateRange();
  const { slots, reason } = date ? listTimeSlots(date, durationMinutes) : { slots: [], reason: '' };

  return (
    <fieldset className="mb-3">
      <legend className="form-label fw-semibold fs-6 mb-2">Date and time (Eastern Time)</legend>
      <div className="row g-2">
        <div className="col-12 col-sm-6">
          <label htmlFor="booking-date" className="form-label small text-secondary mb-1">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            className="form-control form-control-lg"
            min={min}
            max={max}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            required
          />
        </div>
        <div className="col-12 col-sm-6">
          <label htmlFor="booking-time" className="form-label small text-secondary mb-1">
            Start time (ET)
          </label>
          <select
            id="booking-time"
            className={`form-select form-select-lg ${error ? 'is-invalid' : ''}`}
            value={startTime}
            onChange={(event) => onTimeChange(event.target.value)}
            disabled={slots.length === 0}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby="booking-time-help"
            required
          >
            <option value="">{slots.length === 0 ? '—' : 'Choose a time'}</option>
            {slots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div id="booking-time-help" className={error ? 'text-danger small mt-1' : 'form-text'}>
        {error ||
          reason ||
          `Mon–Fri 3:00–8:00 PM, Sat 9:00 AM–3:00 PM ET. This session is ${durationMinutes} minutes.`}
      </div>
    </fieldset>
  );
}

export default TimeSlotPicker;
