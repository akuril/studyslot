// Automated tests for the API foundation (Step 15).
// Run from the server folder:  npm test
//
// No database and no .env needed: fake settings are set below, and Express is
// started on a random free port. Uses only Node's built-in test runner and fetch.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';

// Fake configuration BEFORE the app (and env.js) is loaded. Never real secrets.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { ApiError } = await import('../src/utils/ApiError.js');
const { FieldErrors, readString, readInteger, validateIdParam, allowFields } =
  await import('../src/utils/validation.js');
const { errorHandler } = await import('../src/middleware/errorHandler.js');

// A tiny app with test-only routes that use the shared helpers the same way real routes will.
const helperApp = express();
helperApp.use(express.json({ limit: '10kb' }));
helperApp.get('/items/:id', validateIdParam(), (req, res) => res.json({ id: req.params.id }));
helperApp.post('/items', allowFields(['name', 'grade']), (req, res) => {
  const errors = new FieldErrors();
  const name = readString(req.body, 'name', errors, { label: 'Name', min: 2, max: 10 });
  const grade = readInteger(req.body, 'grade', errors, { label: 'Grade', min: 6, max: 12 });
  errors.throwIfAny();
  res.status(201).json({ name, grade });
});
helperApp.post('/empty-action', allowFields([]), (req, res) => res.json({ ok: true }));
helperApp.get('/async-not-found', async () => {
  await Promise.resolve();
  throw ApiError.notFound('Thing not found'); // Express 5 catches async errors by itself
});
helperApp.get('/mongoose-validation', async () => {
  const Temp =
    mongoose.models.Temp ||
    mongoose.model(
      'Temp',
      new mongoose.Schema({ title: { type: String, required: [true, 'Title is required'] } }),
    );
  await new Temp({}).validate();
});
helperApp.get('/cast-error', async () => {
  throw new mongoose.Error.CastError('ObjectId', 'abc', 'service');
});
helperApp.get('/duplicate', async () => {
  throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
});
helperApp.get('/crash', async () => {
  throw new Error('secret internal detail: db password is hunter2');
});
helperApp.use(errorHandler);

let mainServer;
let helperServer;
let mainUrl;
let helperUrl;

function listen(expressApp) {
  return new Promise((resolve) => {
    const server = expressApp.listen(0, () => resolve(server));
  });
}

before(async () => {
  mainServer = await listen(app);
  helperServer = await listen(helperApp);
  mainUrl = `http://127.0.0.1:${mainServer.address().port}`;
  helperUrl = `http://127.0.0.1:${helperServer.address().port}`;
});

after(() => {
  mainServer.close();
  helperServer.close();
});

async function request(base, path, options = {}) {
  const response = await fetch(base + path, options);
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: text ? JSON.parse(text) : null,
  };
}

const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

// ===== Real app =====

test('health reports 503 + "disconnected" when the database is not connected', async () => {
  const res = await request(mainUrl, '/api/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.database, 'disconnected');
});

test('unknown route returns 404 JSON', async () => {
  const res = await request(mainUrl, '/api/nope');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Route not found: GET /api/nope' });
});

test('malformed JSON returns 400', async () => {
  const res = await request(mainUrl, '/api/health', json('{"bad":'));
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'Request body must be valid JSON' });
});

test('body over 10 KB returns 413', async () => {
  const res = await request(mainUrl, '/api/health', json({ text: 'x'.repeat(11000) }));
  assert.equal(res.status, 413);
});

test('security headers are set and X-Powered-By is hidden', async () => {
  const res = await request(mainUrl, '/api/nope');
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-powered-by'), null);
});

// ===== Shared helpers =====

test('invalid id returns 400 with field "id"', async () => {
  const res = await request(helperUrl, '/items/not-an-id');
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, {
    error: 'Validation failed',
    details: [{ field: 'id', message: 'Invalid id' }],
  });
});

test('12-character string is NOT accepted as an id', async () => {
  const res = await request(helperUrl, '/items/abcdefghijkl');
  assert.equal(res.status, 400);
});

test('valid 24-hex id passes', async () => {
  const res = await request(helperUrl, '/items/665f0c1a2b3c4d5e6f7080a1');
  assert.equal(res.status, 200);
});

test('missing required fields are all reported at once', async () => {
  const res = await request(helperUrl, '/items', json({}));
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.details, [
    { field: 'name', message: 'Name is required' },
    { field: 'grade', message: 'Grade is required' },
  ]);
});

test('strings are trimmed and length-checked; integers are range-checked', async () => {
  const ok = await request(helperUrl, '/items', json({ name: '  Sam  ', grade: '7' }));
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.body, { name: 'Sam', grade: 7 });

  const bad = await request(helperUrl, '/items', json({ name: 'S', grade: 7.5 }));
  assert.equal(bad.status, 400);
  assert.deepEqual(
    bad.body.details.map((detail) => detail.field),
    ['name', 'grade'],
  );
});

test('wrong types are rejected (number for text, boolean for integer)', async () => {
  const res = await request(helperUrl, '/items', json({ name: 12345, grade: true }));
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.details, [
    { field: 'name', message: 'Name must be text' },
    { field: 'grade', message: 'Grade must be a whole number' },
  ]);
});

test('unknown body fields are rejected (mass-assignment protection)', async () => {
  const res = await request(
    helperUrl,
    '/items',
    json({ name: 'Sam', grade: 7, status: 'cancelled', user: 'x' }),
  );
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.details, [
    { field: 'status', message: 'This field is not allowed' },
    { field: 'user', message: 'This field is not allowed' },
  ]);
});

test('a JSON array body is rejected', async () => {
  const res = await request(helperUrl, '/items', json([1, 2, 3]));
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'Request body must be a JSON object' });
});

test('a body sent without Content-Type: application/json gets a clear message', async () => {
  const res = await request(helperUrl, '/items', {
    method: 'POST',
    body: '{"name":"Sam"}',
    headers: { 'Content-Type': 'text/plain' },
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Content-Type: application\/json/);
});

test('an action route with no body is accepted', async () => {
  const res = await request(helperUrl, '/empty-action', { method: 'POST' });
  assert.equal(res.status, 200);
});

// ===== Central error handler =====

test('errors thrown in async handlers are caught (Express 5)', async () => {
  const res = await request(helperUrl, '/async-not-found');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Thing not found' });
});

test('Mongoose ValidationError becomes 400 with details', async () => {
  const res = await request(helperUrl, '/mongoose-validation');
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, {
    error: 'Validation failed',
    details: [{ field: 'title', message: 'Title is required' }],
  });
});

test('Mongoose CastError becomes 400', async () => {
  const res = await request(helperUrl, '/cast-error');
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].field, 'service');
});

test('duplicate key (11000) becomes 409', async () => {
  const res = await request(helperUrl, '/duplicate');
  assert.equal(res.status, 409);
});

test('unexpected errors return a generic 500 without leaking details', async (t) => {
  t.mock.method(console, 'error', () => {}); // keep the test output clean
  const res = await request(helperUrl, '/crash');
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: 'Something went wrong. Please try again.' });
  assert.ok(!JSON.stringify(res.body).includes('hunter2'));
});
