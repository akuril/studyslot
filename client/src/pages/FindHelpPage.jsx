import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SubjectArt from '../components/SubjectArt';
import { motifFor } from '../utils/serviceArt';
import { recommendService } from '../api/ai';
import { GRADES, formatGradeBand, getSubject } from '../utils/services';

export const NEED_MAX = 500;

const EXAMPLES = [
  'My 7th grader is struggling with fractions and has a test on Friday.',
  'My daughter wants to get better at writing essays for high school English.',
  'He feels overwhelmed and needs help organizing homework and studying.',
];

// "AI suggestions" page (logged-in only). The AI only SUGGESTS services;
// parents open a real service page and book there.
function FindHelpPage() {
  const [need, setNeed] = useState('');
  const [grade, setGrade] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestError, setRequestError] = useState(null);
  const [result, setResult] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const resultsRef = useRef(null);

  const trimmedNeed = need.trim();

  async function getSuggestions() {
    // Ignore double clicks while a request is running.
    if (isThinking) return;

    if (trimmedNeed === '') {
      setFieldErrors({ need: 'Describe what your student needs help with.' });
      return;
    }

    setIsThinking(true);
    setFieldErrors({});
    setRequestError(null);
    setResult(null);

    try {
      const data = await recommendService({ need: trimmedNeed, grade });
      setResult(data);
      // Move keyboard and screen-reader focus to the results.
      requestAnimationFrame(() => resultsRef.current?.focus());
    } catch (error) {
      if (error.status === 400 && error.details.length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        setRequestError(error);
      }
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    getSuggestions();
  }

  const isRateLimited = requestError && requestError.status === 429;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-xl-10">
        <PageHeader
          title="Find the right help"
          subtitle="Describe what your student needs, and our AI assistant will suggest tutoring services that fit."
        />

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <form className="card border-0 shadow-sm" onSubmit={handleSubmit} noValidate>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label htmlFor="find-help-need" className="form-label fw-semibold">
                    What does your student need help with?
                  </label>
                  <textarea
                    id="find-help-need"
                    className={`form-control ${fieldErrors.need ? 'is-invalid' : ''}`}
                    rows={5}
                    maxLength={NEED_MAX}
                    value={need}
                    onChange={(event) => setNeed(event.target.value)}
                    aria-invalid={fieldErrors.need ? 'true' : undefined}
                    aria-describedby="find-help-need-hint find-help-need-count"
                    placeholder="e.g. My 7th grader is struggling with fractions and has a test on Friday."
                    required
                  />
                  {fieldErrors.need && <div className="invalid-feedback">{fieldErrors.need}</div>}
                  <div className="d-flex justify-content-between gap-2 form-text">
                    <span id="find-help-need-hint">
                      Describe the subject and the goal. Please don&apos;t include names or personal
                      details.
                    </span>
                    <span id="find-help-need-count" className="text-nowrap">
                      {need.length}/{NEED_MAX}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="find-help-grade" className="form-label fw-semibold">
                    Student&apos;s grade{' '}
                    <span className="fw-normal text-secondary">
                      (optional, gives better matches)
                    </span>
                  </label>
                  <select
                    id="find-help-grade"
                    className={`form-select ${fieldErrors.grade ? 'is-invalid' : ''}`}
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                  >
                    <option value="">Any grade</option>
                    {GRADES.map((value) => (
                      <option key={value} value={value}>
                        Grade {value}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.grade && <div className="invalid-feedback">{fieldErrors.grade}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={isThinking}
                >
                  {isThinking ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      ></span>
                      Thinking…
                    </>
                  ) : (
                    '✨ Get suggestions'
                  )}
                </button>

                <div className="mt-4">
                  <p className="small fw-semibold text-secondary mb-2">Try an example:</p>
                  <div className="d-flex flex-column gap-2">
                    {EXAMPLES.map((example) => (
                      <button
                        type="button"
                        key={example}
                        className="btn btn-sm btn-outline-secondary text-start"
                        onClick={() => {
                          setNeed(example);
                          setFieldErrors({});
                        }}
                        disabled={isThinking}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="col-12 col-lg-7">
            <section
              ref={resultsRef}
              tabIndex={-1}
              aria-live="polite"
              aria-busy={isThinking}
              aria-label="Suggestions"
              className="find-help-results"
            >
              {isThinking && (
                <div className="text-center py-5" role="status">
                  <div className="spinner-border text-primary mb-3" aria-hidden="true"></div>
                  <p className="fw-semibold mb-0">Finding services that fit…</p>
                </div>
              )}

              {isRateLimited && (
                <div className="alert alert-warning" role="alert">
                  <p className="fw-bold mb-1">{requestError.message}</p>
                  <p className="mb-0">
                    You can ask for up to 5 suggestions a minute and 20 a day. In the meantime,{' '}
                    <Link to="/services">browse all services</Link>.
                  </p>
                </div>
              )}

              {requestError && !isRateLimited && (
                <div
                  className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center gap-3"
                  role="alert"
                >
                  <div className="flex-grow-1">
                    <p className="fw-bold mb-1">We couldn&apos;t get suggestions</p>
                    <p className="mb-0">{requestError.message}</p>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={getSuggestions}>
                    Try again
                  </button>
                </div>
              )}

              {!isThinking && !requestError && !result && (
                <div className="text-center bg-body border rounded-3 py-5 px-3 h-100">
                  <p className="display-4 mb-2" aria-hidden="true">
                    ✨
                  </p>
                  <h2 className="h5 fw-bold">Suggestions will appear here</h2>
                  <p className="text-secondary mb-0">
                    Tell us what your student is working on, then press &quot;Get suggestions&quot;.
                  </p>
                </div>
              )}

              {result && <SuggestionResults result={result} />}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionResults({ result }) {
  const hasMatches = result.recommendations.length > 0;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h2 className="h5 fw-bold mb-0">Suggested services</h2>
        {result.source === 'ai' ? (
          <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
            ✨ AI suggestion
          </span>
        ) : (
          <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">
            Basic keyword match
          </span>
        )}
      </div>

      <p className="lead fs-6">{result.summary}</p>

      {hasMatches ? (
        <div className="d-flex flex-column gap-3 mb-3">
          {result.recommendations.map((item) => {
            const subject = getSubject(item.subject);
            return (
              <article
                key={item.serviceId}
                className="card border-0 shadow-sm overflow-hidden suggestion-card"
              >
                <div className="row g-0">
                  <div className="col-12 col-sm-4">
                    <SubjectArt
                      subject={item.subject}
                      motif={motifFor(item)}
                      className="suggestion-art"
                    />
                  </div>
                  <div className="col-12 col-sm-8">
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
                          <span aria-hidden="true">{subject.icon}</span> {subject.label}
                        </span>
                        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">
                          {formatGradeBand(item.gradeBand)}
                        </span>
                      </div>
                      <h3 className="h6 fw-bold mb-1">{item.name}</h3>
                      <p className="text-secondary small mb-3">{item.reason}</p>
                      <Link to={`/services/${item.serviceId}`} className="btn btn-sm btn-primary">
                        View service
                        <span className="visually-hidden">: {item.name}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center bg-body border rounded-3 py-4 px-3 mb-3">
          <p className="mb-3">We couldn&apos;t find a clear match for that description.</p>
          <Link to="/services" className="btn btn-primary">
            Browse all services
          </Link>
        </div>
      )}

      <p className="small text-secondary mb-0">{result.disclaimer}</p>
    </div>
  );
}

export default FindHelpPage;
