import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BUSINESS_TIME_ZONE,
  addDaysToDateString,
  easternDateString,
  getDisplayStatus,
} from '../utils/bookingTime';
import { DAYS_SHOWN, dateFromString, groupByDay, mondayOf } from '../utils/week';

// Sessions run Monday-Saturday, so the week view shows those 6 days in Eastern Time
// (the business's timezone, the same one used when booking).

const dayNameFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });
const dayNumberFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const easternClock = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
});

const STATUS_CLASS = {
  upcoming: 'week-session-upcoming',
  completed: 'week-session-completed',
};

/**
 * A Monday-Saturday calendar of sessions with previous/next week buttons.
 * `describe(session)` returns { title, subtitle } for each session's label.
 */
function WeekSchedule({ sessions, describe, title = 'This week' }) {
  const today = easternDateString();
  const [monday, setMonday] = useState(() => mondayOf(today));
  const days = groupByDay(sessions, monday);
  const isCurrentWeek = monday === mondayOf(today);
  const total = days.reduce((sum, day) => sum + day.sessions.length, 0);
  const lastDay = addDaysToDateString(monday, DAYS_SHOWN - 1);
  const rangeLabel = `${dayNumberFormat.format(dateFromString(monday))} – ${dayNumberFormat.format(
    dateFromString(lastDay),
  )}`;

  return (
    <section className="card border-0 shadow-sm mb-4" aria-labelledby="week-schedule-title">
      <div className="card-body">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div>
            <h2 id="week-schedule-title" className="h5 fw-bold mb-0">
              {isCurrentWeek ? title : 'Week view'}
            </h2>
            <p className="small text-secondary mb-0" aria-live="polite">
              {rangeLabel} · {total} {total === 1 ? 'session' : 'sessions'} · times in Eastern Time
            </p>
          </div>
          <div className="btn-group" role="group" aria-label="Change week">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setMonday((current) => addDaysToDateString(current, -7))}
            >
              <span aria-hidden="true">‹</span> Previous
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setMonday(mondayOf(today))}
              disabled={isCurrentWeek}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setMonday((current) => addDaysToDateString(current, 7))}
            >
              Next <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <ol className="week-grid list-unstyled mb-0">
          {days.map((day) => {
            const date = dateFromString(day.date);
            const isToday = day.date === today;
            return (
              <li key={day.date} className={`week-day ${isToday ? 'week-day-today' : ''}`}>
                <p className="week-day-label small fw-semibold mb-2">
                  <span className="text-secondary">{dayNameFormat.format(date)}</span>{' '}
                  <span>{dayNumberFormat.format(date)}</span>
                  {isToday && <span className="badge bg-primary ms-1">Today</span>}
                </p>
                {day.sessions.length === 0 ? (
                  <p className="small text-secondary mb-0 week-empty">No sessions</p>
                ) : (
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                    {day.sessions.map((session) => {
                      const { title: label, subtitle } = describe(session);
                      const status = getDisplayStatus(session);
                      return (
                        <li key={session.id}>
                          <Link
                            to={`/bookings/${session.id}`}
                            className={`week-session d-block text-decoration-none rounded-2 p-2 ${STATUS_CLASS[status] || ''}`}
                          >
                            <span className="d-block small fw-bold">
                              {easternClock.format(new Date(session.startTime))}
                            </span>
                            <span className="d-block small text-body text-truncate">{label}</span>
                            {subtitle && (
                              <span className="d-block small text-secondary text-truncate">
                                {subtitle}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default WeekSchedule;
