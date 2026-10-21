function ErrorState({ title = "We couldn't load this", error, onRetry, children }) {
  return (
    <div
      className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center gap-3"
      role="alert"
    >
      <div className="flex-grow-1">
        <p className="fw-bold mb-1">{title}</p>
        <p className="mb-0">{error ? error.message : 'Something went wrong. Please try again.'}</p>
      </div>
      <div className="d-flex gap-2 flex-shrink-0">
        {onRetry && (
          <button type="button" className="btn btn-danger" onClick={onRetry}>
            Try again
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default ErrorState;
