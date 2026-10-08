import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ProgressRing from '../components/ProgressRing';
import { usePlanner } from '../context/PlannerContext';
import { ASSIGNMENT_TYPES, sortAssignments } from '../utils/assignments';
import { daysUntil, todayString } from '../utils/dates';
import { getProgress } from '../utils/progress';

function getEncouragement(progress) {
  if (progress.percent === 100) return "🎉 All done for today! You're crushing it.";
  if (progress.percent >= 50) return "💪 More than halfway there. Keep going!";
  if (progress.done > 0) return '👍 Nice start! One thing at a time.';
  return "🚀 Let's get started. Pick the easiest one first!";
}

// One big, tap-anywhere row. Only used in this file.
function FocusItem({ assignment, classItem, onToggleComplete }) {
  const { id, title, type, priority, completed } = assignment;
  const typeInfo = ASSIGNMENT_TYPES[type] || ASSIGNMENT_TYPES.homework;
  const isOverdue = !completed && daysUntil(assignment.dueDate) < 0;
  const className = classItem ? classItem.name : 'Unknown class';
  const classColor = classItem ? classItem.color : '#adb5bd';

  return (
    <li className={`focus-item ${completed ? 'is-done' : ''}`} style={{ borderLeftColor: classColor }}>
      <label className="focus-label">
        <input
          type="checkbox"
          className="form-check-input focus-checkbox flex-shrink-0 m-0"
          checked={completed}
          onChange={() => onToggleComplete(id)}
        />
        <span className="flex-grow-1 min-w-0">
          <span className="d-block fw-semibold focus-title text-break">
            <span aria-hidden="true">{typeInfo.icon}</span> {title}
          </span>
          <span className="d-block small text-secondary">
            {className}
            {isOverdue && <span className="text-danger fw-semibold"> · ⚠️ Overdue</span>}
            {priority === 'high' && !completed && <span> · 🔥 High priority</span>}
          </span>
        </span>
      </label>

      <Link
        to={`/assignments/${id}`}
        className="btn btn-link text-secondary text-decoration-none fs-4 px-3"
        aria-label={`Details for ${title}`}
      >
        ›
      </Link>
    </li>
  );
}

function TodayPage() {
  const { assignments, getClassById, toggleAssignmentComplete } = usePlanner();
  const today = todayString();

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Due today (done or not), plus overdue work that's unfinished OR was finished today.
  const todaysList = assignments.filter((assignment) => {
    const days = daysUntil(assignment.dueDate);

    if (days === 0) return true;
    if (days < 0) return !assignment.completed || assignment.completedAt === today;
    return false;
  });

  const sortedList = sortAssignments(todaysList);
  const progress = getProgress(todaysList);

  const dueTomorrow = sortAssignments(
    assignments.filter(
      (assignment) => !assignment.completed && daysUntil(assignment.dueDate) === 1
    ),
    'priority'
  );

  const showTomorrow = (todaysList.length === 0 || progress.remaining === 0) && dueTomorrow.length > 0;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        <div className="text-center mb-4">
          <h1 className="h2 fw-bold mb-1">🎯 Focus</h1>
          <p className="text-secondary mb-0">{todayLabel}</p>
        </div>

        {todaysList.length === 0 ? (
          <EmptyState
            icon="🌴"
            title="Nothing due today"
            message="Enjoy your free time, or get ahead on what's coming up."
          />
        ) : (
          <>
            {/* Progress */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body d-flex flex-column flex-sm-row align-items-center gap-4 p-4 text-center text-sm-start">
                <ProgressRing
                  percent={progress.percent}
                  label={`${progress.done} of ${progress.total}`}
                />
                <div>
                  <p className="fs-5 fw-semibold mb-1" aria-live="polite">
                    {getEncouragement(progress)}
                  </p>
                  <p className="text-secondary mb-0">
                    {progress.remaining === 0
                      ? 'Everything for today is finished.'
                      : `${progress.remaining} left to do today.`}
                  </p>
                </div>
              </div>
            </div>

            {/* The list */}
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              {sortedList.map((assignment) => (
                <FocusItem
                  key={assignment.id}
                  assignment={assignment}
                  classItem={getClassById(assignment.classId)}
                  onToggleComplete={toggleAssignmentComplete}
                />
              ))}
            </ul>
          </>
        )}

        {/* Get ahead */}
        {showTomorrow && (
          <div className="mt-5">
            <h2 className="h6 fw-bold text-secondary text-uppercase mb-3">
              Get ahead: due tomorrow
            </h2>
            <div className="list-group shadow-sm">
              {dueTomorrow.map((assignment) => {
                const classItem = getClassById(assignment.classId);
                const typeInfo = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.homework;

                return (
                  <Link
                    key={assignment.id}
                    to={`/assignments/${assignment.id}`}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2 py-3"
                  >
                    <span className="min-w-0 text-truncate">
                      <span aria-hidden="true">{typeInfo.icon}</span> {assignment.title}
                    </span>
                    <span className="small text-secondary flex-shrink-0">
                      {classItem ? classItem.name : ''}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodayPage;