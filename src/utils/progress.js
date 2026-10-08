/**
 * Progress for any list of assignments.
 * Returns { total, done, remaining, percent }.
 */
export function getProgress(assignmentList) {
  const total = assignmentList.length;
  const done = assignmentList.filter((assignment) => assignment.completed).length;
  const remaining = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, done, remaining, percent };
}