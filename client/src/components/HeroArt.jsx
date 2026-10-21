/*
  HeroArt: the large picture on the home page.
  A weekly calendar with a booked session, surrounded by subject bubbles.
  Colors that should change with light/dark mode use Bootstrap's CSS variables.
  Decorative only (the heading next to it says the same thing), so aria-hidden.
*/

const BUBBLES = [
  { x: 92, y: 96, r: 30, from: '#4f7cff', to: '#6a4cff', label: 'π', size: 30 },
  { x: 398, y: 92, r: 30, from: '#f97316', to: '#f43f5e', label: 'Aa', size: 22 },
  { x: 76, y: 222, r: 28, from: '#06b6d4', to: '#14b8a6', label: 'H₂O', size: 15 },
  { x: 414, y: 218, r: 28, from: '#334155', to: '#4f46e5', label: '</>', size: 16 },
  { x: 240, y: 300, r: 22, from: '#a855f7', to: '#ec4899', label: 'Hola', size: 12 },
];

// 5 days x 3 time rows. One slot is booked (green), one is picked (blue).
const DAYS = ['M', 'T', 'W', 'T', 'F'];
const BOOKED = { col: 1, row: 1 };
const PICKED = { col: 3, row: 0 };

function HeroArt({ className = '' }) {
  return (
    <svg
      className={`hero-art ${className}`}
      viewBox="0 0 480 330"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {BUBBLES.map((bubble, index) => (
          <linearGradient key={bubble.label} id={`hero-bubble-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={bubble.from} />
            <stop offset="1" stopColor={bubble.to} />
          </linearGradient>
        ))}
      </defs>

      <circle cx="240" cy="165" r="150" style={{ fill: 'var(--bs-primary-bg-subtle)' }} />

      {/* Calendar card with a soft shadow */}
      <rect x="136" y="78" width="220" height="196" rx="18" fill="#000000" opacity="0.08" />
      <rect x="130" y="70" width="220" height="196" rx="18" style={{ fill: 'var(--bs-body-bg)' }} />
      <path d="M130 88 a18 18 0 0 1 18 -18 h184 a18 18 0 0 1 18 18 v28 h-220 z" fill="#4f46e5" />
      <rect x="170" y="58" width="10" height="24" rx="5" fill="#312e81" />
      <rect x="300" y="58" width="10" height="24" rx="5" fill="#312e81" />
      <text
        x="240"
        y="100"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#ffffff"
        fontFamily="system-ui, sans-serif"
      >
        This week
      </text>

      {DAYS.map((day, col) => (
        <text
          key={`${day}-${col}`}
          x={160 + col * 40}
          y="138"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          style={{ fill: 'var(--bs-secondary-color)' }}
        >
          {day}
        </text>
      ))}

      {[0, 1, 2].map((row) =>
        DAYS.map((day, col) => {
          const x = 145 + col * 40;
          const y = 150 + row * 36;
          const isBooked = col === BOOKED.col && row === BOOKED.row;
          const isPicked = col === PICKED.col && row === PICKED.row;
          let fill = 'var(--bs-secondary-bg)';
          if (isBooked) fill = '#22c55e';
          if (isPicked) fill = '#a5b4fc';
          return (
            <g key={`${row}-${col}`}>
              <rect x={x} y={y} width="30" height="28" rx="7" style={{ fill }} />
              {isBooked && (
                <path
                  d={`M${x + 8} ${y + 14} l5 5 l10 -11`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        }),
      )}

      {/* Floating subject bubbles */}
      {BUBBLES.map((bubble, index) => (
        <g key={bubble.label}>
          <circle cx={bubble.x} cy={bubble.y} r={bubble.r} fill={`url(#hero-bubble-${index})`} />
          <text
            x={bubble.x}
            y={bubble.y + bubble.size * 0.35}
            textAnchor="middle"
            fontSize={bubble.size}
            fontWeight="700"
            fill="#ffffff"
            fontFamily="system-ui, sans-serif"
          >
            {bubble.label}
          </text>
        </g>
      ))}

      {/* Sparkles */}
      <path
        d="M380 30 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z"
        fill="#fbbf24"
      />
      <path d="M110 292 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#fbbf24" />
    </svg>
  );
}

export default HeroArt;
