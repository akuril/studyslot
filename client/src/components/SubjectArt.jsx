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
      <path
        d="M128 132 H192 M160 124 V132"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
      />
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
      <rect
        x="100"
        y="34"
        width="120"
        height="78"
        rx="6"
        fill={p.soft}
        stroke="#ffffff"
        strokeWidth="4"
      />
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

// ===== One picture per service (chosen by utils/serviceArt.js from the service name) =====
// Each motif has its own background colors (a shade of its subject's colors),
// so even services in the same subject look different.

const MOTIF_COLORS = {
  fractions: ['#4f7cff', '#6a4cff'],
  geometry: ['#2563eb', '#0891b2'],
  equation: ['#6366f1', '#a855f7'],
  unitCircle: ['#0ea5e9', '#6366f1'],
  integral: ['#4338ca', '#7c3aed'],
  barChart: ['#3b82f6', '#14b8a6'],
  leaf: ['#10b981', '#65a30d'],
  dna: ['#06b6d4', '#8b5cf6'],
  magnet: ['#0d9488', '#0284c7'],
  pendulum: ['#0891b2', '#1e40af'],
  tree: ['#22c55e', '#0d9488'],
  scienceFair: ['#14b8a6', '#f59e0b'],
  essay: ['#f43f5e', '#f97316'],
  letterTiles: ['#fb923c', '#f59e0b'],
  bookStack: ['#e11d48', '#9333ea'],
  gradCap: ['#ea580c', '#be123c'],
  quill: ['#f472b6', '#f97316'],
  capitol: ['#1d4ed8', '#dc2626'],
  news: ['#0284c7', '#475569'],
  pyramid: ['#f59e0b', '#0ea5e9'],
  flashcards: ['#c026d3', '#f43f5e'],
  bonjour: ['#2563eb', '#a855f7'],
  hanzi: ['#dc2626', '#a855f7'],
  hands: ['#8b5cf6', '#06b6d4'],
  terminal: ['#1e293b', '#0f766e'],
  gameBlocks: ['#7c3aed', '#f59e0b'],
  browser: ['#0f172a', '#2563eb'],
  coffeeCode: ['#3f3f46', '#b45309'],
  calendarClock: ['#f59e0b', '#ef4444'],
  highlighter: ['#facc15', '#22c55e'],
  stopwatch: ['#e11d48', '#7c3aed'],
  medal: ['#dc2626', '#f59e0b'],
  backpack: ['#16a34a', '#0891b2'],
};

function FractionsArt() {
  return (
    <g>
      <circle cx="120" cy="80" r="42" fill="#ffffff" />
      <path d="M120 80 V38 A42 42 0 0 1 162 80 Z" fill="#6366f1" />
      <path d="M120 80 H162 A42 42 0 0 1 120 122 Z" fill="#a5b4fc" />
      <circle cx="120" cy="80" r="42" fill="none" stroke="#312e81" strokeWidth="2" opacity="0.3" />
      <rect x="182" y="44" width="70" height="72" rx="10" fill="#ffffff" />
      <text
        x="217"
        y="74"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#4f46e5"
        fontFamily="system-ui, sans-serif"
      >
        3
      </text>
      <path d="M200 82 H234" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
      <text
        x="217"
        y="108"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#4f46e5"
        fontFamily="system-ui, sans-serif"
      >
        4
      </text>
      <text x="44" y="60" fontSize="26" fill="#ffffff" fontWeight="700" fontFamily="Georgia, serif">
        ½
      </text>
      <text
        x="46"
        y="128"
        fontSize="26"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        %
      </text>
    </g>
  );
}

function GeometryArt() {
  return (
    <g>
      <polygon points="96,124 160,36 224,124" fill="#ffffff" />
      <polygon points="96,124 160,36 224,124" fill="none" stroke="#1d4ed8" strokeWidth="3" />
      <path d="M160 36 V124" stroke="#93c5fd" strokeWidth="2" strokeDasharray="5 4" />
      <rect x="160" y="112" width="12" height="12" fill="none" stroke="#1d4ed8" strokeWidth="2" />
      <g transform="translate(262 52)">
        <path d="M0 0 L-18 62 M0 0 L18 62" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <circle r="7" fill="#fde047" />
      </g>
      <g transform="translate(58 92) rotate(-20)">
        <rect x="-34" y="-9" width="68" height="18" rx="3" fill="#fde047" />
        <path
          d="M-26 -9 v8 M-18 -9 v5 M-10 -9 v8 M-2 -9 v5 M6 -9 v8 M14 -9 v5 M22 -9 v8"
          stroke="#a16207"
          strokeWidth="2"
        />
      </g>
    </g>
  );
}

function EquationArt() {
  return (
    <g>
      <rect x="62" y="30" width="196" height="100" rx="10" fill="#1e293b" />
      <rect
        x="62"
        y="30"
        width="196"
        height="100"
        rx="10"
        fill="none"
        stroke="#a16207"
        strokeWidth="6"
      />
      <text
        x="160"
        y="76"
        textAnchor="middle"
        fontSize="28"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="'Comic Sans MS', 'Segoe Print', system-ui, sans-serif"
      >
        3x + 2 = 11
      </text>
      <text
        x="160"
        y="112"
        textAnchor="middle"
        fontSize="26"
        fill="#fde047"
        fontWeight="700"
        fontFamily="'Comic Sans MS', 'Segoe Print', system-ui, sans-serif"
      >
        x = ?
      </text>
      <rect x="208" y="132" width="26" height="8" rx="2" fill="#ffffff" />
    </g>
  );
}

function UnitCircleArt() {
  return (
    <g>
      <circle cx="104" cy="80" r="46" fill="#ffffff" />
      <path d="M52 80 H156 M104 28 V132" stroke="#c7d2fe" strokeWidth="2" />
      <path d="M104 80 L137 47" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      <path d="M124 80 A20 20 0 0 0 118 66" fill="none" stroke="#f43f5e" strokeWidth="3" />
      <circle cx="137" cy="47" r="5" fill="#4f46e5" />
      <text
        x="128"
        y="76"
        fontSize="14"
        fill="#f43f5e"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        θ
      </text>
      <path
        d="M176 80 C190 40 204 40 218 80 S246 120 260 80 S288 40 300 70"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text
        x="214"
        y="138"
        fontSize="20"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        sin x
      </text>
    </g>
  );
}

function IntegralArt({ uid }) {
  const clipId = `${uid}-area`;
  return (
    <g>
      <rect x="120" y="30" width="170" height="100" rx="10" fill="#ffffff" />
      <clipPath id={clipId}>
        <path d="M150 116 C180 116 200 50 270 46 V116 Z" />
      </clipPath>
      <rect x="180" y="30" width="60" height="100" fill="#c4b5fd" clipPath={`url(#${clipId})`} />
      <path d="M140 116 H280 M150 40 V122" stroke="#ddd6fe" strokeWidth="2" />
      <path
        d="M150 116 C180 116 200 50 270 46"
        fill="none"
        stroke="#6d28d9"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x="70"
        y="118"
        textAnchor="middle"
        fontSize="96"
        fill="#ffffff"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        ∫
      </text>
      <text x="96" y="60" fontSize="16" fill="#ffffff" fontWeight="700" fontFamily="Georgia, serif">
        dx
      </text>
    </g>
  );
}

function BarChartArt() {
  const bars = [
    [116, 92, '#60a5fa'],
    [142, 70, '#3b82f6'],
    [168, 52, '#2563eb'],
    [194, 74, '#14b8a6'],
    [220, 100, '#2dd4bf'],
  ];
  return (
    <g>
      <rect x="98" y="30" width="148" height="104" rx="10" fill="#ffffff" />
      {bars.map(([x, y, color]) => (
        <rect key={x} x={x} y={y} width="18" height={124 - y} rx="3" fill={color} />
      ))}
      <path d="M108 124 H238" stroke="#94a3b8" strokeWidth="2" />
      <path
        d="M108 112 C140 112 150 44 176 44 S212 112 240 112"
        fill="none"
        stroke="#f43f5e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g transform="translate(58 82)">
        <circle r="26" fill="#ffffff" opacity="0.95" />
        <path d="M0 0 V-26 A26 26 0 0 1 22.5 13 Z" fill="#14b8a6" />
      </g>
    </g>
  );
}

function LeafArt() {
  return (
    <g>
      <path d="M40 140 L110 70 L150 104 L200 52 L290 140 Z" fill="#ffffff" opacity="0.35" />
      <path d="M140 132 C116 96 130 44 196 32 C214 88 192 128 140 132 Z" fill="#ffffff" />
      <path d="M140 132 C158 98 174 70 196 32" stroke="#16a34a" strokeWidth="3" fill="none" />
      <path
        d="M154 106 l-14 -6 M164 88 l-16 -4 M176 68 l-14 -2 M160 104 l14 -10 M172 84 l14 -10"
        stroke="#16a34a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="252" cy="48" r="18" fill="#fde047" />
      <g transform="translate(70 66)">
        <ellipse rx="22" ry="10" fill="#ffffff" />
        <ellipse cx="14" cy="-6" rx="14" ry="10" fill="#ffffff" />
      </g>
    </g>
  );
}

function DnaArt() {
  const rungs = [44, 60, 76, 92, 108, 124];
  return (
    <g>
      <path
        d="M130 30 C190 62 90 98 150 130"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M170 30 C110 62 210 98 150 130"
        fill="none"
        stroke="#fde047"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {rungs.map((y, index) => (
        <path
          key={y}
          d={`M${142 + (index % 2 ? -10 : 6)} ${y} H${158 + (index % 2 ? 2 : 14)}`}
          stroke="#ffffff"
          strokeWidth="3"
          opacity="0.7"
        />
      ))}
      <g transform="translate(244 72)">
        <path
          d="M-10 -26 h20 v18 l16 28 a6 6 0 0 1 -5 9 h-42 a6 6 0 0 1 -5 -9 l16 -28 z"
          fill="#ffffff"
        />
        <path d="M-17 10 h34 l7 11 a6 6 0 0 1 -5 8 h-38 a6 6 0 0 1 -5 -8 z" fill="#a78bfa" />
      </g>
      <g transform="translate(66 84)" fill="none" stroke="#ffffff" strokeWidth="2.5">
        <circle r="24" />
        <circle r="9" fill="#ffffff" opacity="0.6" />
        <circle cx="10" cy="-12" r="3" fill="#ffffff" />
      </g>
    </g>
  );
}

function MagnetArt() {
  return (
    <g>
      <path
        d="M110 40 V90 A50 50 0 0 0 210 90 V40 H180 V90 A20 20 0 0 1 140 90 V40 Z"
        fill="#ef4444"
      />
      <rect x="110" y="40" width="30" height="20" fill="#ffffff" />
      <rect x="180" y="40" width="30" height="20" fill="#ffffff" />
      <path
        d="M100 30 c-14 -8 -24 -2 -30 6 M220 30 c14 -8 24 -2 30 6"
        stroke="#ffffff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <polygon points="262,56 248,86 260,86 250,116 278,78 264,78 274,56" fill="#fde047" />
      <g fill="#ffffff" opacity="0.8">
        <circle cx="60" cy="96" r="4" />
        <circle cx="74" cy="112" r="3" />
        <circle cx="52" cy="124" r="3" />
      </g>
    </g>
  );
}

function PendulumArt() {
  const balls = [116, 140, 164, 188];
  return (
    <g>
      <path d="M92 34 H236" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      {balls.map((x) => (
        <g key={x}>
          <path d={`M${x} 34 V100`} stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          <circle cx={x} cy="110" r="12" fill="#ffffff" />
        </g>
      ))}
      <path d="M212 34 L248 92" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
      <circle cx="254" cy="100" r="12" fill="#fde047" />
      <path
        d="M262 78 a26 26 0 0 1 10 28"
        fill="none"
        stroke="#fde047"
        strokeWidth="2.5"
        strokeDasharray="4 4"
      />
      <text x="40" y="70" fontSize="22" fill="#ffffff" fontWeight="700" fontFamily="Georgia, serif">
        F=ma
      </text>
    </g>
  );
}

function TreeArt() {
  return (
    <g>
      <rect x="150" y="92" width="18" height="42" rx="4" fill="#78350f" />
      <circle cx="159" cy="70" r="36" fill="#ffffff" />
      <circle cx="132" cy="84" r="22" fill="#ffffff" />
      <circle cx="186" cy="84" r="22" fill="#ffffff" />
      <circle cx="146" cy="62" r="6" fill="#86efac" />
      <circle cx="174" cy="76" r="6" fill="#86efac" />
      <path d="M40 136 H280" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <circle cx="258" cy="46" r="16" fill="#fde047" />
      <g
        transform="translate(70 70)"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <path d="M-14 8 a16 16 0 0 1 22 -22" />
        <path d="M14 -6 a16 16 0 0 1 -14 22" />
        <polygon points="8,-20 12,-10 2,-12" fill="#ffffff" />
      </g>
    </g>
  );
}

function ScienceFairArt() {
  return (
    <g>
      <polygon points="80,44 120,36 120,128 80,120" fill="#e0f2fe" />
      <rect x="120" y="36" width="90" height="92" fill="#ffffff" />
      <polygon points="210,36 250,44 250,120 210,128" fill="#e0f2fe" />
      <rect x="134" y="46" width="62" height="12" rx="3" fill="#14b8a6" />
      <path
        d="M134 108 L150 86 L166 96 L192 68"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="88" y="62" width="24" height="18" rx="2" fill="#99f6e4" />
      <rect x="218" y="62" width="24" height="18" rx="2" fill="#fde68a" />
      <g transform="translate(276 58)">
        <circle r="14" fill="#fde047" />
        <polygon points="-8,10 -12,34 0,26 12,34 8,10" fill="#ef4444" />
        <circle r="7" fill="#f59e0b" />
      </g>
    </g>
  );
}

function EssayArt() {
  return (
    <g>
      <g transform="rotate(-6 160 82)">
        <rect x="112" y="28" width="96" height="112" rx="6" fill="#ffffff" />
        <path
          d="M124 52 H196 M124 66 H196 M124 80 H186 M124 94 H196 M124 108 H170"
          stroke="#fecdd3"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M128 120 l6 6 l12 -14"
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(244 64)">
        <circle r="24" fill="#ffffff" />
        <text
          y="10"
          textAnchor="middle"
          fontSize="28"
          fontWeight="800"
          fill="#e11d48"
          fontFamily="system-ui, sans-serif"
        >
          A
        </text>
      </g>
      <g transform="translate(66 90) rotate(35)">
        <rect x="-5" y="-34" width="10" height="56" rx="3" fill="#e11d48" />
        <polygon points="-5,22 5,22 0,34" fill="#fecdd3" />
      </g>
    </g>
  );
}

function LetterTilesArt() {
  const tiles = [
    [74, 'G'],
    [122, 'R'],
    [170, 'A'],
    [218, 'M'],
  ];
  return (
    <g>
      {tiles.map(([x, letter], index) => (
        <g key={x} transform={`rotate(${index % 2 ? 4 : -4} ${x + 20} 80)`}>
          <rect x={x} y="56" width="40" height="44" rx="6" fill="#fef3c7" />
          <rect x={x} y="94" width="40" height="6" rx="3" fill="#d97706" opacity="0.5" />
          <text
            x={x + 20}
            y="88"
            textAnchor="middle"
            fontSize="26"
            fontWeight="800"
            fill="#92400e"
            fontFamily="system-ui, sans-serif"
          >
            {letter}
          </text>
        </g>
      ))}
      <text x="60" y="40" fontSize="24" fill="#ffffff" fontWeight="800" fontFamily="Georgia, serif">
        ,
      </text>
      <text
        x="262"
        y="138"
        fontSize="26"
        fill="#ffffff"
        fontWeight="800"
        fontFamily="Georgia, serif"
      >
        ?
      </text>
      <text
        x="150"
        y="138"
        fontSize="24"
        fill="#ffffff"
        fontWeight="800"
        fontFamily="Georgia, serif"
      >
        ;
      </text>
    </g>
  );
}

function BookStackArt() {
  return (
    <g>
      <rect x="96" y="104" width="132" height="22" rx="4" fill="#ffffff" />
      <rect x="96" y="104" width="12" height="22" fill="#e11d48" />
      <rect x="108" y="80" width="112" height="22" rx="4" fill="#fde68a" />
      <rect x="108" y="80" width="12" height="22" fill="#9333ea" />
      <rect x="100" y="56" width="124" height="22" rx="4" fill="#ffffff" />
      <rect x="100" y="56" width="12" height="22" fill="#0ea5e9" />
      <path d="M128 67 H200 M134 91 H196 M124 115 H206" stroke="#94a3b8" strokeWidth="2" />
      <g transform="translate(250 54)" fill="none" stroke="#ffffff" strokeWidth="3">
        <circle cx="-12" r="10" />
        <circle cx="12" r="10" />
        <path d="M-2 0 H2" />
      </g>
      <text x="44" y="76" fontSize="40" fill="#ffffff" fontFamily="Georgia, serif">
        “
      </text>
    </g>
  );
}

function GradCapArt() {
  return (
    <g>
      <polygon points="160,30 236,58 160,86 84,58" fill="#1f2937" />
      <path d="M120 72 V100 C120 112 200 112 200 100 V72 L160 86 Z" fill="#374151" />
      <path d="M236 58 V96" stroke="#fde047" strokeWidth="3" />
      <circle cx="236" cy="100" r="6" fill="#fde047" />
      <g transform="translate(70 104) rotate(-8)">
        <rect x="-30" y="-20" width="60" height="40" rx="4" fill="#ffffff" />
        <path d="M-30 -20 L0 4 L30 -20" fill="none" stroke="#fda4af" strokeWidth="3" />
      </g>
      <path d="M262 120 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill="#ffffff" />
    </g>
  );
}

function QuillArt() {
  return (
    <g>
      <path d="M210 30 C150 44 120 92 118 124 C150 108 196 74 210 30 Z" fill="#ffffff" />
      <path d="M210 30 L118 124" stroke="#f472b6" strokeWidth="3" />
      <path d="M118 124 L108 138" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M150 74 l-12 -4 M168 58 l-12 -6 M160 92 l12 -2 M178 74 l12 -4"
        stroke="#fbcfe8"
        strokeWidth="2"
      />
      <path d="M80 120 h40 v20 h-40 z" fill="#1f2937" />
      <rect x="86" y="112" width="28" height="10" rx="3" fill="#374151" />
      <path d="M250 50 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" fill="#ffffff" />
      <path d="M268 102 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" fill="#ffffff" />
      <path d="M52 52 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" fill="#ffffff" />
    </g>
  );
}

function CapitolArt() {
  return (
    <g>
      <path d="M118 66 A42 32 0 0 1 202 66 Z" fill="#ffffff" />
      <rect x="156" y="22" width="8" height="14" fill="#ffffff" />
      <rect x="104" y="66" width="112" height="10" fill="#ffffff" />
      {[112, 132, 152, 172, 192].map((x) => (
        <rect key={x} x={x} y="78" width="10" height="40" fill="#ffffff" />
      ))}
      <rect x="96" y="118" width="128" height="12" fill="#ffffff" />
      <g transform="translate(258 70)">
        <rect x="-18" y="-24" width="36" height="52" rx="4" fill="#fef3c7" />
        <rect x="-22" y="-28" width="44" height="8" rx="4" fill="#d97706" />
        <rect x="-22" y="24" width="44" height="8" rx="4" fill="#d97706" />
        <path d="M-10 -10 H10 M-10 0 H10 M-10 10 H6" stroke="#92400e" strokeWidth="2" />
      </g>
      <g transform="translate(60 76)">
        <path d="M0 -26 L7 -8 H26 L11 3 L17 22 L0 10 L-17 22 L-11 3 L-26 -8 H-7 Z" fill="#ffffff" />
      </g>
    </g>
  );
}

