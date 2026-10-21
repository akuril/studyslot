import { useId } from 'react';

/*
  SubjectArt draws a colorful picture for each tutoring subject.

  The pictures are inline SVG (shapes described in code) instead of photo files:
  - nothing to download, so they load instantly and work offline
  - they stay sharp at any size, on any screen
  - they are original drawings, so there are no image licenses to worry about

  They are decorative (the subject name is always written next to them),
  so screen readers skip them (aria-hidden).
*/

const PALETTES = {
  math: { from: '#4f7cff', to: '#6a4cff', accent: '#4f46e5', soft: '#c7d2fe' },
  science: { from: '#06b6d4', to: '#14b8a6', accent: '#0d9488', soft: '#99f6e4' },
  english: { from: '#f97316', to: '#f43f5e', accent: '#ea580c', soft: '#fdba74' },
  'social-studies': { from: '#0ea5e9', to: '#2563eb', accent: '#16a34a', soft: '#dbeafe' },
  'world-languages': { from: '#a855f7', to: '#ec4899', accent: '#9333ea', soft: '#fdf4ff' },
  'computer-science': { from: '#334155', to: '#4f46e5', accent: '#a5b4fc', soft: '#0f172a' },
  'study-skills': { from: '#eab308', to: '#f59e0b', accent: '#f59e0b', soft: '#fcd34d' },
  'test-prep': { from: '#ef4444', to: '#b91c1c', accent: '#ef4444', soft: '#fca5a5' },
  'homework-help': { from: '#84cc16', to: '#16a34a', accent: '#3f6212', soft: '#bef264' },
  default: { from: '#64748b', to: '#475569', accent: '#334155', soft: '#e2e8f0' },
};

const symbolText = {
  fill: '#ffffff',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontWeight: 700,
};

const codeText = {
  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  fontWeight: 700,
};

function Pencil({ transform }) {
  return (
    <g transform={transform}>
      <rect x="-7" y="-36" width="14" height="8" rx="2" fill="#fda4af" />
      <rect x="-7" y="-28" width="14" height="56" fill="#fde047" />
      <rect x="-2" y="-28" width="4" height="56" fill="#facc15" />
      <polygon points="-7,28 7,28 0,44" fill="#fef3c7" />
      <polygon points="-2,39 2,39 0,44" fill="#1f2937" />
    </g>
  );
}

function MathArt({ p }) {
  return (
    <g>
      <rect x="105" y="35" width="110" height="90" rx="10" fill="#ffffff" />
      <path d="M118 112 H204 M126 44 V118" stroke={p.soft} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M126 106 C150 106 160 58 202 50"
        stroke={p.accent}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="202" cy="50" r="5" fill={p.accent} />
      <text x="60" y="66" fontSize="36" style={symbolText}>
        π
      </text>
      <text x="246" y="62" fontSize="34" style={symbolText}>
        +
      </text>
      <text x="252" y="128" fontSize="32" style={symbolText}>
        ÷
      </text>
      <text x="44" y="130" fontSize="28" style={symbolText}>
        x²
      </text>
    </g>
  );
}

function ScienceArt({ p }) {
  return (
    <g>
      <g transform="translate(70 82)" fill="none" stroke="#ffffff" strokeWidth="2.5">
        <ellipse rx="32" ry="11" />
        <ellipse rx="32" ry="11" transform="rotate(60)" />
        <ellipse rx="32" ry="11" transform="rotate(120)" />
        <circle r="6" fill="#ffffff" stroke="none" />
      </g>
      <path
        d="M148 34 H172 V70 L202 116 A8 8 0 0 1 195 128 H125 A8 8 0 0 1 118 116 L148 70 Z"
        fill="#ffffff"
      />
      <path
        d="M128.4 100 H191.6 L202 116 A8 8 0 0 1 195 128 H125 A8 8 0 0 1 118 116 Z"
        fill={p.accent}
      />
      <rect x="142" y="28" width="36" height="9" rx="4" fill="#ffffff" />
      <circle cx="150" cy="114" r="4" fill="#ffffff" opacity="0.7" />
      <circle cx="168" cy="108" r="3" fill="#ffffff" opacity="0.7" />
      <circle cx="182" cy="117" r="5" fill="#ffffff" opacity="0.7" />
      <circle cx="184" cy="20" r="5" fill="#ffffff" opacity="0.6" />
      <circle cx="198" cy="10" r="3" fill="#ffffff" opacity="0.6" />
      <text x="236" y="112" fontSize="26" style={symbolText}>
        H₂O
      </text>
    </g>
  );
}

