function EmptyState({ icon, title, message, children }) {
  return (
    <div className="text-center bg-body border rounded-3 py-5 px-3">
      <p className="display-4 mb-2" aria-hidden="true">
        {icon}
      </p>
      <h2 className="h4 fw-bold">{title}</h2>
      {message && <p className="text-secondary mb-4">{message}</p>}
      {children}
    </div>
  );
}

export default EmptyState;
