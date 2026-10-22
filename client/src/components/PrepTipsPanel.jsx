import { useState } from 'react';
import { getSessionPrepTips } from '../api/ai';

/**
 * "AI prep tips" for one confirmed session. Nothing is requested until the button is
 * pressed (each request uses the account's shared AI allowance), and nothing is stored.
 */
function PrepTipsPanel({ bookingId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadTips() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      setResult(await getSessionPrepTips(bookingId));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card border-0 shadow-sm mt-4" aria-labelledby="prep-tips-title">
      <div className="card-body">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-2">
          <div>
            <h2 id="prep-tips-title" className="h5 fw-bold mb-0">
              ✨ Get ready for this session
            </h2>
            <p className="small text-secondary mb-0">
              AI tips on what to bring and review, based on the service and the notes.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary flex-shrink-0"
            onClick={loadTips}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                Thinking…
              </>
            ) : result ? (
              'Get new tips'
            ) : (
              'Get prep tips'
            )}
          </button>
        </div>

        <div aria-live="polite">
          {error && (
            <div
              className={`alert ${error.status === 429 ? 'alert-warning' : 'alert-danger'} mb-0 mt-2`}
              role="alert"
            >
              {error.message}
            </div>
          )}

          {result && (
            <div className="mt-3">
              <span
                className={`badge rounded-pill mb-2 ${result.source === 'ai' ? 'bg-primary-subtle text-primary-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'}`}
              >
                {result.source === 'ai' ? '✨ AI tips' : 'General tips (AI unavailable right now)'}
              </span>
              <ol className="mb-2 ps-3">
                {result.tips.map((tip) => (
                  <li key={tip} className="mb-1">
                    {tip}
                  </li>
                ))}
              </ol>
              <p className="small text-secondary mb-0">{result.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PrepTipsPanel;