function NewsArt() {
  return (
    <g>
      <rect x="92" y="34" width="120" height="96" rx="6" fill="#ffffff" />
      <rect x="104" y="44" width="96" height="12" rx="2" fill="#0f172a" />
      <rect x="104" y="64" width="44" height="34" rx="3" fill="#bae6fd" />
      <path
        d="M156 66 H200 M156 76 H200 M156 86 H192 M104 108 H200 M104 118 H180"
        stroke="#cbd5e1"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g transform="translate(252 92)">
        <rect x="-26" y="-14" width="52" height="40" rx="4" fill="#ffffff" />
        <rect x="-12" y="-16" width="24" height="5" rx="2" fill="#475569" />
        <g transform="translate(0 -26) rotate(-8)">
          <rect x="-10" y="-14" width="20" height="24" rx="2" fill="#fde68a" />
          <path d="M-5 -4 l3 4 l7 -9" fill="none" stroke="#16a34a" strokeWidth="2.5" />
        </g>
      </g>
      <g transform="translate(58 60)">
        <path d="M-18 -6 L10 -18 V18 L-18 6 Z" fill="#ffffff" />
        <rect x="-26" y="-6" width="8" height="12" rx="2" fill="#ffffff" />
      </g>
    </g>
  );
}

function PyramidArt() {
  return (
    <g>
      <circle cx="232" cy="46" r="18" fill="#fde047" />
      <polygon points="70,130 132,52 194,130" fill="#fde68a" />
      <polygon points="132,52 194,130 160,130" fill="#f59e0b" opacity="0.6" />
      <polygon points="168,130 214,72 260,130" fill="#fef3c7" />
      <polygon points="214,72 260,130 236,130" fill="#f59e0b" opacity="0.5" />
      <path d="M40 132 H290" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <g transform="translate(56 56)">
        <path d="M-12 -18 H12 L2 0 L12 18 H-12 L-2 0 Z" fill="#ffffff" />
        <path d="M-6 12 H6 L0 4 Z" fill="#f59e0b" />
      </g>
    </g>
  );
}

function FlashcardsArt() {
  return (
    <g>
      <g transform="rotate(-8 108 84)">
        <rect x="58" y="52" width="100" height="64" rx="10" fill="#fdf4ff" />
        <text
          x="108"
          y="92"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#a21caf"
          fontFamily="system-ui, sans-serif"
        >
          ser
        </text>
      </g>
      <g transform="rotate(6 216 80)">
        <rect x="166" y="48" width="100" height="64" rx="10" fill="#ffffff" />
        <text
          x="216"
          y="88"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#e11d48"
          fontFamily="system-ui, sans-serif"
        >
          estar
        </text>
      </g>
      <text
        x="142"
        y="40"
        fontSize="16"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        yo soy
      </text>
      <text
        x="138"
        y="136"
        fontSize="16"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        tú eres
      </text>
    </g>
  );
}

function BonjourArt() {
  return (
    <g>
      <rect x="70" y="36" width="130" height="52" rx="18" fill="#ffffff" />
      <polygon points="96,88 90,108 118,88" fill="#ffffff" />
      <text
        x="135"
        y="70"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#2563eb"
        fontFamily="system-ui, sans-serif"
      >
        Bonjour !
      </text>
      <rect x="168" y="96" width="92" height="40" rx="14" fill="#ede9fe" />
      <text
        x="214"
        y="122"
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="#7c3aed"
        fontFamily="system-ui, sans-serif"
      >
        Merci
      </text>
      <g transform="translate(262 52)">
        <path
          d="M0 -26 L10 22 H-10 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M-6 4 H6 M-8 14 H8" stroke="#ffffff" strokeWidth="3" />
      </g>
      <text
        x="40"
        y="138"
        fontSize="16"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        Salut
      </text>
    </g>
  );
}

