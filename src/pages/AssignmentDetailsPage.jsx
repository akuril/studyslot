import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import SubtaskChecklist from '../components/SubtaskChecklist';
import { usePlanner } from '../context/PlannerContext';
import { useGoBack } from '../hooks/useGoBack';
import { ASSIGNMENT_TYPES, STATUS_INFO, getAssignmentStatus } from '../utils/assignments';
import { daysUntil, parseDateString } from '../utils/dates';

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: '🔥 High',
};

// Turns a number of days into a friendly sentence.
function describeDueDate(days, completed) {
  if (completed) return 'Finished. Nice work!';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  if (days === -1) return 'Was due yesterday';
  return `Was due ${Math.abs(days)} days ago`;
}

function AssignmentDetailsPage() {
  const { id } = useParams();
  const {
    assignments,
    getClassById,
    toggleAssignmentComplete,
    deleteAssignment,
    addSubtasks,
    toggleSubtask,
    deleteSubtask,
  } = usePlanner();
  const goBack = useGoBack('/assignments');

  const assignment = assignments.find((item) => item.id === id);

  if (!assignment) {
    return (
      <EmptyState
        icon="🔍"
        title="We couldn't find that assignment"
        message="It may have been deleted, or the link might be wrong."
      >
        <Link to="/assignments" className="btn btn-primary btn-lg">
          Back to Assignments
        </Link>
      </EmptyState>
    );
  }

  const { title, type, dueDate, priority, notes, completed } = assignment;
  const classItem = getClassById(assignment.classId);
  const status = STATUS_INFO[getAssignmentStatus(assignment)];
  const typeInfo = ASSIGNMENT_TYPES[type] || ASSIGNMENT_TYPES.homework;
  const days = daysUntil(dueDate);
  const classColor = classItem ? classItem.color : '#adb5bd';

  const fullDueDate = parseDateString(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  function handleDelete() {
    deleteAssignment(assignment.id);
    goBack();
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        <button type="button" className="btn btn-link px-0 mb-3" onClick={goBack}>
          ← Back
        </button>

        <div className="card border-0 shadow-sm" style={{ borderTop: `6px solid ${classColor}` }}>
          <div className="card-body p-4">
            {/* Badges */}
            <div className="d-flex flex-wrap gap-1 mb-3">
              <span className={`badge ${status.badgeClass}`}>
                {status.icon} {status.label}
              </span>
              <span className="badge bg-body-secondary text-body border">
                {typeInfo.icon} {typeInfo.label}
              </span>
            </div>

            {/* Title */}
            <h1
              className={`h3 fw-bold mb-4 text-break ${
                completed ? 'text-decoration-line-through text-secondary' : ''
              }`}
            >
              {title}
            </h1>

            {/* Details list */}
            <dl className="row mb-0">
              <dt className="col-sm-3 text-secondary fw-semibold">Class</dt>
              <dd className="col-sm-9">
                <span className="d-inline-flex align-items-center gap-2">
                  <span
                    className="rounded-circle"
                    style={{ width: '12px', height: '12px', backgroundColor: classColor }}
                    aria-hidden="true"
                  ></span>
                  <span>
                    {classItem ? classItem.name : 'Unknown class'}
                    {classItem && classItem.teacher && (
                      <span className="text-secondary"> · {classItem.teacher}</span>
                    )}
                  </span>
                </span>
              </dd>

              <dt className="col-sm-3 text-secondary fw-semibold">Due</dt>
              <dd className="col-sm-9">
                <div>{fullDueDate}</div>
                <div
                  className={`small fw-semibold ${
                    !completed && days < 0 ? 'text-danger' : 'text-secondary'
                  }`}
                >
                  {describeDueDate(days, completed)}
                </div>
              </dd>

              <dt className="col-sm-3 text-secondary fw-semibold">Priority</dt>
              <dd className="col-sm-9">{PRIORITY_LABELS[priority] || 'Medium'}</dd>

              <dt className="col-sm-3 text-secondary fw-semibold">Notes</dt>
              <dd className="col-sm-9 mb-0">
                {notes ? (
                  <p className="mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                    {notes}
                  </p>
                ) : (
                  <span className="text-secondary fst-italic">No notes</span>
                )}
              </dd>
            </dl>
          </div>

          {/* Actions */}
          <div className="card-footer bg-body p-4 pt-0 border-0">
            <div className="d-flex flex-column flex-sm-row gap-2">
              <button
                type="button"
                className={`btn btn-lg ${completed ? 'btn-outline-secondary' : 'btn-success'}`}
                onClick={() => toggleAssignmentComplete(assignment.id)}
              >
                {completed ? '↩️ Mark as not done' : '✅ Mark as done'}
              </button>
              <Link to={`/assignments/${assignment.id}/edit`} className="btn btn-outline-primary btn-lg">
                ✏️ Edit
              </Link>
              <button type="button" className="btn btn-outline-danger btn-lg" onClick={handleDelete}>
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>

        {/* Steps */}
        <SubtaskChecklist
          key={assignment.id}
          assignment={assignment}
          onAddSteps={(stepTitles) => addSubtasks(assignment.id, stepTitles)}
          onToggleStep={(stepId) => toggleSubtask(assignment.id, stepId)}
          onDeleteStep={(stepId) => deleteSubtask(assignment.id, stepId)}
          onMarkAssignmentDone={() => toggleAssignmentComplete(assignment.id)}
        />
      </div>
    </div>
  );
}

export default AssignmentDetailsPage;