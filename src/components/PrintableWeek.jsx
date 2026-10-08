import { ASSIGNMENT_TYPES, getAssignmentStatus, sortAssignments } from '../utils/assignments';
import { parseDateString } from '../utils/dates';

function PrintableWeek({ weekDays, weekAssignments, weekRange, getClassById }) {
  return (
    <div className="d-none d-print-block">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end border-bottom border-dark pb-2 mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0">📚 Weekly Planner</h1>
          <p className="mb-0">{weekRange}</p>
        </div>
        <p className="mb-0">Name: ______________________________</p>
      </div>

      {/* The week */}
      <table className="table table-bordered table-sm print-table">
        <thead>
          <tr>
            <th scope="col" style={{ width: '14%' }}>Day</th>
            <th scope="col">Assignment</th>
            <th scope="col" style={{ width: '18%' }}>Class</th>
            <th scope="col" style={{ width: '12%' }}>Type</th>
            <th scope="col" className="text-center" style={{ width: '7%' }}>Done</th>
            <th scope="col" className="text-center" style={{ width: '12%' }}>Parent initials</th>
          </tr>
        </thead>

        <tbody>
          {weekDays.map((dateString) => {
            const dayAssignments = sortAssignments(
              weekAssignments.filter((assignment) => assignment.dueDate === dateString),
              'priority'
            );

            const date = parseDateString(dateString);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const monthAndDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Each day needs at least one row, even if nothing is due.
            const rowCount = Math.max(dayAssignments.length, 1);

            const dayCell = (
              <th scope="row" rowSpan={rowCount}>
                <div className="fw-bold">{dayName}</div>
                <div className="small">{monthAndDay}</div>
              </th>
            );

            const initialsCell = <td rowSpan={rowCount}></td>;

            // A day with nothing due: one row that says so.
            if (dayAssignments.length === 0) {
              return (
                <tr key={dateString}>
                  {dayCell}
                  <td colSpan={4} className="text-secondary fst-italic">
                    Nothing due
                  </td>
                  {initialsCell}
                </tr>
              );
            }

            // A day with assignments: one row per assignment.
            return dayAssignments.map((assignment, index) => {
              const classItem = getClassById(assignment.classId);
              const typeInfo = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.homework;
              const isOverdue = getAssignmentStatus(assignment) === 'overdue';
              const isFirstRowOfDay = index === 0;

              return (
                <tr key={assignment.id}>
                  {isFirstRowOfDay && dayCell}

                  <td>
                    <div className="fw-semibold">
                      {assignment.title}
                      {isOverdue && <span className="fw-normal"> (late)</span>}
                    </div>
                    {assignment.notes && <div className="small">{assignment.notes}</div>}
                  </td>

                  <td>
                    <span
                      className="d-inline-block rounded-circle me-1 align-middle"
                      style={{
                        width: '9px',
                        height: '9px',
                        backgroundColor: classItem ? classItem.color : '#adb5bd',
                      }}
                    ></span>
                    {classItem ? classItem.name : 'Unknown class'}
                  </td>

                  <td>{typeInfo.label}</td>

                  <td className="text-center fs-5 lh-1">{assignment.completed ? '☑' : '☐'}</td>

                  {isFirstRowOfDay && initialsCell}
                </tr>
              );
            });
          })}
        </tbody>
      </table>

      {/* Sign-off */}
      <div className="d-flex justify-content-between gap-4 mt-4">
        <p className="mb-0">Parent/guardian signature: ______________________________</p>
        <p className="mb-0">Date: ______________</p>
      </div>
      <p className="small text-secondary mt-3 mb-0">Printed from HomeworkHQ</p>
    </div>
  );
}

export default PrintableWeek;