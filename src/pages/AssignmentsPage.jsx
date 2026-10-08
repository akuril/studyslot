import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import AssignmentCard from '../components/AssignmentCard';
import FilterBar from '../components/FilterBar';
import { usePlanner } from '../context/PlannerContext';
import { DEFAULT_FILTERS, filterAssignments, sortAssignments } from '../utils/assignments';

const PAGE_SIZE = 10;

function AssignmentsPage() {
  const { classes, assignments, getClassById, toggleAssignmentComplete, deleteAssignment } =
    usePlanner();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function getClassName(classId) {
    const classItem = getClassById(classId);
    return classItem ? classItem.name : '';
  }

  // filter → sort → slice
  const matchingAssignments = sortAssignments(
    filterAssignments(assignments, filters, getClassName),
    filters.sortBy,
    getClassName
  );
  const visibleAssignments = matchingAssignments.slice(0, visibleCount);
  const hiddenCount = matchingAssignments.length - visibleAssignments.length;

  const remainingCount = assignments.filter((assignment) => !assignment.completed).length;
  const doneCount = assignments.length - remainingCount;

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.classId !== 'all' ||
    filters.type !== 'all' ||
    filters.status !== 'all';

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    // Reset the filters but keep the student's chosen sort order
    setFilters((current) => ({ ...DEFAULT_FILTERS, sortBy: current.sortBy }));
    setVisibleCount(PAGE_SIZE);
  }

  function showMore() {
    setVisibleCount((current) => current + PAGE_SIZE);
  }

  function handleDelete(assignment) {
    deleteAssignment(assignment.id);
  }

  // Situation 1: no classes yet
  if (classes.length === 0) {
    return (
      <div>
        <PageHeader title="Assignments" />
        <EmptyState
          icon="🎒"
          title="Add a class first"
          message="Every assignment belongs to a class. Add your classes, then come back here."
        >
          <Link to="/classes" className="btn btn-primary btn-lg">
            Go to My Classes
          </Link>
        </EmptyState>
      </div>
    );
  }

  // Situation 2: classes exist, but no assignments at all
  if (assignments.length === 0) {
    return (
      <div>
        <PageHeader title="Assignments" subtitle="0 to do · 0 done">
          <Link to="/assignments/new" className="btn btn-primary">
            + Add Assignment
          </Link>
        </PageHeader>
        <EmptyState
          icon="🎉"
          title="No assignments yet"
          message="Nothing to do right now! Add homework, quizzes, tests, projects, or reminders."
        >
          <Link to="/assignments/new" className="btn btn-primary btn-lg">
            + Add Your First Assignment
          </Link>
        </EmptyState>
      </div>
    );
  }

  // Situation 3: the normal page
  return (
    <div>
      <PageHeader title="Assignments" subtitle={`${remainingCount} to do · ${doneCount} done`}>
        <Link to="/assignments/new" className="btn btn-primary">
          + Add Assignment
        </Link>
      </PageHeader>

      <FilterBar
        filters={filters}
        classes={classes}
        onChange={handleFilterChange}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <p className="small text-secondary mb-3" aria-live="polite">
        {hasActiveFilters
          ? `Showing ${matchingAssignments.length} of ${assignments.length} assignments`
          : `${assignments.length} ${assignments.length === 1 ? 'assignment' : 'assignments'}`}
      </p>

      {matchingAssignments.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matches"
          message="Nothing matches your search or filters. Try different words or clear the filters."
        >
          <button type="button" className="btn btn-primary btn-lg" onClick={clearFilters}>
            Clear filters
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="d-flex flex-column gap-3">
            {visibleAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                classItem={getClassById(assignment.classId)}
                onToggleComplete={toggleAssignmentComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {hiddenCount > 0 && (
            <div className="text-center mt-4">
              <button type="button" className="btn btn-outline-primary btn-lg" onClick={showMore}>
                Show more ({hiddenCount} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AssignmentsPage;