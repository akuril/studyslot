import { useCallback, useEffect, useState } from 'react';

/**
 * Loads data from the API and tracks loading / error / data for a component.
 *
 * `request` must be a function that takes an AbortSignal and returns a promise,
 * wrapped in useCallback so it only changes when its inputs change. Example:
 *
 *   const loadServices = useCallback(
 *     (signal) => getServices({ subject }, { signal }),
 *     [subject]
 *   );
 *   const { data, error, isLoading, retry } = useApiData(loadServices);
 *
 * When `request` changes (e.g. a filter changed), the old request is cancelled
 * so a slow, out-of-date response can never overwrite newer results.
 */
export function useApiData(request) {
  const [attempt, setAttempt] = useState(0);
  // Each result remembers WHICH request and attempt produced it.
  const [result, setResult] = useState({ request: null, attempt: -1, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    request(controller.signal).then(
      (data) => setResult({ request, attempt, data, error: null }),
      (error) => {
        // Cancelled because the inputs changed or the page closed: ignore it.
        if (controller.signal.aborted) {
          return;
        }
        setResult({ request, attempt, data: null, error });
      },
    );

    // Cleanup: cancel this request if the inputs change or the component unmounts.
    return () => controller.abort();
  }, [request, attempt]);

  // Still loading if the latest result belongs to an older request or attempt.
  const isCurrent = result.request === request && result.attempt === attempt;
  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    isLoading: !isCurrent,
    retry,
  };
}
