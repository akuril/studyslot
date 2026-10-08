import { Link } from 'react-router-dom';
import { ASSIGNMENT_TYPES, getAssignmentStatus } from '../utils/assignments';
import { parseDateString } from '../utils/dates';

// One compact assignment row. Only used inside this file, so it isn't exported.
function WeekItem({ assignment, classItem, onToggleComplete }) {
  const { id, title, type, completed } = assignment;
  const typeInfo = ASSIGNMENT_TYPES[type] || ASSIGNMENT_TYPES.homework;
  const isOverdue = getAssignmentStatus(assignment) === 'overdue';
  const className = classItem ? classItem.name : 'Unknown class';
  const classColor = classItem ? classItem.color : '#adb5bd';

  return (
    <li
      className={`week-item ${completed ? 'is-completed' : ''}`}
      style={{ borderLeftColor: classColor }}
    >
      <div className="d-flex align-items-start gap-2">
        <input
          type="checkbox"
          className="form-check-input flex-shrink-0 mt-1"
          checked={completed}
          onChange={() => onToggleComplete(id)}
          aria-label={completed ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
        />
        <div className="min-w-0">
          <Link to={`/assignments/${id}`} className="week-item-title">
            <span aria-hidden="true">{typeInfo.icon}</span> {title}
          </Link>
          <div className="small text-secondary">
            {className}
            {isOverdue && <span className="text-danger fw-semibold"> · ⚠️ Overdue</span>}
          </div>
        </div>
      </div>
    </li>
  );
}

function WeekDayColumn({ dateString, isToday, assignments, getClassById, onToggleComplete }) {
  const date = parseDateString(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthAndDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fullLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section
      className={`card border-0 shadow-sm week-day ${isToday ? 'is-today' : ''}`}
      aria-label={isToday ? `${fullLabel} (today)` : fullLabel}
    >
      <div className="card-header bg-body d-flex align-items-center justify-content-between gap-2">
        <div>
          <span className="fw-bold">{dayName}</span>{' '}
          <span className="small text-secondary">{monthAndDay}</span>
        </div>
        {isToday && <span className="badge text-bg-primary">Today</span>}
      </div>

      <div className="card-body p-2">
        {assignments.length === 0 ? (
          <p className="small text-secondary text-center my-2">Nothing due</p>
        ) : (
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {assignments.map((assignment) => (
              <WeekItem
                key={assignment.id}
                assignment={assignment}
                classItem={getClassById(assignment.classId)}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default WeekDayColumn;