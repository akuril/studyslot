import { usePlanner } from '../context/PlannerContext';

function UndoToast() {
  const { lastDeleted, undoDelete, dismissUndo, undoSeconds } = usePlanner();

  return (
    <div
      className="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3 d-print-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {lastDeleted && (
        <div className="toast show text-bg-dark border-0 undo-toast">
          <div className="d-flex align-items-center gap-2 pe-2">
            <div className="toast-body flex-grow-1">🗑️ {lastDeleted.message}</div>
            <button type="button" className="btn btn-sm btn-warning fw-semibold" onClick={undoDelete}>
              ↩️ Undo
            </button>
            <button
              type="button"
              className="btn-close btn-close-white ms-1"
              aria-label="Dismiss"
              onClick={dismissUndo}
            ></button>
          </div>

          <div
            key={lastDeleted.id}
            className="undo-timer"
            style={{ animationDuration: `${undoSeconds}s` }}
            aria-hidden="true"
          ></div>
        </div>
      )}
    </div>
  );
}

export default UndoToast;