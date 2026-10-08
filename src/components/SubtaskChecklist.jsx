import { useState } from 'react';

const SUGGESTED_STEPS = [
  'Read the instructions and rubric',
  'Research and gather what you need',
  'Make a first draft',
  'Finish and check your work',
  'Turn it in',
];

const STEP_MAX = 80;

function SubtaskChecklist({ assignment, onAddSteps, onToggleStep, onDeleteStep, onMarkAssignmentDone }) {
  const [newStep, setNewStep] = useState('');
  const [error, setError] = useState('');

  const steps = assignment.subtasks || [];
  const doneCount = steps.filter((step) => step.done).length;
  const percent = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);
  const allStepsDone = steps.length > 0 && doneCount === steps.length;

  function handleSubmit(event) {
    event.preventDefault();
    const title = newStep.trim();

    if (title === '') {
      setError('Type a step first, like "Find 3 sources".');
      return;
    }

    if (title.length > STEP_MAX) {
      setError(`Keep steps short: ${STEP_MAX} characters or fewer.`);
      return;
    }

    onAddSteps([title]);
    setNewStep('');
    setError('');
  }

  return (
    <section className="card border-0 shadow-sm mt-4" aria-labelledby="steps-heading">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
          <h2 id="steps-heading" className="h5 fw-bold mb-0">
            ☑️ Steps
          </h2>
          {steps.length > 0 && (
            <span className="small text-secondary">
              {doneCount} of {steps.length} done
            </span>
          )}
        </div>

        {steps.length === 0 ? (
          <p className="small text-secondary mb-3">
            Big assignment? Break it into small steps and tick each one off as you go.
          </p>
        ) : (
          <div
            className="progress my-3"
            role="progressbar"
            aria-label="Steps progress"
            aria-valuenow={percent}
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ height: '8px' }}
          >
            <div
              className={`progress-bar ${allStepsDone ? 'bg-success' : ''}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        )}

        {/* The steps */}
        {steps.length > 0 && (
          <ul className="list-unstyled mb-3">
            {steps.map((step) => (
              <li key={step.id} className="d-flex align-items-center gap-2 border-bottom py-1">
                <label className="d-flex align-items-center gap-3 flex-grow-1 min-w-0 py-2 mb-0" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="form-check-input flex-shrink-0 m-0"
                    style={{ width: '1.35rem', height: '1.35rem', cursor: 'pointer' }}
                    checked={step.done}
                    onChange={() => onToggleStep(step.id)}
                  />
                  <span
                    className={`text-break ${
                      step.done ? 'text-decoration-line-through text-secondary' : ''
                    }`}
                  >
                    {step.title}
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger text-decoration-none flex-shrink-0"
                  onClick={() => onDeleteStep(step.id)}
                  aria-label={`Remove step: ${step.title}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* All steps finished → offer to complete the assignment */}
        {allStepsDone && !assignment.completed && (
          <div className="alert alert-success d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2" role="status">
            <span>🎉 Every step is done! Ready to mark the whole thing finished?</span>
            <button type="button" className="btn btn-success flex-shrink-0" onClick={onMarkAssignmentDone}>
              ✅ Mark as done
            </button>
          </div>
        )}

        {/* Add a step */}
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="new-step" className="visually-hidden">
            New step
          </label>
          <div className="input-group">
            <input
              id="new-step"
              type="text"
              className={`form-control ${error ? 'is-invalid' : ''}`}
              placeholder="Add a step, e.g. Find 3 sources"
              value={newStep}
              onChange={(event) => {
                setNewStep(event.target.value);
                setError('');
              }}
            />
            <button type="submit" className="btn btn-primary">
              + Add
            </button>
            {error && <div className="invalid-feedback">{error}</div>}
          </div>
        </form>

        {steps.length === 0 && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm mt-3"
            onClick={() => onAddSteps(SUGGESTED_STEPS)}
          >
            ✨ Add suggested steps
          </button>
        )}
      </div>
    </section>
  );
}

export default SubtaskChecklist;