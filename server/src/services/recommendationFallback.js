// The non-AI backup for "Find the right help": a simple keyword matcher.
// Used when the AI isn't configured, is slow, is down, or returns something unusable.
// It only reads the catalog we give it and never invents services.

// Keywords per subject. Longer words also match their endings
// ("fraction" matches "fractions", "organiz" matches "organized" and "organization").
// Short words (sat, act) must match exactly, so "satisfied" or "actually" don't count.
const SUBJECT_KEYWORDS = {
  math: [
    'math',
    'fraction',
    'algebra',
    'geometr',
    'equation',
    'ratio',
    'decimal',
    'percent',
    'calculus',
    'precalc',
    'trig',
    'statistic',
    'probabilit',
    'integer',
  ],
  english: [
    'english',
    'essay',
    'reading',
    'writing',
    'grammar',
    'vocabulary',
    'literature',
    'novel',
    'poem',
    'poetry',
    'creative',
    'story',
    'college',
  ],
  science: [
    'science',
    'biolog',
    'chemistr',
    'physics',
    'lab',
    'cell',
    'ecosystem',
    'environment',
    'climate',
    'experiment',
  ],
  'social-studies': ['history', 'geograph', 'government', 'civics', 'social', 'economic', 'news'],
  'world-languages': [
    'spanish',
    'french',
    'mandarin',
    'chinese',
    'asl',
    'language',
    'conversation',
  ],
  'computer-science': [
    'coding',
    'code',
    'python',
    'java',
    'programming',
    'computer',
    'scratch',
    'game',
    'website',
    'web',
    'html',
    'css',
  ],
  'study-skills': [
    'organiz',
    'planner',
    'study',
    'notes',
    'overwhelm',
    'focus',
    'habit',
    'procrastinat',
    'time',
  ],
  'test-prep': ['sat', 'act', 'psat'],
  'homework-help': ['homework', 'assignment'],
};

const SHORT_WORD_LENGTH = 3;
const MAX_RESULTS = 3;

export const FALLBACK_SUMMARY =
  "Our AI assistant is unavailable right now, so here's a basic keyword match.";
export const FALLBACK_NO_MATCH_SUMMARY =
  "Our AI assistant is unavailable right now, and we couldn't find a clear keyword match. Try browsing all services.";

/** Splits text into lowercase words: "Algebra-2 TEST!" -> ["algebra", "2", "test"] */
function wordsOf(text) {
  return String(text).toLowerCase().match(/[a-z0-9]+/g) || [];
}

function matchesKeyword(word, keyword) {
  return keyword.length <= SHORT_WORD_LENGTH ? word === keyword : word.startsWith(keyword);
}

/** The subjects whose keywords appear in the description, e.g. "honors science work" -> {science}. */
export function subjectsMentioned(need) {
  const words = [...new Set(wordsOf(need))];
  const subjects = new Set();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (words.some((word) => keywords.some((keyword) => matchesKeyword(word, keyword)))) {
      subjects.add(subject);
    }
  }
  return subjects;
}

/**
 * @param {string} need  the parent's description
 * @param {Array<{serviceId: string, name: string, subject: string, gradeBand: string}>} catalog
 *        the candidate services (already narrowed by grade, active only)
 * @returns {{ summary: string, recommendations: Array<{serviceId: string, reason: string}> }}
 */
export function recommendByKeywords(need, catalog) {
  const words = [...new Set(wordsOf(need))];

  const scored = catalog
    .map((service) => {
      const keywords = SUBJECT_KEYWORDS[service.subject] || [];
      const matchedWords = words.filter((word) =>
        keywords.some((keyword) => matchesKeyword(word, keyword)),
      );
      return { service, matchedWords };
    })
    .filter((entry) => entry.matchedWords.length > 0)
    .sort(
      (a, b) =>
        b.matchedWords.length - a.matchedWords.length || a.service.name.localeCompare(b.service.name),
    )
    .slice(0, MAX_RESULTS);

  return {
    summary: scored.length > 0 ? FALLBACK_SUMMARY : FALLBACK_NO_MATCH_SUMMARY,
    recommendations: scored.map(({ service, matchedWords }) => ({
      serviceId: service.serviceId,
      reason: `Matches: ${matchedWords.slice(0, 4).join(', ')}`,
    })),
  };
}
