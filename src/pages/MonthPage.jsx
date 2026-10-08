import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import CalendarViewSwitch from '../components/CalendarViewSwitch';
import WeekDayColumn from '../components/WeekDayColumn';
import { usePlanner } from '../context/PlannerContext';
import { sortAssignments } from '../utils/assignments';
import {
  addMonths,
  formatMonthYear,
  getMonthGridDays,
  getMonthStart,
  parseDateString,
  todayString,
} from '../utils/dates';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_DOTS = 3;

function MonthPage() {
  const { assignments, getClassById, toggleAssignmentComplete } = usePlanner();

  const today = todayString();
  const thisMonthStart = getMonthStart(today);

  const [monthStart, setMonthStart] = useState(thisMonthStart);
  const [selectedDate, setSelectedDate] = useState(today);

  const gridDays = getMonthGridDays(monthStart);
  const monthPrefix = monthStart.slice(0, 7); // e.g. "2026-10"
  const isCurrentMonth = monthStart === thisMonthStart;

  // Group every assignment by its due date, once: { "2026-10-07": [...], ... }
  const assignmentsByDate = assignments.reduce((result, assignment) => {
    if (!result[assignment.dueDate]) {
      result[assignment.dueDate] = [];
    }
    result[assignment.dueDate].push(assignment);
    return result;
  }, {});

  const monthAssignments = assignments.filter((assignment) =>
    assignment.dueDate.startsWith(monthPrefix)
  );
  const monthDoneCount = monthAssignments.filter((assignment) => assignment.completed).length;

  const selectedAssignments = selectedDate
    ? sortAssignments(assignmentsByDate[selectedDate] || [], 'priority')
    : [];

  function goToMonth(newMonthStart) {
    setMonthStart(newMonthStart);
    // Back on the current month? Select today. Otherwise, wait for a tap.
    setSelectedDate(newMonthStart === thisMonthStart ? today : null);
  }

  return (
    <div>
      <PageHeader title="Calendar" subtitle={formatMonthYear(monthStart)}>
        <CalendarViewSwitch />
      </PageHeader>

      {/* Month navigation */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3">
        <div className="btn-group" role="group" aria-label="Choose a month">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => goToMonth(addMonths(monthStart, -1))}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => goToMonth(thisMonthStart)}
            disabled={isCurrentMonth}
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => goToMonth(addMonths(monthStart, 1))}
          >
            Next →
          </button>
        </div>

        <p className="mb-0 text-secondary small" aria-live="polite">
          {monthAssignments.length} due this month · {monthDoneCount} done
        </p>
      </div>

      <div className="row g-4">
        {/* ===== The grid ===== */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2 p-sm-3">
              <div className="month-grid mb-1" aria-hidden="true">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="month-weekday">
                    {label}
                  </div>
                ))}
              </div>

              <div className="month-grid">
                {gridDays.map((dateString) => {
                  const dayAssignments = assignmentsByDate[dateString] || [];
                  const unfinished = dayAssignments.filter((assignment) => !assignment.completed);
                  const doneCount = dayAssignments.length - unfinished.length;

                  const dots = unfinished.slice(0, MAX_DOTS);
                  const extraCount = unfinished.length - dots.length;

                  const isInMonth = dateString.startsWith(monthPrefix);
                  const isToday = dateString === today;
                  const isSelected = dateString === selectedDate;
                  const isAllDone = dayAssignments.length > 0 && unfinished.length === 0;
                  const hasOverdue = dateString < today && unfinished.length > 0;

                  const date = parseDateString(dateString);
                  const fullLabel = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  });
                  const summary =
                    dayAssignments.length === 0
                      ? 'nothing due'
                      : `${unfinished.length} to do, ${doneCount} done`;

                  const cellClasses = [
                    'month-cell',
                    isInMonth ? '' : 'is-outside',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                  ].join(' ');

                  return (
                    <button
                      key={dateString}
                      type="button"
                      className={cellClasses}
                      onClick={() => setSelectedDate(dateString)}
                      aria-pressed={isSelected}
                      aria-label={`${fullLabel}${isToday ? ' (today)' : ''}: ${summary}`}
                    >
                      <span className={`month-day-number ${hasOverdue ? 'text-danger' : ''}`}>
                        {date.getDate()}
                      </span>

                      <span className="month-dots">
                        {dots.map((assignment) => {
                          const classItem = getClassById(assignment.classId);
                          return (
                            <span
                              key={assignment.id}
                              className="month-dot"
                              style={{ backgroundColor: classItem ? classItem.color : '#adb5bd' }}
                            ></span>
                          );
                        })}
                        {extraCount > 0 && <span className="month-more">+{extraCount}</span>}
                        {isAllDone && <span className="month-more text-success">✓</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Selected day ===== */}
        <div className="col-12 col-lg-4">
          {selectedDate ? (
            <WeekDayColumn
              dateString={selectedDate}
              isToday={selectedDate === today}
              assignments={selectedAssignments}
              getClassById={getClassById}
              onToggleComplete={toggleAssignmentComplete}
            />
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center text-secondary py-4">
                <p className="fs-2 mb-1" aria-hidden="true">
                  👆
                </p>
                <p className="mb-0">Tap a day to see what's due.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonthPage;