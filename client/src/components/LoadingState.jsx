import { useEffect, useState } from 'react';

// After this long, explain the delay (the free server may be waking up).
const SLOW_AFTER_MS = 5000;

function LoadingState({ label = 'Loading…' }) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timerId);
  }, []);

  return (
    <div className="text-center py-5" role="status" aria-live="polite">
      <div className="spinner-border text-primary mb-3" aria-hidden="true"></div>
      <p className="fw-semibold mb-1">{label}</p>
      {isSlow && (
        <p className="text-secondary small mb-0">
          Still working… the StudySlot server may be waking up. This can take up to a minute the
          first time.
        </p>
      )}
    </div>
  );
}

export default LoadingState;
