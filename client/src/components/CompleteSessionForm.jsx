import { useState } from 'react';
import { completeSession } from '../api/tutor';

export const SUMMARY_MAX = 500;

/**
 * Tutor-only: "Mark completed" with an optional short summary for the parent.
 * Calls onCompleted(updatedBooking) after the server confirms.
 */
function CompleteSessionForm({ booking, onCompleted, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fieldId = `summary-${booking.id}`;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      const updated = await completeSession(booking.id, summary.trim());
      onCompleted(updated);
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={`btn btn-success ${compact ? 'btn-sm' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        ✓ Mark completed
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-100">
      <label htmlFor={fieldId} className="form-label fw-semibold small mb-1">
        Summary for the parent <span className="fw-normal text-secondary">(optional)</span>
      </label>
      <textarea
        id={fieldId}
        className="form-control mb-1"
        rows={3}
        maxLength={SUMMARY_MAX}
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="e.g. Practiced adding fractions with unlike denominators. Next: word problems."
        aria-describedby={`${fieldId}-count`}
      />
      <div id={`${fieldId}-count`} className="form-text mt-0 mb-2">
        {summary.length}/{SUMMARY_MAX} characters
      </div>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-success btn-sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save and mark completed'}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setIsOpen(false)}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default CompleteSessionForm;
