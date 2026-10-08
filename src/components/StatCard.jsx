import { Link } from 'react-router-dom';

function StatCard({ icon, label, value, tone, message, to }) {
  const content = (
    <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center gap-2 gap-sm-3">
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-${tone}-subtle`}
        style={{ width: '52px', height: '52px', fontSize: '1.5rem' }}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="small text-secondary fw-semibold mb-0">{label}</p>
        <p className="h3 fw-bold mb-0">{value}</p>
        {message && <p className="small text-secondary mb-0">{message}</p>}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="card border-0 shadow-sm h-100 text-body text-decoration-none stat-card-link">
        {content}
      </Link>
    );
  }

  return <div className="card border-0 shadow-sm h-100">{content}</div>;
}

export default StatCard;