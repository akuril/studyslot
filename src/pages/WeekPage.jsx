import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import WeekDayColumn from '../components/WeekDayColumn';
import PrintableWeek from '../components/PrintableWeek';
import CalendarViewSwitch from '../components/CalendarViewSwitch';
import { usePlanner } from '../context/PlannerContext';
import { sortAssignments } from '../utils/assignments';
import {
  addDays,
  formatWeekRange,
  getWeekDays,
  getRelativeWeekLabel,
  getWeekStart,
  todayString,
} from '../utils/dates';


function WeekPage() {
  
  const { assignments, getClassById, toggleAssignmentComplete } = usePlanner();

  const today = todayString();
  const thisWeekStart = getWeekStart(today);

  const [weekStart, setWeekStart] = useState(thisWeekStart);

  const weekDays = getWeekDays(weekStart);
  const weekEnd = weekDays[6];
  const weekRange = formatWeekRange(weekStart);
  const isCurrentWeek = weekStart === thisWeekStart;

  const weekAssignments = assignments.filter(
    (assignment) => assignment.dueDate >= weekStart && assignment.dueDate <= weekEnd
  );
  const doneCount = weekAssignments.filter((assignment) => assignment.completed).length;

  function goToPreviousWeek() {
    setWeekStart((current) => addDays(current, -7));
  }

  function goToNextWeek() {
    setWeekStart((current) => addDays(current, 7));
  }

  function goToThisWeek() {
    setWeekStart(thisWeekStart);
  }

  return (
    <div>
      {/* ===== Screen version (hidden when printing) ===== */}
      <div className="d-print-none">
        <PageHeader title="Calendar" subtitle={weekRange}>
          <CalendarViewSwitch />
          <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>
            🖨️ Print
          </button>
        </PageHeader>

        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3">
          <div className="btn-group" role="group" aria-label="Choose a week">
            <button type="button" className="btn btn-outline-primary" onClick={goToPreviousWeek}>
              ← Previous
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={goToThisWeek}
              disabled={isCurrentWeek}
            >
              This week
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={goToNextWeek}>
              Next →
            </button>
          </div>

          <p className="mb-0 text-secondary small" aria-live="polite">
            <strong>{getRelativeWeekLabel(weekStart)}</strong> ·{' '}
            {weekAssignments.length} due · {doneCount} done
          </p>
        </div>

        <div className="week-grid">
          {weekDays.map((dateString) => (
            <WeekDayColumn
              key={dateString}
              dateString={dateString}
              isToday={dateString === today}
              assignments={sortAssignments(
                weekAssignments.filter((assignment) => assignment.dueDate === dateString),
                'priority'
              )}
              getClassById={getClassById}
              onToggleComplete={toggleAssignmentComplete}
            />
          ))}
        </div>
      </div>

      {/* ===== Paper version (hidden on screen) ===== */}
      <PrintableWeek
        weekDays={weekDays}
        weekAssignments={weekAssignments}
        weekRange={weekRange}
        getClassById={getClassById}
      />
    </div>
  );
}

export default WeekPage;