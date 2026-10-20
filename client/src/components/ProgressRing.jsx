function ProgressRing({ percent, label, size = 140, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const center = size / 2;
  const ringColor = percent === 100 ? 'var(--bs-success)' : 'var(--bs-primary)';

  return (
    <div
      className="position-relative flex-shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
      role="img"
      aria-label={`${percent}% done${label ? `, ${label}` : ''}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Gray track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: 'var(--bs-secondary-bg)' }}
        />
        {/* Colored progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ stroke: ringColor, transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>

      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
        aria-hidden="true"
      >
        <span className="fs-3 fw-bold lh-1">{percent}%</span>
        {label && <span className="small text-secondary mt-1">{label}</span>}
      </div>
    </div>
  );
}

export default ProgressRing;