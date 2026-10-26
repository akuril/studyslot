// Unit tests for the session-prep tips (built-in, no AI call), plus the tutor-wide
// overlap rule. No database and no internet.

import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { getSessionPrepTips, prepTipsFor, MAX_TIPS, PREP_DISCLAIMER } = await import(
  '../src/services/aiPrepService.js'
);
const { findServiceIdsSharingTutor } = await import('../src/services/bookingRules.js');
const { Service } = await import('../src/models/Service.js');

afterEach(() => mock.restoreAll());

test('prep tips are the same built-in tips every time, with no source field', () => {
  const first = getSessionPrepTips({ subject: 'math' });
  const second = getSessionPrepTips({ subject: 'math' });
  assert.deepEqual(first, second);
  assert.deepEqual(first.tips, prepTipsFor('math'));
  assert.equal(first.disclaimer, PREP_DISCLAIMER);
  assert.equal('source' in first, false);
});

test('every subject (and an unknown one) gets 3 to 5 tips; math gets 5', () => {
  const subjects = [
    'math',
    'science',
    'english',
    'social-studies',
    'world-languages',
    'computer-science',
    'study-skills',
    'test-prep',
    'homework-help',
    'unknown-subject',
  ];
  for (const subject of subjects) {
    const tips = prepTipsFor(subject);
    assert.ok(tips.length >= 3 && tips.length <= MAX_TIPS, subject);
    assert.equal(new Set(tips).size, tips.length, `${subject}: no duplicate tips`);
    for (const tip of tips) assert.ok(tip.length <= 160, `${subject}: tip too long`);
  }
  assert.equal(prepTipsFor('math').length, 5);
});

test('the prep service never imports the AI client', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/services/aiPrepService.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /aiClient|requestChatCompletion|config\.ai/);
});

// ===== Tutor-wide overlap =====

test('overlap checks every service taught by the same tutor', async () => {
  const tutorId = '64b000000000000000000001';
  mock.method(Service, 'find', (query) => ({
    select: async () => {
      assert.deepEqual(query, { tutor: tutorId });
      return [{ _id: 'a' }, { _id: 'b' }];
    },
  }));
  assert.deepEqual(await findServiceIdsSharingTutor({ _id: 'a', tutor: tutorId }), ['a', 'b']);
  // No linked tutor account: only the service itself.
  assert.deepEqual(await findServiceIdsSharingTutor({ _id: 'z', tutor: null }), ['z']);
});
