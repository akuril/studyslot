// Helpers for <Avatar>: initials and a stable color picked from a name.

// Pairs chosen for strong contrast with white text (WCAG AA) in light and dark mode.
const COLORS = [
  '#4f46e5', // indigo
  '#0f766e', // teal
  '#b45309', // amber
  '#be123c', // rose
  '#7c3aed', // violet
  '#0369a1', // sky
  '#15803d', // green
  '#c2410c', // orange
  '#a21caf', // fuchsia
  '#334155', // slate
];

const TITLE = /^(ms|mr|mrs|mx|dr|sra|sr|mme|m)\.?$/i;

export function initialsOf(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !TITLE.test(word));
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function avatarColor(name) {
  let hash = 0;
  for (const char of String(name || '')) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

/** "Ms. Avery Lane" -> "Avery", "Jordan Rivera" -> "Jordan" (titles are skipped). */
export function firstNameOf(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !TITLE.test(word));
  return words[0] || '';
}
