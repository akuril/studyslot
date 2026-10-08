import { Link } from 'react-router-dom';
import { ASSIGNMENT_TYPES } from '../utils/assignments';
import { daysUntil, formatDueDate } from '../utils/dates';

function getCountdown(days) {
  if (days === 0) {
    return { bigText: 'Today', smallText: '', tone: 'danger' };
  }
  if (days === 1) {
    return { bigText: '1', smallText: 'day left', tone: 'warning' };
  }
  return {
    bigText: String(days),
    smallText: 'days left',
    tone: days <= 3 ? 'warning' : 'primary',
  };
}

function TestCountdown({ assignment, classItem }) {
  const days = daysUntil(assignment.dueDate);
  const countdown = getCountdown(days);
  const typeInfo = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.test;
  const className = classItem ? classItem.name : 'Unknown class';

  return (
    <li className="list-group-item d-flex align-items-center gap-3 py-3">
      <div
        className={`text-center rounded-3 flex-shrink-0 bg-${countdown.tone}-subtle text-${countdown.tone}-emphasis`}
        style={{ width: '68px', padding: '0.4rem 0' }}
      >
        <div className="fw-bold fs-5 lh-1">{countdown.bigText}</div>
        {countdown.smallText && <div className="small">{countdown.smallText}</div>}
      </div>

      <div className="min-w-0">
        <p className="fw-semibold mb-0 text-truncate">
          <Link
            to={`/assignments/${assignment.id}`}
            className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover"
          >
            <span aria-hidden="true">{typeInfo.icon}</span> {assignment.title}
          </Link>
        </p>
        <p className="small text-secondary mb-0">
          {className} · {formatDueDate(assignment.dueDate)}
        </p>
      </div>
    </li>
  );
}

export default TestCountdown;