// "Session prep tips": 3-5 short, practical tips for getting the most out of ONE
// booked session (what to bring, what to review), for the parent and student.
//
// These are BUILT-IN tips chosen by the service's subject. They do not call an AI
// model: the tips for a subject are always the same, so asking a model each time only
// spent tokens (and the account's daily AI allowance). The file keeps its name so
// imports and docs stay valid.

export const MAX_TIPS = 5;
export const PREP_DISCLAIMER =
  'Tips are general suggestions. Your tutor will tailor the session to your student.';

// Two subject tips + three general ones.
const SUBJECT_TIPS = {
  math: [
    'Bring the homework or practice problems that felt hardest this week.',
    'Write down one or two specific steps that get confusing, so the tutor can start there.',
  ],
  science: [
    'Bring class notes, the current lab handout, or a diagram that is hard to understand.',
    'Note any vocabulary words from the unit that are confusing.',
  ],
  english: [
    'Bring the current reading or a draft of the writing assignment, even if it is unfinished.',
    "Have the teacher's instructions or rubric handy so the tutor can see what is expected.",
  ],
  'social-studies': [
    'Bring the current chapter, notes, or study guide for the unit.',
    'Note any dates, people, or ideas that keep getting mixed up.',
  ],
  'world-languages': [
    'Bring the current vocabulary list and any recent quizzes.',
    'Be ready to practice speaking out loud; mistakes are part of learning.',
  ],
  'computer-science': [
    'Have the laptop charged and the code or project open before the session starts.',
    'Write down the error message or the part of the program that does not work yet.',
  ],
  'study-skills': [
    "Bring the student's planner, calendar, or list of upcoming assignments.",
    'Think about which part of studying feels hardest right now: starting, focusing, or remembering.',
  ],
  'test-prep': [
    'Bring a recent practice test or score report so the tutor can focus on weak areas.',
    'Have a calculator and a couple of sharpened pencils ready.',
  ],
  'homework-help': [
    "Bring tonight's assignments and the instructions for each one.",
    'Start with the assignment that is due first or feels the most confusing.',
  ],
};
const GENERAL_TIPS = [
  'Find a quiet spot with good light and a charged device a few minutes before the session.',
  'Write down 2 or 3 questions to ask, so nothing gets forgotten.',
  'Keep a notebook handy to jot down what the tutor explains.',
];

export function prepTipsFor(subject) {
  return [...(SUBJECT_TIPS[subject] || []), ...GENERAL_TIPS].slice(0, MAX_TIPS);
}

/**
 * @param {{ subject: string }} session
 * @returns {{ tips: string[], disclaimer: string }}
 */
export function getSessionPrepTips(session) {
  return { tips: prepTipsFor(session.subject), disclaimer: PREP_DISCLAIMER };
}