function HanziArt() {
  return (
    <g>
      <rect x="84" y="38" width="120" height="58" rx="18" fill="#ffffff" />
      <polygon points="110,96 104,116 134,96" fill="#ffffff" />
      <text
        x="144"
        y="80"
        textAnchor="middle"
        fontSize="32"
        fontWeight="700"
        fill="#dc2626"
        fontFamily="'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif"
      >
        你好
      </text>
      <g transform="translate(250 70)">
        <path d="M0 -40 V-30" stroke="#ffffff" strokeWidth="2" />
        <ellipse rx="22" ry="28" fill="#ef4444" />
        <path d="M-22 0 H22 M0 -28 V28" stroke="#fca5a5" strokeWidth="2" />
        <rect x="-10" y="-32" width="20" height="6" rx="2" fill="#fde047" />
        <rect x="-10" y="26" width="20" height="6" rx="2" fill="#fde047" />
        <path d="M0 32 V44" stroke="#fde047" strokeWidth="2" />
      </g>
      <text
        x="40"
        y="140"
        fontSize="16"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        nǐ hǎo
      </text>
    </g>
  );
}

function HandsArt() {
  return (
    <g>
      <g transform="translate(130 86)">
        <rect x="-26" y="-6" width="52" height="46" rx="18" fill="#ffffff" />
        <rect x="-24" y="-44" width="11" height="44" rx="5.5" fill="#ffffff" />
        <rect x="-11" y="-54" width="11" height="54" rx="5.5" fill="#ffffff" />
        <rect x="2" y="-50" width="11" height="50" rx="5.5" fill="#ffffff" />
        <rect x="15" y="-40" width="11" height="40" rx="5.5" fill="#ffffff" />
        <rect
          x="-40"
          y="0"
          width="22"
          height="11"
          rx="5.5"
          fill="#ffffff"
          transform="rotate(-30 -29 5)"
        />
      </g>
      <g transform="translate(222 82)">
        <path
          d="M0 24 C-34 0 -26 -26 -8 -24 C-2 -24 0 -18 0 -14 C0 -18 2 -24 8 -24 C26 -26 34 0 0 24 Z"
          fill="#f9a8d4"
        />
      </g>
      <path
        d="M180 46 c6 -6 14 -6 20 0 M184 38 c10 -10 22 -10 32 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />
      <text
        x="248"
        y="140"
        fontSize="18"
        fill="#ffffff"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        ASL
      </text>
    </g>
  );
}

function TerminalArt() {
  return (
    <g>
      <rect
        x="70"
        y="32"
        width="180"
        height="100"
        rx="10"
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <rect x="70" y="32" width="180" height="20" rx="10" fill="#334155" />
      <circle cx="84" cy="42" r="4" fill="#f87171" />
      <circle cx="96" cy="42" r="4" fill="#fbbf24" />
      <circle cx="108" cy="42" r="4" fill="#34d399" />
      <text
        x="82"
        y="76"
        fontSize="15"
        fill="#34d399"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        &gt;&gt;&gt; print(&quot;Hi!&quot;)
      </text>
      <text
        x="82"
        y="96"
        fontSize="15"
        fill="#e2e8f0"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        Hi!
      </text>
      <rect x="82" y="106" width="10" height="16" fill="#34d399" />
      <text
        x="268"
        y="70"
        fontSize="18"
        fill="#ffffff"
        opacity="0.85"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        .py
      </text>
    </g>
  );
}

function GameBlocksArt() {
  return (
    <g>
      <path d="M70 40 h30 l6 6 h20 l6 -6 h48 v24 h-48 l-6 6 h-20 l-6 -6 h-30 z" fill="#fbbf24" />
      <path d="M86 70 h30 l6 6 h20 l6 -6 h48 v24 h-48 l-6 6 h-20 l-6 -6 h-30 z" fill="#ffffff" />
      <path d="M86 100 h30 l6 6 h20 l6 -6 h48 v24 h-48 l-6 6 h-20 l-6 -6 h-30 z" fill="#c4b5fd" />
      <text
        x="96"
        y="57"
        fontSize="12"
        fontWeight="800"
        fill="#78350f"
        fontFamily="system-ui, sans-serif"
      >
        when clicked
      </text>
      <text
        x="112"
        y="87"
        fontSize="12"
        fontWeight="800"
        fill="#4c1d95"
        fontFamily="system-ui, sans-serif"
      >
        repeat 10
      </text>
      <text
        x="112"
        y="117"
        fontSize="12"
        fontWeight="800"
        fill="#4c1d95"
        fontFamily="system-ui, sans-serif"
      >
        move 10
      </text>
      <g transform="translate(258 92)">
        <rect x="-34" y="-18" width="68" height="36" rx="18" fill="#ffffff" />
        <path d="M-20 0 H-8 M-14 -6 V6" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
        <circle cx="12" cy="-4" r="4" fill="#f59e0b" />
        <circle cx="20" cy="4" r="4" fill="#ef4444" />
      </g>
    </g>
  );
}

