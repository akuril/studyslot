import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import AssignmentCard from '../components/AssignmentCard';
import TestCountdown from '../components/TestCountdown';
import { usePlanner } from '../context/PlannerContext';
import { useGoBack } from '../hooks/useGoBack';
import { sortAssignments } from '../utils/assignments';
import { daysUntil } from '../utils/dates';
import { getProgress } from '../utils/progress';

function ClassDetailsPage() {
  const { id } = useParams();
  const { assignments, getClassById, toggleAssignmentComplete, deleteAssignment } = usePlanner();
  const goBack = useGoBack('/classes');
  const [showCompleted, setShowCompleted] = useState(false);

  const classItem = getClassById(id);

  if (!classItem) {
    return (
      <EmptyState
        icon="🔍"
        title="We couldn't find that class"
        message="It may have been deleted, or the link might be wrong."
      >
        <Link to="/classes" className="btn btn-primary btn-lg">
          Back to My Classes
        </Link>
      </EmptyState>
    );
  }

  const classAssignments = assignments.filter((assignment) => assignment.classId === classItem.id);
  const progress = getProgress(classAssignments);

  const toDo = sortAssignments(classAssignments.filter((assignment) => !assignment.completed));
  const completed = sortAssignments(
    classAssignments.filter((assignment) => assignment.completed),
    'due-late'
  );

  const overdueCount = toDo.filter((assignment) => daysUntil(assignment.dueDate) < 0).length;

  const upcomingTests = toDo
    .filter(
      (assignment) =>
        (assignment.type === 'quiz' || assignment.type === 'test') &&
        daysUntil(assignment.dueDate) >= 0
    )
    .slice(0, 3);

  function handleDelete(assignment) {
    deleteAssignment(assignment.id);
  }

  return (
    <div>
      <button type="button" className="btn btn-link px-0 mb-3" onClick={goBack}>
        ← Back
      </button>

      {/* ===== Header ===== */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderTop: `6px solid ${classItem.color}` }}
      >
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div className="min-w-0">
              <h1 className="h2 fw-bold mb-1 text-break">{classItem.name}</h1>
              <p className="text-secondary mb-0">
                {classItem.teacher ? `👩‍🏫 ${classItem.teacher}` : 'No teacher added'}
              </p>
            </div>
            <div>
              <Link
                to={`/assignments/new?classId=${classItem.id}`}
                className="btn btn-primary"
              >
                + Add assignment
              </Link>
            </div>
          </div>

          <div className="mt-4">
            {progress.total === 0 ? (
              <p className="text-secondary mb-0">No assignments for this class yet.</p>
            ) : (
              <>
                <div className="d-flex justify-content-between small mb-1">
                  <span className="fw-semibold">{progress.percent}% done</span>
                  <span className="text-secondary">
                    {progress.done} of {progress.total} finished
                    {overdueCount > 0 && (
                      <span className="text-danger fw-semibold"> · ⚠️ {overdueCount} overdue</span>
                    )}
                  </span>
                </div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-label={`${classItem.name} progress`}
                  aria-valuenow={progress.percent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ height: '10px' }}
                >
                  <div
                    className="progress-bar"
                    style={{ width: `${progress.percent}%`, backgroundColor: classItem.color }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* ===== To do ===== */}
        <div className="col-12 col-lg-8">
          <h2 className="h5 fw-bold mb-3">To do ({toDo.length})</h2>

          {toDo.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="Nothing to do for this class"
              message={
                progress.total > 0
                  ? 'Everything is finished. Great work!'
                  : 'Add homework, quizzes, or tests for this class.'
              }
            />
          ) : (
            <div className="d-flex flex-column gap-3">
              {toDo.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  classItem={classItem}
                  onToggleComplete={toggleAssignmentComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* ===== Completed (hidden until asked for) ===== */}
          {completed.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
              >
                {showCompleted ? 'Hide' : 'Show'} completed ({completed.length})
              </button>

              {showCompleted && (
                <div className="d-flex flex-column gap-3 mt-3">
                  {completed.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      classItem={classItem}
                      onToggleComplete={toggleAssignmentComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Quizzes & tests for this class ===== */}
        <div className="col-12 col-lg-4">
          <h2 className="h5 fw-bold mb-3">Quizzes & tests</h2>
          <div className="card border-0 shadow-sm">
            {upcomingTests.length === 0 ? (
              <div className="card-body text-center text-secondary py-4">
                <p className="fs-2 mb-1" aria-hidden="true">
                  😌
                </p>
                <p className="mb-0">None coming up for this class.</p>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {upcomingTests.map((assignment) => (
                  <TestCountdown key={assignment.id} assignment={assignment} classItem={classItem} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassDetailsPage;