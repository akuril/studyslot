function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <div>
        <h1 className="h2 fw-bold mb-1">{title}</h1>
        {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
      </div>

      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export default PageHeader;
