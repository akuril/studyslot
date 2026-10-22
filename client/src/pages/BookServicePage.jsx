import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { useApiData } from '../hooks/useApiData';
import { getService } from '../api/services';
import { createBooking } from '../api/bookings';
import { createStudent, getStudents } from '../api/students';
import Avatar from '../components/Avatar';
import { MAX_STUDENTS } from '../utils/students';
import { formatGradeBand, formatPrice } from '../utils/services';
import { NOTES_MAX, validateBookingForm } from '../utils/bookingValidation';

// Grades a service is designed for: "6-8" -> [6, 7, 8]
function gradesForBand(gradeBand) {
  const [low, high] = gradeBand.split('-').map(Number);
  return Array.from({ length: high - low + 1 }, (_, index) => low + index);
}

function BookingForm({ service, students }) {
  const navigate = useNavigate();
  const grades = gradesForBand(service.gradeBand);
  const [form, setForm] = useState({
    studentFirstName: '',
    studentGrade: grades.length === 1 ? String(grades[0]) : '',
    date: '',
    startTime: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStudent, setSaveStudent] = useState(true);

  const typedName = form.studentFirstName.trim();
  const isSavedAlready = students.some(
    (student) => student.firstName.toLowerCase() === typedName.toLowerCase(),
  );
  const canOfferSave =
    typedName !== '' &&
    form.studentGrade !== '' &&
    !isSavedAlready &&
    students.length < MAX_STUDENTS;

  function pickStudent(student) {
    setForm((current) => ({
      ...current,
      studentFirstName: student.firstName,
      studentGrade: String(student.grade),
    }));
    setErrors((current) => ({ ...current, studentFirstName: '', studentGrade: '' }));
  }

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return; // ignore double clicks
    }
    const clientErrors = validateBookingForm(form);
    setErrors(clientErrors);
    setServerError('');
    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Only the fields the API accepts. The server sets owner, duration, price, and status.
      const booking = await createBooking({
        serviceId: service.id,
        studentFirstName: form.studentFirstName.trim(),
        studentGrade: Number(form.studentGrade),
        startTime: form.startTime,
        notes: form.notes.trim(),
      });
      // Optional convenience: remember this student for next time. A failure here
      // (e.g. saved in another tab meanwhile) must not hide the successful booking.
      if (canOfferSave && saveStudent) {
        await createStudent({ firstName: typedName, grade: form.studentGrade }).catch(() => {});
      }
      navigate(`/bookings/${booking.id}`, {
        replace: true,
        state: { message: 'Your session is booked!' },
      });
    } catch (error) {
      const fieldErrors = error.fieldErrors || {};
      if (error.status === 409) {
        fieldErrors.startTime = error.message; // the slot was taken: show it by the time picker
      }
      setErrors(fieldErrors);
      setServerError(error.status === 409 || Object.keys(fieldErrors).length ? '' : error.message);
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

      {students.length > 0 && (
        <fieldset className="mb-3">
          <legend className="form-label fw-semibold fs-6">Who is this session for?</legend>
          <div className="d-flex flex-wrap gap-2">
            {students.map((student) => {
              const fits = grades.includes(student.grade);
              const isPicked =
                form.studentFirstName === student.firstName &&
                form.studentGrade === String(student.grade);
              return (
                <button
                  type="button"
                  key={student.id}
                  className={`btn d-inline-flex align-items-center gap-2 ${isPicked ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => pickStudent(student)}
                  disabled={!fits}
                  aria-pressed={isPicked}
                  title={
                    fits ? undefined : `This service is for ${service.gradeBand.replace('-', '–')}`
                  }
                >
                  <Avatar name={student.firstName} size="sm" />
                  {student.firstName} · Grade {student.grade}
                  {!fits && <span className="visually-hidden"> (grade not covered)</span>}
                </button>
              );
            })}
          </div>
          <div className="form-text">Or type a different student below.</div>
        </fieldset>
      )}

      <FormField
        id="booking-student-name"
        label="Student's first name"
        name="studentFirstName"
        autoComplete="off"
        maxLength={40}
        value={form.studentFirstName}
        onChange={(event) => setField('studentFirstName', event.target.value)}
        error={errors.studentFirstName}
        hint="First name only. We don't need your student's last name."
        required
      />

      <div className="mb-3">
        <label htmlFor="booking-grade" className="form-label fw-semibold">
          Grade
        </label>
        <select
          id="booking-grade"
          className={`form-select form-select-lg ${errors.studentGrade ? 'is-invalid' : ''}`}
          value={form.studentGrade}
          onChange={(event) => setField('studentGrade', event.target.value)}
          aria-invalid={errors.studentGrade ? 'true' : undefined}
          required
        >
          <option value="">Choose a grade</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
        {errors.studentGrade && <div className="invalid-feedback">{errors.studentGrade}</div>}
      </div>

      {canOfferSave && (
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="booking-save-student"
            checked={saveStudent}
            onChange={(event) => setSaveStudent(event.target.checked)}
          />
          <label className="form-check-label" htmlFor="booking-save-student">
            Save {typedName} to My students for next time
          </label>
        </div>
      )}

      <TimeSlotPicker
        date={form.date}
        startTime={form.startTime}
        durationMinutes={service.durationMinutes}
        onDateChange={(value) => {
          setForm((current) => ({ ...current, date: value, startTime: '' }));
          setErrors((current) => ({ ...current, startTime: '' }));
        }}
        onTimeChange={(value) => setField('startTime', value)}
        error={errors.startTime}
      />

      <div className="mb-4">
        <label htmlFor="booking-notes" className="form-label fw-semibold">
          Notes for the tutor <span className="fw-normal text-secondary">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
          rows={3}
          maxLength={NOTES_MAX}
          value={form.notes}
          onChange={(event) => setField('notes', event.target.value)}
          aria-describedby="booking-notes-count"
          placeholder="e.g. Test on fractions next Friday."
        />
        <div id="booking-notes-count" className="form-text">
          {form.notes.length}/{NOTES_MAX} characters. Please don&apos;t include personal details.
        </div>
        {errors.notes && <div className="invalid-feedback d-block">{errors.notes}</div>}
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isSubmitting}>
        {isSubmitting ? 'Booking…' : 'Confirm booking'}
      </button>
    </form>
  );
}

function BookServicePage() {
  const { id } = useParams();
  // The service and the parent's saved students load together.
  const loadPage = useCallback(
    (signal) =>
      Promise.all([getService(id, { signal }), getStudents({ signal })]).then(
        ([service, students]) => ({ service, students }),
      ),
    [id],
  );
  const { data, error, isLoading, retry } = useApiData(loadPage);
  const service = data && data.service;

  if (isLoading) {
    return <LoadingState label="Loading service…" />;
  }
  if (error && (error.status === 404 || error.status === 400)) {
    return (
      <EmptyState
        icon="🤔"
        title="Service not found"
        message="This service isn't available for booking."
      >
        <Link to="/services" className="btn btn-primary">
          See all services
        </Link>
      </EmptyState>
    );
  }
  if (error) {
    return <ErrorState title="We couldn't load this service" error={error} onRetry={retry} />;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        <Link to={`/services/${service.id}`} className="btn btn-link px-0 mb-3">
          ← Back to service
        </Link>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h1 className="h3 fw-bold mb-1">Book a session</h1>
            <p className="text-secondary mb-4">
              <strong className="text-body">{service.name}</strong> with {service.tutorName} ·{' '}
              {service.durationMinutes} min · {formatPrice(service.priceCents)} ·{' '}
              {formatGradeBand(service.gradeBand)}
            </p>
            <BookingForm service={service} students={data.students} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookServicePage;
