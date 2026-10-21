import { Link } from 'react-router-dom';
import { formatGradeBand, formatPrice, getSubject } from '../utils/services';

function ServiceCard({ service }) {
  const subject = getSubject(service.subject);

  return (
    <article className="card border-0 shadow-sm h-100 service-card">
      <div className="card-body d-flex flex-column">
        <div className="d-flex flex-wrap gap-2 mb-2">
          <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
            <span aria-hidden="true">{subject.icon}</span> {subject.label}
          </span>
          <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">
            {formatGradeBand(service.gradeBand)}
          </span>
        </div>

        <h2 className="h5 fw-bold mb-2">
          {/* stretched-link makes the whole card clickable for mouse users,
              while keyboard and screen-reader users get one clear link. */}
          <Link
            to={`/services/${service.id}`}
            className="stretched-link text-body text-decoration-none"
          >
            {service.name}
          </Link>
        </h2>
        <p className="text-secondary flex-grow-1">{service.summary}</p>

        <div className="d-flex justify-content-between align-items-center small border-top pt-2">
          <span className="text-secondary">
            {service.tutorName} · {service.durationMinutes} min
          </span>
          <span className="fw-bold">{formatPrice(service.priceCents)}</span>
        </div>
      </div>
    </article>
  );
}

export default ServiceCard;
