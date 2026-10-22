// HTTP tests for POST /api/ai/recommend-service (Step 31).
// Kept in their own file: the per-user limits keep counts in memory, and Node runs
// each test file in a separate process, so the counts start fresh here.
//
// No database and no AI: the database is mocked, and AI_API_KEY is left empty, so the
// service always uses its keyword fallback (predictable answers, no internet needed).
// The AI path itself is covered by aiService.test.js.

import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.AI_API_KEY = '';
process.env.AI_MODEL = '';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Service } = await import('../src/models/Service.js');
const { signToken } = await import('../src/services/authService.js');
const { AI_LIMITS } = await import('../src/middleware/rateLimits.js');

const parentA = new User({ name: 'Jordan Rivera', email: 'jordan@example.com', passwordHash: 'x' });
const parentB = new User({ name: 'Bob Parent', email: 'bob@example.com', passwordHash: 'x' });
const parentC = new User({ name: 'Casey Lee', email: 'casey@example.com', passwordHash: 'x' });
const users = [parentA, parentB, parentC];

const mathService = new Service({
  name: 'Middle School Math Boost',
  subject: 'math',
  gradeBand: '6-8',
  summary: 'Fractions, ratios, equations.',
  description: 'Math help for grades 6-8.',
  tutorName: 'Ms. Avery Lane',
  durationMinutes: 60,
  priceCents: 4500,
});

let server;
let baseUrl;
let catalogFilters;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
afterEach(() => mock.restoreAll());

function mockDatabase() {
  catalogFilters = [];
  mock.method(User, 'findById', async (id) => users.find((user) => String(user._id) === id) || null);
  // aiService calls Service.find(filter).sort(...)
  mock.method(Service, 'find', (filter) => {
    catalogFilters.push(filter);
    return { sort: async () => [mathService] };
  });
}

function recommend(body, { user = parentA, token, rawBody, contentType } = {}) {
  const headers = { 'Content-Type': contentType || 'application/json' };
  const authToken = token === undefined ? signToken(user._id) : token;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return fetch(`${baseUrl}/api/ai/recommend-service`, {
    method: 'POST',
    headers,
    body: rawBody ?? JSON.stringify(body),
  });
}

// ----- these tests use parentA (each counts toward A's limit only when it succeeds) -----

test('200: returns suggestions with service details from the database', async () => {
  mockDatabase();
  const response = await recommend({ need: 'My 7th grader struggles with fractions', grade: 7 });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.source, 'fallback'); // no AI key in tests
  assert.equal(typeof body.summary, 'string');
  assert.equal(typeof body.disclaimer, 'string');
  assert.deepEqual(body.recommendations, [
    {
      serviceId: String(mathService._id),
      name: 'Middle School Math Boost',
      subject: 'math',
      gradeBand: '6-8',
      reason: 'Matches: fractions',
    },
  ]);
  // The grade narrowed the catalog, and only active services were considered.
  assert.deepEqual(catalogFilters[0], { isActive: true, gradeBand: { $in: ['6-8', '6-12'] } });
});

test('200: grade is optional, and "8" as text is accepted', async () => {
  mockDatabase();
  const withoutGrade = await recommend({ need: 'algebra help' });
  assert.equal(withoutGrade.status, 200);
  assert.deepEqual(catalogFilters[0], { isActive: true });

  const textGrade = await recommend({ need: 'algebra help', grade: '8' });
  assert.equal(textGrade.status, 200);
});

test('200: no keyword match returns an empty list with a helpful summary (not an error)', async () => {
  mockDatabase();
  const response = await recommend({ need: 'xyz' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.recommendations, []);
  assert.match(body.summary, /browsing all services/);
});

test('401: not logged in, or a bad token', async () => {
  mockDatabase();
  const noToken = await recommend({ need: 'math' }, { token: null });
  assert.equal(noToken.status, 401);
  assert.deepEqual(await noToken.json(), { error: 'Authentication required' });

  const badToken = await recommend({ need: 'math' }, { token: 'not-a-real-token' });
  assert.equal(badToken.status, 401);
  assert.equal(catalogFilters.length, 0, 'the catalog is never loaded for anonymous requests');
});

const invalidBodies = [
  ['missing need', {}, 'need', 'Description is required'],
  ['empty need', { need: '' }, 'need', 'Description is required'],
  ['only spaces and line breaks', { need: '   \n\t  ' }, 'need', 'Description is required'],
  ['need is not text', { need: 42 }, 'need', 'Description must be text'],
  ['need is an object', { need: { $ne: '' } }, 'need', 'Description must be text'],
  ['need too long', { need: 'a'.repeat(501) }, 'need', 'Description must be at most 500 characters'],
  ['grade too low', { need: 'math', grade: 5 }, 'grade', 'Grade must be between 6 and 12'],
  ['grade too high', { need: 'math', grade: 13 }, 'grade', 'Grade must be between 6 and 12'],
  ['grade not whole', { need: 'math', grade: 7.5 }, 'grade', 'Grade must be a whole number'],
  ['grade is a word', { need: 'math', grade: 'seven' }, 'grade', 'Grade must be a whole number'],
  ['unknown field', { need: 'math', userId: 'x' }, 'userId', 'This field is not allowed'],
];

for (const [name, body, field, message] of invalidBodies) {
  test(`400: ${name}`, async () => {
    mockDatabase();
    const response = await recommend(body);
    assert.equal(response.status, 400);
    const json = await response.json();
    assert.equal(json.error, 'Validation failed');
    assert.deepEqual(json.details, [{ field, message }]);
    assert.equal(catalogFilters.length, 0, 'nothing is sent to the AI for invalid input');
  });
}

test('400: body that is not JSON', async () => {
  mockDatabase();
  const response = await recommend(null, { rawBody: 'need=math', contentType: 'text/plain' });
  assert.equal(response.status, 400);
});

test('extra spaces and line breaks are cleaned before the length check', async () => {
  mockDatabase();
  // 498 letters plus lots of whitespace: after cleaning it is under 500, so it's allowed.
  const need = `  ${'a'.repeat(249)}\n\n\n${' '.repeat(300)}${'b'.repeat(249)}  `;
  const response = await recommend({ need });
  assert.equal(response.status, 200);
});

// ----- rate limits: parentB and parentC start with fresh counts -----

test(`429: the ${AI_LIMITS.perMinute + 1}th request in a minute, per user`, async () => {
  mockDatabase();
  assert.deepEqual(AI_LIMITS, { perMinute: 5, perDay: 20 });

  // Invalid requests don't use up the allowance.
  for (let i = 0; i < 3; i += 1) {
    assert.equal((await recommend({}, { user: parentB })).status, 400);
  }
  for (let i = 1; i <= AI_LIMITS.perMinute; i += 1) {
    const ok = await recommend({ need: 'math' }, { user: parentB });
    assert.equal(ok.status, 200, `request ${i}`);
  }

  const blocked = await recommend({ need: 'math' }, { user: parentB });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: "You've reached the suggestion limit. Please try again later.",
  });
  assert.ok(blocked.headers.get('ratelimit'), 'standard RateLimit header is sent');

  // A different parent is not affected by B's limit.
  const otherParent = await recommend({ need: 'math' }, { user: parentC });
  assert.equal(otherParent.status, 200);
});
