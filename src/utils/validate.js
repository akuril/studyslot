import { ASSIGNMENT_TYPES } from './assignments';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITIES = ['low', 'medium', 'high'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Returns a clean class object, or null if it's missing something essential.
 */
export function cleanClass(item) {
  if (!item || !isNonEmptyString(item.id) || !isNonEmptyString(item.name)) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    teacher: typeof item.teacher === 'string' ? item.teacher : '',
    color: typeof item.color === 'string' ? item.color : '#6c757d',
  };
}

/**
 * Returns a clean assignment object, or null if it's missing something essential.
 */
export function cleanAssignment(item) {
  const hasEssentials =
    item &&
    isNonEmptyString(item.id) &&
    isNonEmptyString(item.title) &&
    isNonEmptyString(item.classId) &&
    typeof item.dueDate === 'string' &&
    DATE_PATTERN.test(item.dueDate);

  if (!hasEssentials) {
    return null;
  }

  const steps = Array.isArray(item.subtasks) ? item.subtasks : [];

  return {
    ...item,
    type: ASSIGNMENT_TYPES[item.type] ? item.type : 'homework',
    priority: PRIORITIES.includes(item.priority) ? item.priority : 'medium',
    notes: typeof item.notes === 'string' ? item.notes : '',
    completed: item.completed === true,
    completedAt: typeof item.completedAt === 'string' ? item.completedAt : null,
    subtasks: steps
      .filter((step) => step && isNonEmptyString(step.id) && typeof step.title === 'string')
      .map((step) => ({ id: step.id, title: step.title, done: step.done === true })),
  };
}

/**
 * Cleans every item in a list and drops the ones that couldn't be repaired.
 */
export function cleanList(list, cleanItem) {
  return list.map(cleanItem).filter((item) => item !== null);
}