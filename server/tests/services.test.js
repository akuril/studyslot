// Automated tests for the Service API (Step 16).
// Run from the server folder:  npm test
//
// No database: the Service model's find/findOne are replaced ("mocked") with fakes,
// so we can check exactly which filter each request sends to MongoDB.

import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { Service } = await import('../src/models/Service.js');

const sampleServices = [
  new Service({
    name: 'Middle School Math Boost',
    subject: 'math',
    gradeBand: '6-8',
    summary: 'Math help.',
    description: 'Math help for grades 6-8.',
    tutorName: 'Ms. Avery Lane',
    durationMinutes: 60,
    priceCents: 4500,
  }),
  new Service({
    name: 'Homework Help Hour',
    subject: 'homework-help',
    gradeBand: '6-12',
    summary: 'Homework help.',
    description: 'Homework help for grades 6-12.',
    tutorName: 'Ms. Dana Okoro',
    durationMinutes: 30,
    priceCents: 2500,
  }),
];

let server;
let baseUrl;
let lastFilter;
let lastSort;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());
afterEach(() => mock.restoreAll());

// Fake Service.find(filter).sort(order): records the filter and returns the samples.
function mockFind(results = sampleServices) {
  mock.method(Service, 'find', (filter) => {
    lastFilter = filter;
    return {
      sort: async (order) => {
        lastSort = order;
        return results;
      },
    };
  });
}

async function get(path) {
  const response = await fetch(baseUrl + path);
  return { status: response.status, body: await response.json() };
}

// ===== GET /api/services =====

test('lists active services sorted by subject then name', async () => {
  mockFind();
  const res = await get('/api/services');
  assert.equal(res.status, 200);
  assert.deepEqual(lastFilter, { isActive: true });
  assert.deepEqual(lastSort, { subject: 1, name: 1 });
  assert.equal(res.body.length, 2);
});

test('response uses the public shape (id, no _id, __v, isActive, timestamps)', async () => {
  mockFind();
  const res = await get('/api/services');
  const service = res.body[0];
  assert.equal(typeof service.id, 'string');
  for (const hidden of ['_id', '__v', 'isActive', 'createdAt', 'updatedAt']) {
    assert.ok(!(hidden in service), `${hidden} should be hidden`);
  }
  assert.deepEqual(Object.keys(service).sort(), [
    'description',
    'durationMinutes',
    'gradeBand',
    'id',
    'name',
    'priceCents',
    'subject',
    'summary',
    'tutorName',
  ]);
});

test('subject filter is applied', async () => {
  mockFind();
  const res = await get('/api/services?subject=social-studies');
  assert.equal(res.status, 200);
  assert.deepEqual(lastFilter, { isActive: true, subject: 'social-studies' });
});

test('grade 7 matches the 6-8 and 6-12 bands', async () => {
  mockFind();
  await get('/api/services?grade=7');
  assert.deepEqual(lastFilter, { isActive: true, gradeBand: { $in: ['6-8', '6-12'] } });
});

test('grade 10 matches the 9-12 and 6-12 bands, combined with subject', async () => {
  mockFind();
  await get('/api/services?grade=10&subject=math');
  assert.deepEqual(lastFilter, {
    isActive: true,
    subject: 'math',
    gradeBand: { $in: ['9-12', '6-12'] },
  });
});

test('no matches returns 200 with an empty array', async () => {
  mockFind([]);
  const res = await get('/api/services?subject=test-prep&grade=6');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test('unknown query parameters are ignored', async () => {
  mockFind();
  const res = await get('/api/services?sort=price&page=2');
  assert.equal(res.status, 200);
  assert.deepEqual(lastFilter, { isActive: true });
});

test('invalid subject returns 400 and never queries the database', async () => {
  mockFind();
  lastFilter = 'not called';
  const res = await get('/api/services?subject=cooking');
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].field, 'subject');
  assert.equal(lastFilter, 'not called');
});

test('grade outside 6-12 or not a whole number returns 400', async () => {
  mockFind();
  for (const grade of ['5', '13', '7.5', 'abc']) {
    const res = await get(`/api/services?grade=${grade}`);
    assert.equal(res.status, 400, `grade=${grade}`);
    assert.equal(res.body.details[0].field, 'grade');
  }
});

test('operator injection (?subject[$ne]=math) never reaches MongoDB', async () => {
  // Express 5's default "simple" query parser does not build nested objects, so
  // "subject[$ne]" arrives as a harmless literal key that we ignore.
  mockFind();
  const res = await get('/api/services?subject[$ne]=math');
  assert.equal(res.status, 200);
  assert.deepEqual(lastFilter, { isActive: true });
  assert.ok(!JSON.stringify(lastFilter).includes('$ne'));
});

test('repeated parameters (arrays) are rejected', async () => {
  mockFind();
  for (const query of ['subject=math&subject=science', 'grade=7&grade=8']) {
    const res = await get(`/api/services?${query}`);
    assert.equal(res.status, 400, query);
  }
});

// ===== GET /api/services/:id =====

test('returns one active service by id', async () => {
  let lastQuery;
  mock.method(Service, 'findOne', async (query) => {
    lastQuery = query;
    return sampleServices[0];
  });
  const id = '665f0c1a2b3c4d5e6f7080a1';
  const res = await get(`/api/services/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Middle School Math Boost');
  assert.deepEqual(lastQuery, { _id: id, isActive: true });
});

test('unknown or inactive service returns 404', async () => {
  mock.method(Service, 'findOne', async () => null);
  const res = await get('/api/services/665f0c1a2b3c4d5e6f7080a1');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Service not found' });
});

test('malformed id returns 400 without querying', async () => {
  let called = false;
  mock.method(Service, 'findOne', async () => {
    called = true;
    return null;
  });
  const res = await get('/api/services/not-an-id');
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].field, 'id');
  assert.equal(called, false);
});

test('services are read-only: POST/PATCH/DELETE return 404', async () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    const response = await fetch(`${baseUrl}/api/services/665f0c1a2b3c4d5e6f7080a1`, { method });
    assert.equal(response.status, 404, method);
  }
});
