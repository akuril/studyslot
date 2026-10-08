import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { usePlanner } from '../context/PlannerContext';
import { ASSIGNMENT_TYPES } from '../utils/assignments';
import {
  addDays,
  formatDueDate,
  formatWeekRange,
  getRelativeWeekLabel,
  getWeekStart,
  todayString,
} from '../utils/dates';

const WEEKS_PER_PAGE = 4;

// When was it finished? Older saved data has no completedAt, so fall back to the due date.
function getFinishedDate(assignment) {
  return assignment.completedAt || assignment.dueDate;
}

// Counts days in a row (ending today or yesterday) with at least one thing finished.
function getStreak(finishedDays) {
  const today = todayString();
  let day = finishedDays.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (finishedDays.has(day)) {
    streak = streak + 1;
    day = addDays(day, -1);
  }

  return streak;
}

// One finished assignment. Only used in this file.
function DoneItem({ assignment, classItem, onUndo }) {
  const typeInfo = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.homework;
  const className = classItem ? classItem.name : 'Unknown class';
  const classColor = classItem ? classItem.color : '#adb5bd';

  return (
    <li className="list-group-item d-flex align-items-center gap-3 py-3">
      <span className="fs-5" aria-hidden="true">
        ✅
      </span>

      <div className="flex-grow-1 min-w-0">
        <Link
          to={`/assignments/${assignment.id}`}
          className="d-block fw-semibold text-truncate link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover"
        >
          <span aria-hidden="true">{typeInfo.icon}</span> {assignment.title}
        </Link>
        <span className="small text-secondary d-inline-flex align-items-center gap-1">
          <span
            className="rounded-circle"
            style={{ width: '9px', height: '9px', backgroundColor: classColor }}
            aria-hidden="true"
          ></span>
          {className} · Finished {formatDueDate(getFinishedDate(assignment))}
        </span>
      </div>

      <button
        type="button"
        className="btn btn-sm btn-outline-secondary flex-shrink-0"
        onClick={() => onUndo(assignment.id)}
        aria-label={`Mark "${assignment.title}" as not done`}
      >
        ↩️ <span className="d-none d-sm-inline">Undo</span>
      </button>
    </li>
  );
}

function DonePage() {
  const { assignments, getClassById, toggleAssignmentComplete } = usePlanner();
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS_PER_PAGE);

  const finished = assignments.filter((assignment) => assignment.completed);

  // Group finished work by the Monday of the week it was finished.
  const groups = finished.reduce((result, assignment) => {
    const weekStart = getWeekStart(getFinishedDate(assignment));

    if (!result[weekStart]) {
      result[weekStart] = [];
    }

    result[weekStart].push(assignment);
    return result;
  }, {});

  // Newest week first.
  const weekStarts = Object.keys(groups).sort().reverse();
  const shownWeekStarts = weekStarts.slice(0, visibleWeeks);
  const hiddenWeekCount = weekStarts.length - shownWeekStarts.length;

  // Summary numbers.
  const thisWeekStart = getWeekStart(todayString());
  const thisWeekCount = groups[thisWeekStart] ? groups[thisWeekStart].length : 0;

  // Only real completion dates count toward the streak.
  const finishedDays = new Set(
    finished
      .filter((assignment) => assignment.completedAt)
      .map((assignment) => assignment.completedAt)
  );
  const streak = getStreak(finishedDays);

  if (finished.length === 0) {
    return (
      <div>
        <PageHeader title="🏆 Done" subtitle="Everything you've finished, week by week." />
        <EmptyState
          icon="🏁"
          title="Nothing finished yet"
          message="Tick off an assignment and it'll show up here. Your first one is the hardest!"
        >
          <Link to="/today" className="btn btn-primary btn-lg">
            🎯 Go to Today
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="🏆 Done" subtitle="Everything you've finished, week by week." />

      {/* ===== Summary ===== */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <StatCard
            icon="🏆"
            label="Finished"
            value={finished.length}
            tone="success"
            message="All time"
          />
        </div>
        <div className="col-6 col-sm-4">
          <StatCard
            icon="📅"
            label="This week"
            value={thisWeekCount}
            tone="info"
            message={thisWeekCount >= 5 ? 'Amazing week! 🎉' : 'Keep it going'}
          />
        </div>
        <div className="col-6 col-sm-4">
          <StatCard
            icon="🔥"
            label="Day streak"
            value={streak}
            tone="warning"
            message={streak > 0 ? 'Keep it up!' : 'Finish something today'}
          />
        </div>
      </div>

      {/* ===== Weeks ===== */}
      <div className="d-flex flex-column gap-4">
        {shownWeekStarts.map((weekStart) => {
          const weekItems = [...groups[weekStart]].sort((a, b) =>
            getFinishedDate(b).localeCompare(getFinishedDate(a))
          );

          return (
            <section key={weekStart}>
              <div className="d-flex flex-wrap align-items-baseline gap-2 mb-2">
                <h2 className="h5 fw-bold mb-0">{getRelativeWeekLabel(weekStart)}</h2>
                <span className="small text-secondary">{formatWeekRange(weekStart)}</span>
                <span className="badge text-bg-success ms-auto">
                  {weekItems.length} finished
                </span>
              </div>

              <ul className="list-group shadow-sm">
                {weekItems.map((assignment) => (
                  <DoneItem
                    key={assignment.id}
                    assignment={assignment}
                    classItem={getClassById(assignment.classId)}
                    onUndo={toggleAssignmentComplete}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {hiddenWeekCount > 0 && (
        <div className="text-center mt-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-lg"
            onClick={() => setVisibleWeeks((current) => current + WEEKS_PER_PAGE)}
          >
            Show older weeks ({hiddenWeekCount} more)
          </button>
        </div>
      )}
    </div>
  );
}

export default DonePage;