function EnglishArt({ p }) {
  return (
    <g>
      <path
        d="M88 52 V130 C114 122 140 122 160 132 C180 122 206 122 232 130 V52 Z"
        fill="#000000"
        opacity="0.12"
      />
      <path d="M160 50 C140 40 115 40 95 46 V120 C115 114 140 114 160 124 Z" fill="#ffffff" />
      <path d="M160 50 C180 40 205 40 225 46 V120 C205 114 180 114 160 124 Z" fill="#fff7ed" />
      <g stroke={p.soft} strokeWidth="3" strokeLinecap="round">
        <path d="M108 62 H146 M108 74 H146 M108 86 H146 M108 98 H134" />
        <path d="M174 62 H212 M174 74 H212 M174 86 H212 M174 98 H200" />
      </g>
      <Pencil transform="translate(268 82) rotate(30)" />
      <text x="34" y="74" fontSize="30" style={symbolText}>
        Aa
      </text>
      <text x="46" y="148" fontSize="54" style={symbolText}>
        “
      </text>
    </g>
  );
}

function SocialStudiesArt({ p, uid }) {
  const clipId = `${uid}-globe`;
  return (
    <g>
      <clipPath id={clipId}>
        <circle cx="160" cy="80" r="44" />
      </clipPath>
      <circle cx="160" cy="80" r="44" fill={p.soft} />
      <g clipPath={`url(#${clipId})`} fill={p.accent}>
        <path d="M130 58 c8 -10 24 -8 28 2 c4 10 -6 14 -4 22 c2 8 -8 14 -16 8 c-8 -6 -16 -22 -8 -32 z" />
        <path d="M170 92 c10 -6 22 0 22 10 c0 10 -10 18 -20 14 c-8 -4 -10 -18 -2 -24 z" />
        <path d="M172 48 c6 -4 16 -2 18 4 c-6 4 -14 6 -18 -4 z" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7">
        <ellipse cx="160" cy="80" rx="18" ry="44" />
        <path d="M116 80 H204" />
      </g>
      <circle cx="160" cy="80" r="44" fill="none" stroke="#ffffff" strokeWidth="3" />
      <path d="M128 132 H192 M160 124 V132" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M256 38 c-12 0 -20 9 -20 20 c0 15 20 34 20 34 s20 -19 20 -34 c0 -11 -8 -20 -20 -20 z"
        fill="#f43f5e"
      />
      <circle cx="256" cy="58" r="7" fill="#ffffff" />
      <g transform="translate(64 96)">
        <circle r="22" fill="none" stroke="#ffffff" strokeWidth="3" />
        <polygon points="0,-16 5,0 -5,0" fill="#f43f5e" />
        <polygon points="0,16 5,0 -5,0" fill="#ffffff" />
      </g>
    </g>
  );
}

function WorldLanguagesArt({ p }) {
  return (
    <g>
      <rect x="66" y="34" width="116" height="50" rx="16" fill="#ffffff" />
      <polygon points="92,84 86,104 114,84" fill="#ffffff" />
      <text
        x="124"
        y="67"
        fontSize="22"
        textAnchor="middle"
        fill={p.accent}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        ¡Hola!
      </text>
      <rect x="142" y="84" width="116" height="50" rx="16" fill={p.soft} />
      <polygon points="228,134 238,150 210,134" fill={p.soft} />
      <text
        x="200"
        y="116"
        fontSize="20"
        textAnchor="middle"
        fill="#db2777"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        Bonjour
      </text>
      <text x="30" y="134" fontSize="18" fill="#ffffff" opacity="0.85" fontWeight="700">
        Ciao
      </text>
      <text x="252" y="54" fontSize="18" fill="#ffffff" opacity="0.85" fontWeight="700">
        Hallo
      </text>
    </g>
  );
}

function ComputerScienceArt({ p }) {
  return (
    <g>
      <rect x="100" y="34" width="120" height="78" rx="6" fill={p.soft} stroke="#ffffff" strokeWidth="4" />
      <rect x="112" y="48" width="30" height="5" rx="2.5" fill="#f472b6" />
      <rect x="146" y="48" width="20" height="5" rx="2.5" fill="#60a5fa" />
      <text x="160" y="88" fontSize="28" textAnchor="middle" fill={p.accent} style={codeText}>
        &lt;/&gt;
      </text>
      <rect x="112" y="98" width="44" height="5" rx="2.5" fill="#34d399" />
      <rect x="160" y="98" width="24" height="5" rx="2.5" fill="#fbbf24" />
      <path d="M84 116 H236 L226 128 H94 Z" fill="#ffffff" />
      <text x="40" y="92" fontSize="30" fill="#ffffff" style={codeText}>
        {'{ }'}
      </text>
      <text x="254" y="64" fontSize="22" fill="#ffffff" opacity="0.85" style={codeText}>
        01
      </text>
      <text x="262" y="132" fontSize="26" fill="#ffffff" opacity="0.85" style={codeText}>
        #
      </text>
    </g>
  );
}

