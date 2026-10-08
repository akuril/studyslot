import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import TestCountdown from '../components/TestCountdown';
import AssignmentCard from '../components/AssignmentCard';
import { usePlanner } from '../context/PlannerContext';
import { sortAssignments } from '../utils/assignments';
import { daysUntil } from '../utils/dates';

const UPCOMING_WINDOW_DAYS = 7;
const WHATS_NEXT_LIMIT = 5;
const TESTS_LIMIT = 4;

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardPage() {
  const { classes, assignments, getClassById, toggleAssignmentComplete, deleteAssignment } =
    usePlanner();

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ===== Welcome screen for brand-new users =====
  if (classes.length === 0) {
    return (
      <div>
        <PageHeader title="Welcome to HomeworkHQ! 👋" subtitle={todayLabel} />
        <EmptyState
          icon="🎒"
          title="Let's get you set up"
          message="Step 1: add your classes. Step 2: add your homework, quizzes, and tests. That's it!"
        >
          <Link to="/classes" className="btn btn-primary btn-lg">
            Add My Classes
          </Link>
        </EmptyState>
      </div>
    );
  }

  // ===== Derived data (all calculated from `assignments`) =====
  const unfinished = assignments.filter((assignment) => !assignment.completed);

  const overdue = unfinished.filter((assignment) => daysUntil(assignment.dueDate) < 0);

  const dueToday = unfinished.filter((assignment) => daysUntil(assignment.dueDate) === 0);

  const nextSevenDays = unfinished.filter((assignment) => {
    const days = daysUntil(assignment.dueDate);
    return days >= 1 && days <= UPCOMING_WINDOW_DAYS;
  });

  const doneCount = assignments.length - unfinished.length;

  // Overdue + today + the next 7 days, most urgent first
  const whatsNextAll = sortAssignments(
    unfinished.filter((assignment) => daysUntil(assignment.dueDate) <= UPCOMING_WINDOW_DAYS)
  );
  const whatsNext = whatsNextAll.slice(0, WHATS_NEXT_LIMIT);
  const whatsNextHidden = whatsNextAll.length - whatsNext.length;

  const upcomingTests = sortAssignments(
    unfinished.filter(
      (assignment) =>
        (assignment.type === 'quiz' || assignment.type === 'test') &&
        daysUntil(assignment.dueDate) >= 0
    )
  ).slice(0, TESTS_LIMIT);

  const isAllCaughtUp = assignments.length > 0 && overdue.length === 0 && dueToday.length === 0;

  function handleDelete(assignment) {
    deleteAssignment(assignment.id);
  }

  return (
    <div>
      <PageHeader title={`${getGreeting()}! 👋`} subtitle={todayLabel}>
        <Link to="/assignments/new" className="btn btn-primary">
          + Add Assignment
        </Link>
      </PageHeader>

      {/* ===== Stat cards ===== */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            icon="⚠️"
            label="Overdue"
            value={overdue.length}
            tone="danger"
            message={overdue.length > 0 ? "Let's catch up!" : 'Nothing late 👍'}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="📌"
            label="Due Today"
            value={dueToday.length}
            tone="warning"
            message={dueToday.length > 0 ? 'You can do it!' : 'Free for today'}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="📅"
            label="Next 7 Days"
            value={nextSevenDays.length}
            tone="info"
            message="Coming up soon"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="✅"
            label="Done"
            value={doneCount}
            tone="success"
            message={doneCount > 0 ? 'See your history →' : 'Tick things off as you go'}
            to="/done"
          />
        </div>
      </div>

      {isAllCaughtUp && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="status">
          <span className="fs-4" aria-hidden="true">
            🎉
          </span>
          <span>
            <strong>You're all caught up for today.</strong> Nothing overdue and nothing due today.
            Nice work!
          </span>
        </div>
      )}

      <div className="row g-4">
        {/* ===== What's next ===== */}
        <div className="col-12 col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0">What's next</h2>
            <Link to="/assignments" className="small">
              View all →
            </Link>
          </div>

          {whatsNext.length === 0 ? (
            <EmptyState
              icon="🌴"
              title="Nothing due in the next week"
              message="Enjoy the break, or add something new that's coming up."
            >
              <Link to="/assignments/new" className="btn btn-primary">
                + Add Assignment
              </Link>
            </EmptyState>
          ) : (
            <>
              <div className="d-flex flex-column gap-3">
                {whatsNext.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    classItem={getClassById(assignment.classId)}
                    onToggleComplete={toggleAssignmentComplete}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {whatsNextHidden > 0 && (
                <p className="small text-secondary mt-3 mb-0">
                  + {whatsNextHidden} more due this week.{' '}
                  <Link to="/assignments">See them all</Link>
                </p>
              )}
            </>
          )}
        </div>

        {/* ===== Quizzes & tests countdown ===== */}
        <div className="col-12 col-lg-4">
          <h2 className="h5 fw-bold mb-3">Quizzes & tests</h2>

          <div className="card border-0 shadow-sm">
            {upcomingTests.length === 0 ? (
              <div className="card-body text-center text-secondary py-4">
                <p className="fs-2 mb-1" aria-hidden="true">
                  😌
                </p>
                <p className="mb-0">No quizzes or tests coming up.</p>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {upcomingTests.map((assignment) => (
                  <TestCountdown
                    key={assignment.id}
                    assignment={assignment}
                    classItem={getClassById(assignment.classId)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;