// CORS tests (Step 22): only the React app's origin may call the API from a browser.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const { default: app } = await import('../src/app.js');

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('the React origin is allowed', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('any other origin gets no CORS permission (the browser will block it)', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://evil.example.com' },
  });
  assert.notEqual(response.headers.get('access-control-allow-origin'), 'https://evil.example.com');
  assert.notEqual(response.headers.get('access-control-allow-origin'), '*');
});

test('preflight allows JSON + Authorization for the approved methods', async () => {
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-methods'), 'GET,POST,PATCH');
  assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type,Authorization');
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});
