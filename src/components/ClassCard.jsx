import { Link } from 'react-router-dom';

function ClassCard({ classItem, progress, onEdit, onDelete }) {
  const { id, name, teacher, color } = classItem;

  return (
    <div
      className="card h-100 border-0 shadow-sm class-card"
      style={{ borderLeft: `6px solid ${color}` }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span
            className="rounded-circle flex-shrink-0"
            style={{ width: '14px', height: '14px', backgroundColor: color }}
            aria-hidden="true"
          ></span>
          <h2 className="h5 fw-bold mb-0 text-truncate">
            <Link
              to={`/classes/${id}`}
              className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover"
            >
              {name}
            </Link>
          </h2>
        </div>

        <p className="text-secondary mb-3">
          {teacher ? `👩‍🏫 ${teacher}` : 'No teacher added'}
        </p>

        {progress.total === 0 ? (
          <p className="small text-secondary mb-0">No assignments yet</p>
        ) : (
          <>
            <p className="small text-secondary mb-1">
              {progress.remaining} to do · {progress.done} done
            </p>
            <div
              className="progress"
              role="progressbar"
              aria-label={`${name} progress`}
              aria-valuenow={progress.percent}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{ height: '6px' }}
            >
              <div
                className="progress-bar"
                style={{ width: `${progress.percent}%`, backgroundColor: color }}
              ></div>
            </div>
          </>
        )}
      </div>

      <div className="card-footer bg-body border-0 pt-0 pb-3 d-flex gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary flex-fill"
          onClick={() => onEdit(classItem)}
          aria-label={`Edit ${name}`}
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          className="btn btn-outline-danger flex-fill"
          onClick={() => onDelete(classItem)}
          aria-label={`Delete ${name}`}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

export default ClassCard;