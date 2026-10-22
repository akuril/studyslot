import { useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SubjectArt from '../components/SubjectArt';
import Avatar from '../components/Avatar';
import { motifFor } from '../utils/serviceArt';
import { useApiData } from '../hooks/useApiData';
import { useGoBack } from '../hooks/useGoBack';
import { useAuth } from '../context/AuthContext';
import { isTutor } from '../utils/roles';
import { getService } from '../api/services';
import { formatGradeBand, formatPrice, getSubject } from '../utils/services';

function ServiceDetailsPage() {
  const { id } = useParams();
  const goBack = useGoBack('/services');
  const { user } = useAuth();

  const loadService = useCallback((signal) => getService(id, { signal }), [id]);
  const { data: service, error, isLoading, retry } = useApiData(loadService);

  // Show the service's name in the browser tab once it has loaded.
  useEffect(() => {
    if (service) {
      document.title = `${service.name} · StudySlot`;
    }
  }, [service]);

  const backButton = (
    <button type="button" className="btn btn-link px-0 mb-3" onClick={goBack}>
      ← Back to services
    </button>
  );

  if (isLoading) {
    return (
      <div>
        {backButton}
        <LoadingState label="Loading service…" />
      </div>
    );
  }

  // 400 (malformed id) and 404 (unknown or inactive) both mean "not found" to a visitor.
  if (error && (error.status === 404 || error.status === 400)) {
    return (
      <EmptyState
        icon="🤔"
        title="Service not found"
        message="This service doesn't exist or is no longer offered."
      >
        <Link to="/services" className="btn btn-primary">
          See all services
        </Link>
      </EmptyState>
    );
  }

  if (error) {
    return (
      <div>
        {backButton}
        <ErrorState title="We couldn't load this service" error={error} onRetry={retry} />
      </div>
    );
  }

  const subject = getSubject(service.subject);

  return (
    <div>
      {backButton}

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <SubjectArt
            subject={service.subject}
            motif={motifFor(service)}
            className="subject-art-banner rounded-4 shadow-sm mb-4"
          />
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis fs-6">
              <span aria-hidden="true">{subject.icon}</span> {subject.label}
            </span>
            <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis fs-6">
              {formatGradeBand(service.gradeBand)}
            </span>
          </div>
          <h1 className="h2 fw-bold">{service.name}</h1>
          <p className="lead">{service.summary}</p>
          <p className="service-description">{service.description}</p>
        </div>

        <div className="col-12 col-lg-4">
          <aside className="card border-0 shadow-sm" aria-label="Session details">
            <div className="card-body">
              <dl className="mb-3">
                <dt className="small text-secondary">Tutor</dt>
                <dd className="fw-semibold d-flex align-items-center gap-2">
                  <Avatar name={service.tutorName} size="md" />
                  {service.tutorName}
                </dd>
                <dt className="small text-secondary">Session length</dt>
                <dd className="fw-semibold">{service.durationMinutes} minutes</dd>
                <dt className="small text-secondary">Price per session</dt>
                <dd className="fw-semibold mb-0">{formatPrice(service.priceCents)}</dd>
              </dl>
              <p className="small text-secondary">
                Prices are for information. StudySlot doesn&apos;t take payments; you pay the tutor
                directly.
              </p>
              {user && isTutor(user) && (
                <p className="alert alert-info small mb-0">
                  You&apos;re logged in as a tutor. Parents book sessions from this page.
                </p>
              )}
              {user && !isTutor(user) && (
                <Link to={`/services/${service.id}/book`} className="btn btn-primary btn-lg w-100">
                  Book this service
                </Link>
              )}
              {!user && (
                <>
                  <Link
                    to="/login"
                    state={{ from: `/services/${service.id}/book` }}
                    className="btn btn-primary btn-lg w-100"
                  >
                    Log in to book
                  </Link>
                  <p className="small text-secondary text-center mt-2 mb-0">
                    New here?{' '}
                    <Link to="/register" state={{ from: `/services/${service.id}/book` }}>
                      Create a free account
                    </Link>
                  </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetailsPage;
