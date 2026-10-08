import { Link } from 'react-router-dom';
import { ASSIGNMENT_TYPES, STATUS_INFO, getAssignmentStatus } from '../utils/assignments';
import { formatDueDate } from '../utils/dates';

function AssignmentCard({ assignment, classItem, onToggleComplete, onDelete }) {
  const { id, title, type, dueDate, priority, notes, completed } = assignment;
  const steps = assignment.subtasks || [];
  const stepsDone = steps.filter((step) => step.done).length;
  const status = STATUS_INFO[getAssignmentStatus(assignment)];
  const typeInfo = ASSIGNMENT_TYPES[type] || ASSIGNMENT_TYPES.homework;

  // If the class is missing for any reason, show a safe fallback instead of crashing.
  const className = classItem ? classItem.name : 'Unknown class';
  const classColor = classItem ? classItem.color : '#adb5bd';

  return (
    <div
      className={`card border-0 shadow-sm assignment-card ${completed ? 'is-completed' : ''}`}
      style={{ borderLeft: `6px solid ${classColor}` }}
    >
      <div className="card-body d-flex gap-3">
        <div className="pt-1">
          <input
            id={`complete-${id}`}
            type="checkbox"
            className="form-check-input assignment-checkbox"
            checked={completed}
            onChange={() => onToggleComplete(id)}
            aria-label={completed ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
          />
        </div>

        <div className="flex-grow-1 min-w-0">
          <div className="d-flex flex-wrap gap-1 mb-2">
            <span className={`badge ${status.badgeClass}`}>
              {status.icon} {status.label}
            </span>
            <span className="badge bg-body-secondary text-body border">
              {typeInfo.icon} {typeInfo.label}
            </span>
            {priority === 'high' && !completed && (
              <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                🔥 High priority
              </span>
            )}
          </div>

          <h2 className="h6 fw-bold mb-1 assignment-title">
            <Link
              to={`/assignments/${id}`}
              className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover text-break"
            >
              {title}
            </Link>
          </h2>

          <p className="small text-secondary mb-0 d-flex flex-wrap align-items-center gap-2">
            <span className="d-inline-flex align-items-center gap-1">
              <span
                className="rounded-circle"
                style={{ width: '10px', height: '10px', backgroundColor: classColor }}
                aria-hidden="true"
              ></span>
              {className}
            </span>
            <span aria-hidden="true">·</span>
            <span>Due {formatDueDate(dueDate)}</span>
                        {steps.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className={stepsDone === steps.length ? 'text-success fw-semibold' : ''}>
                  ☑️ {stepsDone}/{steps.length} steps
                </span>
              </>
            )}
          </p>

          {notes && <p className="small mb-0 mt-2 assignment-notes">{notes}</p>}
        </div>

        <div className="d-flex flex-column gap-2 flex-shrink-0">
          <Link
            to={`/assignments/${id}/edit`}
            className="btn btn-outline-secondary btn-sm"
            aria-label={`Edit ${title}`}
          >
            ✏️ <span className="d-none d-md-inline">Edit</span>
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(assignment)}
            aria-label={`Delete ${title}`}
          >
            🗑️ <span className="d-none d-md-inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignmentCard;