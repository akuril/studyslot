import { daysUntil } from './dates';

// Display info for each assignment type.
export const ASSIGNMENT_TYPES = {
  homework: { label: 'Homework', icon: '📝' },
  quiz: { label: 'Quiz', icon: '✏️' },
  test: { label: 'Test', icon: '📋' },
  project: { label: 'Project', icon: '🛠️' },
  reminder: { label: 'Reminder', icon: '🔔' },
};

// Display info for each status. Icon + text + color, never color alone.
export const STATUS_INFO = {
  overdue: { label: 'Overdue', icon: '⚠️', badgeClass: 'text-bg-danger' },
  today: { label: 'Due Today', icon: '📌', badgeClass: 'text-bg-warning' },
  upcoming: { label: 'Upcoming', icon: '📅', badgeClass: 'text-bg-info' },
  completed: { label: 'Completed', icon: '✅', badgeClass: 'text-bg-success' },
};

// Choices for the Status filter dropdown.
export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Still to do' },
  { value: 'overdue', label: '⚠️ Overdue' },
  { value: 'today', label: '📌 Due today' },
  { value: 'upcoming', label: '📅 Upcoming' },
  { value: 'completed', label: '✅ Completed' },
];

// Choices for the Sort dropdown.
export const SORT_OPTIONS = [
  { value: 'due-soon', label: 'Due date: soonest first' },
  { value: 'due-late', label: 'Due date: latest first' },
  { value: 'priority', label: 'Priority: high first' },
  { value: 'class', label: 'Class: A–Z' },
  { value: 'title', label: 'Title: A–Z' },
];

// Starting values for the filter bar ("show everything, soonest first").
export const DEFAULT_FILTERS = {
  search: '',
  classId: 'all',
  type: 'all',
  status: 'all',
  sortBy: 'due-soon',
};

// Lower number = more important. Used for sorting by priority.
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

/** Works out an assignment's status from its due date and completed flag. */
export function getAssignmentStatus(assignment) {
  if (assignment.completed) {
    return 'completed';
  }

  const days = daysUntil(assignment.dueDate);

  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  return 'upcoming';
}

/**
 * Returns only the assignments that match ALL the active filters.
 * `getClassName` turns a classId into a class name (so search can match class names).
 */
export function filterAssignments(assignments, filters, getClassName) {
  const searchText = filters.search.trim().toLowerCase();

  return assignments.filter((assignment) => {
    // 1. Class filter
    if (filters.classId !== 'all' && assignment.classId !== filters.classId) {
      return false;
    }

    // 2. Type filter
    if (filters.type !== 'all' && assignment.type !== filters.type) {
      return false;
    }

    // 3. Status filter
    if (filters.status !== 'all') {
      const status = getAssignmentStatus(assignment);

      if (filters.status === 'todo') {
        if (status === 'completed') return false;
      } else if (status !== filters.status) {
        return false;
      }
    }

    // 4. Search: looks in the title, notes, and class name
    if (searchText !== '') {
      const searchableText =
        `${assignment.title} ${assignment.notes} ${getClassName(assignment.classId)}`.toLowerCase();

      if (!searchableText.includes(searchText)) {
        return false;
      }
    }

    // Passed every check, so keep it
    return true;
  });
}

/**
 * Returns a NEW sorted array. Unfinished work always comes before completed work;
 * `sortBy` decides the order within each group.
 */
export function sortAssignments(assignments, sortBy = 'due-soon', getClassName = () => '') {
  return [...assignments].sort((a, b) => {
    // Completed work always sinks to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    let result;

    if (sortBy === 'due-late') {
      result = b.dueDate.localeCompare(a.dueDate);
    } else if (sortBy === 'priority') {
      result = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    } else if (sortBy === 'class') {
      result = getClassName(a.classId).localeCompare(getClassName(b.classId));
    } else if (sortBy === 'title') {
      result = a.title.localeCompare(b.title);
    } else {
      result = a.dueDate.localeCompare(b.dueDate);
    }

    // Tie-breaker: if two items are equal, show the one due sooner first
    if (result === 0) {
      result = a.dueDate.localeCompare(b.dueDate);
    }

    return result;
  });
}