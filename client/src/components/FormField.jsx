/**
 * A labeled input with an error message underneath.
 * The error is linked to the input (aria-describedby) so screen readers read it out.
 */
function FormField({ id, label, error, hint, ...inputProps }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-semibold">
        {label}
      </label>
      <input
        id={id}
        className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && !error && (
        <div id={`${id}-hint`} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={`${id}-error`} className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
}

export default FormField;
