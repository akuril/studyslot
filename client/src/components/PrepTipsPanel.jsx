import { useEffect, useState } from 'react';
import { getSessionPrepTips } from '../api/ai';

/**
 * Prep tips for one confirmed session: what to bring and review. The tips are built in
 * (they depend only on the subject), so they load automatically and no AI is used.
 */
function PrepTipsPanel({ bookingId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    getSessionPrepTips(bookingId)
      .then((data) => {
        if (isCurrent) setResult(data);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError);
      });
    return () => {
      isCurrent = false;
    };
  }, [bookingId]);

  return (
    <section className="card border-0 shadow-sm mt-4" aria-labelledby="prep-tips-title">
      <div className="card-body">
        <h2 id="prep-tips-title" className="h5 fw-bold mb-1">
          Get ready for this session
        </h2>
        <p className="small text-secondary mb-2">What to bring and review before you start.</p>

        <div aria-live="polite">
          {!result && !error && (
            <p className="small text-secondary mb-0">
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              Loading tips…
            </p>
          )}

          {error && (
            <div className="alert alert-danger mb-0 mt-2" role="alert">
              {error.message}
            </div>
          )}

          {result && (
            <>
              <ol className="mb-2 ps-3">
                {result.tips.map((tip) => (
                  <li key={tip} className="mb-1">
                    {tip}
                  </li>
                ))}
              </ol>
              <p className="small text-secondary mb-0">{result.disclaimer}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default PrepTipsPanel;
