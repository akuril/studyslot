import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ServiceCard from '../components/ServiceCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApiData } from '../hooks/useApiData';
import { getServices } from '../api/services';
import { GRADES, SUBJECTS, isValidGrade, isValidSubject } from '../utils/services';

function ServicesPage() {
  // Filters live in the URL (?subject=math&grade=7), so refreshing the page,
  // using Back, or sharing the link keeps the same results.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSubject = searchParams.get('subject') || '';
  const rawGrade = searchParams.get('grade') || '';
  // Ignore hand-typed values the API would reject, instead of showing an error.
  const subject = isValidSubject(rawSubject) ? rawSubject : '';
  const grade = isValidGrade(rawGrade) ? rawGrade : '';
  const hasFilters = subject !== '' || grade !== '';

  const loadServices = useCallback(
    (signal) => getServices({ subject, grade }, { signal }),
    [subject, grade],
  );
  const { data: services, error, isLoading, retry } = useApiData(loadServices);

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  return (
    <div>
      <PageHeader
        title="Tutoring services"
        subtitle="One-on-one help for students in grades 6–12. Pick a service to see details."
      />

      <form
        className="card border-0 shadow-sm mb-4"
        role="search"
        aria-label="Filter services"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="card-body row g-3 align-items-end">
          <div className="col-12 col-sm-6 col-lg-4">
            <label htmlFor="filter-subject" className="form-label fw-semibold">
              Subject
            </label>
            <select
              id="filter-subject"
              className="form-select"
              value={subject}
              onChange={(event) => updateFilter('subject', event.target.value)}
            >
              <option value="">All subjects</option>
              {SUBJECTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <label htmlFor="filter-grade" className="form-label fw-semibold">
              Student&apos;s grade
            </label>
            <select
              id="filter-grade"
              className="form-select"
              value={grade}
              onChange={(event) => updateFilter('grade', event.target.value)}
            >
              <option value="">Any grade</option>
              {GRADES.map((gradeOption) => (
                <option key={gradeOption} value={gradeOption}>
                  Grade {gradeOption}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <div className="col-12 col-lg-4">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </form>

      {isLoading && <LoadingState label="Loading services…" />}

      {error && <ErrorState title="We couldn't load services" error={error} onRetry={retry} />}

      {services && services.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No services match"
          message="Try a different subject or grade, or clear the filters to see everything."
        >
          <button type="button" className="btn btn-primary" onClick={clearFilters}>
            Clear filters
          </button>
        </EmptyState>
      )}

      {services && services.length > 0 && (
        <>
          <p className="text-secondary" aria-live="polite">
            {services.length} {services.length === 1 ? 'service' : 'services'}
            {hasFilters ? ' match your filters' : ' available'}
          </p>
          <div className="row g-3">
            {services.map((service) => (
              <div className="col-12 col-md-6 col-xl-4" key={service.id}>
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ServicesPage;
