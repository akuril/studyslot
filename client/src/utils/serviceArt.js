// Picks a picture ("motif") for each service from its name, so services in the same
// subject don't all share one picture. Unknown names fall back to the subject's picture.
// The order matters: the first matching rule wins.

const MOTIF_RULES = [
  [/spanish grammar|spanish.*writing/i, 'flashcards'],
  [/pre-?algebra/i, 'equation'],
  [/precalc|trig/i, 'unitCircle'],
  [/calculus/i, 'integral'],
  [/statistic|data/i, 'barChart'],
  [/geometry/i, 'geometry'],
  [/middle school math|fraction/i, 'fractions'],
  [/biology|chemistr/i, 'dna'],
  [/physics/i, 'pendulum'],
  [/physical science/i, 'magnet'],
  [/environment/i, 'tree'],
  [/science fair/i, 'scienceFair'],
  [/life|earth/i, 'leaf'],
  [/college|application/i, 'gradCap'],
  [/creative/i, 'quill'],
  [/grammar|vocabulary/i, 'letterTiles'],
  [/literature/i, 'bookStack'],
  [/essay/i, 'essay'],
  [/u\.?s\.? history|government/i, 'capitol'],
  [/civics|current events/i, 'news'],
  [/deep dive/i, 'pyramid'],
  [/french/i, 'bonjour'],
  [/mandarin|chinese/i, 'hanzi'],
  [/sign language|asl/i, 'hands'],
  [/python/i, 'terminal'],
  [/scratch|game/i, 'gameBlocks'],
  [/web|html|css/i, 'browser'],
  [/java\b/i, 'coffeeCode'],
  [/time management/i, 'calendarClock'],
  [/note-?taking/i, 'highlighter'],
  [/psat/i, 'stopwatch'],
  [/state test/i, 'medal'],
  [/high school homework|homework lab/i, 'backpack'],
];

/** e.g. { name: 'Calculus Coaching', subject: 'math' } -> 'integral' (or undefined) */
export function motifFor(service) {
  const name = String((service && service.name) || '');
  const match = MOTIF_RULES.find(([pattern]) => pattern.test(name));
  return match ? match[1] : undefined;
}