function StudySkillsArt({ p }) {
  const rows = [58, 82, 106];
  return (
    <g>
      <rect x="118" y="34" width="84" height="102" rx="10" fill="#ffffff" />
      <rect x="140" y="26" width="40" height="16" rx="5" fill="#78350f" />
      {rows.map((y, index) => (
        <g key={y}>
          <rect
            x="132"
            y={y}
            width="14"
            height="14"
            rx="3"
            fill="none"
            stroke={p.accent}
            strokeWidth="3"
          />
          {index < 2 && (
            <path
              d={`M135 ${y + 7} l4 4 l7 -8`}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <path d={`M156 ${y + 7} H188`} stroke={p.soft} strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <g transform="translate(64 82)">
        <circle r="26" fill="#ffffff" />
        <path d="M0 0 V-15 M0 0 L11 7" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
        <circle r="3" fill="#92400e" />
      </g>
      <g transform="translate(256 82) rotate(8)">
        <rect x="-22" y="-22" width="44" height="44" rx="4" fill="#fef9c3" />
        <path d="M-12 -6 H12 M-12 4 H8" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

function TestPrepArt({ p }) {
  const rows = [
    { y: 54, filled: 1 },
    { y: 76, filled: 3 },
    { y: 98, filled: 0 },
    { y: 120, filled: 2 },
  ];
  const columns = [142, 160, 178, 196];
  return (
    <g>
      <rect x="112" y="32" width="100" height="106" rx="8" fill="#ffffff" />
      {rows.map((row) => (
        <g key={row.y}>
          <rect x="122" y={row.y - 2} width="8" height="4" rx="2" fill={p.soft} />
          {columns.map((x, index) => (
            <circle
              key={x}
              cx={x}
              cy={row.y}
              r="6"
              fill={index === row.filled ? p.accent : 'none'}
              stroke={index === row.filled ? p.accent : p.soft}
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
      <circle cx="244" cy="54" r="24" fill="#fde047" />
      <text
        x="244"
        y="62"
        fontSize="22"
        textAnchor="middle"
        fill="#b91c1c"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        A+
      </text>
      <g transform="translate(66 92)">
        <rect x="-5" y="-34" width="10" height="8" rx="2" fill="#ffffff" />
        <circle r="24" fill="#ffffff" />
        <path d="M0 0 L9 -12" stroke="#b91c1c" strokeWidth="4" strokeLinecap="round" />
        <circle r="3" fill="#b91c1c" />
      </g>
    </g>
  );
}

function HomeworkHelpArt({ p }) {
  const spiralRows = [46, 60, 74, 88, 102, 116];
  return (
    <g>
      <rect x="108" y="34" width="104" height="98" rx="8" fill="#ffffff" />
      <path d="M124 38 V128" stroke="#fca5a5" strokeWidth="2" />
      <path
        d="M130 58 H198 M130 73 H198 M130 88 H198 M130 103 H198 M130 118 H176"
        stroke={p.soft}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {spiralRows.map((y) => (
        <circle key={y} cx="108" cy={y} r="4.5" fill="#f7fee7" stroke={p.accent} strokeWidth="2" />
      ))}
      <g transform="translate(252 60)">
        <path
          d="M0 -36 V-28 M-26 -10 H-18 M18 -10 H26 M-19 -29 L-13 -23 M19 -29 L13 -23"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cy="-6" r="18" fill="#fde047" />
        <rect x="-8" y="12" width="16" height="10" rx="2" fill="#e5e7eb" />
      </g>
      <Pencil transform="translate(62 84) rotate(-25)" />
    </g>
  );
}

const ART_BY_SUBJECT = {
  math: MathArt,
  science: ScienceArt,
  english: EnglishArt,
  'social-studies': SocialStudiesArt,
  'world-languages': WorldLanguagesArt,
  'computer-science': ComputerScienceArt,
  'study-skills': StudySkillsArt,
  'test-prep': TestPrepArt,
  'homework-help': HomeworkHelpArt,
};

function DefaultArt() {
  return (
    <g>
      <rect x="110" y="96" width="100" height="18" rx="4" fill="#ffffff" />
      <rect x="118" y="76" width="88" height="18" rx="4" fill="#e2e8f0" />
      <rect x="114" y="56" width="94" height="18" rx="4" fill="#ffffff" />
    </g>
  );
}

/**
 * @param {object} props
 * @param {string} props.subject  one of the subject values, e.g. "math"
 * @param {string} [props.className]
 */
function SubjectArt({ subject, className = '' }) {
  // useId gives each picture unique ids, so two pictures on one page never share a gradient.
  const uid = `art${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const p = PALETTES[subject] || PALETTES.default;
  const Art = ART_BY_SUBJECT[subject] || DefaultArt;
  const gradientId = `${uid}-bg`;

  return (
    <svg
      className={`subject-art ${className}`}
      viewBox="0 0 320 160"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.from} />
          <stop offset="1" stopColor={p.to} />
        </linearGradient>
      </defs>
      <rect width="320" height="160" fill={`url(#${gradientId})`} />
      <circle cx="30" cy="18" r="46" fill="#ffffff" opacity="0.12" />
      <circle cx="298" cy="150" r="56" fill="#ffffff" opacity="0.1" />
      <circle cx="292" cy="22" r="4" fill="#ffffff" opacity="0.35" />
      <circle cx="22" cy="146" r="3" fill="#ffffff" opacity="0.35" />
      <Art p={p} uid={uid} />
    </svg>
  );
}

export default SubjectArt;