function BrowserArt() {
  return (
    <g>
      <rect x="64" y="30" width="192" height="108" rx="10" fill="#ffffff" />
      <rect x="64" y="30" width="192" height="20" rx="10" fill="#cbd5e1" />
      <circle cx="78" cy="40" r="4" fill="#f87171" />
      <circle cx="90" cy="40" r="4" fill="#fbbf24" />
      <circle cx="102" cy="40" r="4" fill="#34d399" />
      <rect x="116" y="35" width="110" height="10" rx="5" fill="#ffffff" />
      <rect x="76" y="60" width="168" height="18" rx="4" fill="#bfdbfe" />
      <rect x="76" y="86" width="74" height="42" rx="4" fill="#dbeafe" />
      <rect x="158" y="86" width="86" height="8" rx="4" fill="#cbd5e1" />
      <rect x="158" y="100" width="70" height="8" rx="4" fill="#cbd5e1" />
      <rect x="158" y="114" width="44" height="12" rx="6" fill="#2563eb" />
      <polygon
        points="214,112 214,138 221,131 227,143 232,140 226,129 236,129"
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <text
        x="262"
        y="46"
        fontSize="14"
        fill="#ffffff"
        fontWeight="700"
        fontFamily="ui-monospace, Consolas, monospace"
      >
        &lt;/&gt;
      </text>
    </g>
  );
}

function CoffeeCodeArt() {
  return (
    <g>
      <rect
        x="64"
        y="40"
        width="130"
        height="86"
        rx="8"
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <text
        x="76"
        y="66"
        fontSize="13"
        fill="#fbbf24"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        class Main {'{'}
      </text>
      <text
        x="86"
        y="86"
        fontSize="13"
        fill="#93c5fd"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        int x = 42;
      </text>
      <text
        x="86"
        y="106"
        fontSize="13"
        fill="#86efac"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        x++;
      </text>
      <text
        x="76"
        y="120"
        fontSize="13"
        fill="#fbbf24"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
      >
        {'}'}
      </text>
      <g transform="translate(244 92)">
        <path d="M-26 -22 H18 V14 C18 26 8 32 -4 32 C-16 32 -26 26 -26 14 Z" fill="#ffffff" />
        <path d="M18 -12 C34 -12 34 12 18 12" fill="none" stroke="#ffffff" strokeWidth="5" />
        <rect x="-22" y="-18" width="36" height="8" rx="3" fill="#92400e" />
        <path
          d="M-12 -32 c-4 -6 4 -8 0 -14 M2 -32 c-4 -6 4 -8 0 -14"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function CalendarClockArt() {
  return (
    <g>
      <rect x="84" y="36" width="110" height="98" rx="10" fill="#ffffff" />
      <rect x="84" y="36" width="110" height="24" rx="10" fill="#ef4444" />
      <rect x="84" y="50" width="110" height="10" fill="#ef4444" />
      <rect x="106" y="28" width="8" height="18" rx="4" fill="#7f1d1d" />
      <rect x="164" y="28" width="8" height="18" rx="4" fill="#7f1d1d" />
      {[0, 1, 2, 3].map((col) =>
        [0, 1, 2].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={96 + col * 24}
            y={70 + row * 20}
            width="16"
            height="12"
            rx="3"
            fill={col === 2 && row === 1 ? '#f59e0b' : '#fde68a'}
          />
        )),
      )}
      <g transform="translate(240 92)">
        <circle cx="-16" cy="-30" r="8" fill="#ffffff" />
        <circle cx="16" cy="-30" r="8" fill="#ffffff" />
        <circle r="30" fill="#ffffff" />
        <circle r="24" fill="none" stroke="#fde68a" strokeWidth="3" />
        <path d="M0 0 V-16 M0 0 L12 8" stroke="#b91c1c" strokeWidth="4" strokeLinecap="round" />
      </g>
    </g>
  );
}

