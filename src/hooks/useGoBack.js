import { useNavigate } from 'react-router-dom';

/**
 * Returns a goBack() function.
 * - If the student navigated here from another page in the app, it goes back.
 * - If they opened this page directly (bookmark, new tab), it goes to `fallbackPath`
 *   instead of leaving the app.
 */
export function useGoBack(fallbackPath = '/') {
  const navigate = useNavigate();

  function goBack() {
    const historyIndex = window.history.state ? window.history.state.idx : 0;

    if (historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }

  return goBack;
}