function HighlighterArt() {
  return (
    <g>
      <rect x="86" y="32" width="120" height="104" rx="8" fill="#ffffff" />
      <rect x="98" y="52" width="70" height="10" rx="2" fill="#fef08a" />
      <path
        d="M98 57 H190 M98 77 H190 M98 97 H176 M98 117 H186"
        stroke="#cbd5e1"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="98" y="92" width="52" height="10" rx="2" fill="#bbf7d0" opacity="0.9" />
      <g transform="translate(244 84) rotate(30)">
        <rect x="-10" y="-40" width="20" height="58" rx="4" fill="#facc15" />
        <rect x="-10" y="-40" width="20" height="12" rx="4" fill="#a16207" />
        <polygon points="-10,18 10,18 6,32 -6,32" fill="#fde047" />
      </g>
      <g transform="translate(58 72) rotate(-8)">
        <rect x="-20" y="-20" width="40" height="40" rx="3" fill="#bbf7d0" />
        <path d="M-12 -6 H12 M-12 4 H6" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

function StopwatchArt() {
  return (
    <g>
      <rect x="150" y="22" width="20" height="12" rx="3" fill="#ffffff" />
      <rect
        x="196"
        y="38"
        width="12"
        height="10"
        rx="3"
        fill="#ffffff"
        transform="rotate(40 202 43)"
      />
      <circle cx="160" cy="88" r="50" fill="#ffffff" />
      <circle cx="160" cy="88" r="42" fill="none" stroke="#fecdd3" strokeWidth="4" />
      <path d="M160 88 L160 56" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
      <path d="M160 88 L182 100" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
      <circle cx="160" cy="88" r="5" fill="#1f2937" />
      <path d="M160 46 v6 M202 88 h-6 M160 130 v-6 M118 88 h6" stroke="#1f2937" strokeWidth="3" />
      <g transform="translate(262 108)">
        <circle r="20" fill="#ffffff" opacity="0.95" />
        <circle r="12" fill="none" stroke="#e11d48" strokeWidth="3" />
        <circle r="4" fill="#e11d48" />
      </g>
      <g transform="translate(64 76) rotate(-30)">
        <rect x="-6" y="-30" width="12" height="52" fill="#fde047" />
        <polygon points="-6,22 6,22 0,34" fill="#fef3c7" />
      </g>
    </g>
  );
}

function MedalArt() {
  return (
    <g>
      <polygon points="132,22 156,22 170,70 146,70" fill="#2563eb" />
      <polygon points="188,22 164,22 150,70 174,70" fill="#ffffff" />
      <circle cx="160" cy="96" r="36" fill="#fde047" />
      <circle cx="160" cy="96" r="27" fill="#f59e0b" />
      <path
        d="M160 78 L166 92 H180 L169 100 L173 114 L160 106 L147 114 L151 100 L140 92 H154 Z"
        fill="#fde047"
      />
      <g transform="translate(64 84)">
        <rect x="-26" y="-34" width="52" height="68" rx="6" fill="#ffffff" />
        {[-18, -2, 14].map((y) => (
          <g key={y}>
            <path
              d={`M-16 ${y} l4 4 l8 -9`}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path d={`M2 ${y} H18`} stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
      </g>
      <text
        x="236"
        y="70"
        fontSize="30"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="system-ui, sans-serif"
      >
        A+
      </text>
    </g>
  );
}

function BackpackArt() {
  return (
    <g>
      <path d="M140 46 C140 30 180 30 180 46" fill="none" stroke="#ffffff" strokeWidth="6" />
      <rect x="116" y="44" width="88" height="96" rx="20" fill="#ffffff" />
      <rect x="130" y="92" width="60" height="34" rx="8" fill="#bbf7d0" />
      <path d="M130 104 H190" stroke="#16a34a" strokeWidth="2" />
      <rect x="152" y="98" width="16" height="8" rx="2" fill="#16a34a" />
      <path d="M128 60 H192" stroke="#bbf7d0" strokeWidth="4" strokeLinecap="round" />
      <g transform="translate(244 104)">
        <rect x="-30" y="12" width="60" height="14" rx="3" fill="#ffffff" />
        <rect x="-26" y="-2" width="52" height="14" rx="3" fill="#fde68a" />
        <rect x="-22" y="-16" width="44" height="14" rx="3" fill="#bae6fd" />
      </g>
      <g transform="translate(66 70)" fill="#ffffff">
        <circle r="18" opacity="0.95" />
        <text
          y="8"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#16a34a"
          fontFamily="system-ui, sans-serif"
        >
          ✓
        </text>
      </g>
    </g>
  );
}

const ART_BY_MOTIF = {
  fractions: FractionsArt,
  geometry: GeometryArt,
  equation: EquationArt,
  unitCircle: UnitCircleArt,
  integral: IntegralArt,
  barChart: BarChartArt,
  leaf: LeafArt,
  dna: DnaArt,
  magnet: MagnetArt,
  pendulum: PendulumArt,
  tree: TreeArt,
  scienceFair: ScienceFairArt,
  essay: EssayArt,
  letterTiles: LetterTilesArt,
  bookStack: BookStackArt,
  gradCap: GradCapArt,
  quill: QuillArt,
  capitol: CapitolArt,
  news: NewsArt,
  pyramid: PyramidArt,
  flashcards: FlashcardsArt,
  bonjour: BonjourArt,
  hanzi: HanziArt,
  hands: HandsArt,
  terminal: TerminalArt,
  gameBlocks: GameBlocksArt,
  browser: BrowserArt,
  coffeeCode: CoffeeCodeArt,
  calendarClock: CalendarClockArt,
  highlighter: HighlighterArt,
  stopwatch: StopwatchArt,
  medal: MedalArt,
  backpack: BackpackArt,
};

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
 * @param {string} [props.motif]  a picture for one service (see utils/serviceArt.js);
 *                                without it, the subject's general picture is drawn
 * @param {string} [props.className]
 */
function SubjectArt({ subject, motif, className = '' }) {
  // useId gives each picture unique ids, so two pictures on one page never share a gradient.
  const uid = `art${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const subjectPalette = PALETTES[subject] || PALETTES.default;
  const motifColors = motif && MOTIF_COLORS[motif];
  const p = motifColors
    ? { ...subjectPalette, from: motifColors[0], to: motifColors[1] }
    : subjectPalette;
  const Art = (motif && ART_BY_MOTIF[motif]) || ART_BY_SUBJECT[subject] || DefaultArt;
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
