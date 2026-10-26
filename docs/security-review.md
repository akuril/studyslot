# StudySlot — Security Review (Step 39)

Reviewed on 2026-10-21 against the code at this commit. Method:
- Read every route, middleware, controller, and service on the server.
- Scanned the client for dangerous browser APIs.
- Scanned the Git history and the production bundle for secrets.
- Ran `npm audit`.
- Sent attack-style requests to a running copy of the API in production mode.

Automated evidence: `npm test` (201 server tests, plus 73 client tests) and the Postman collection (54 requests, 102 assertions).

## Summary

| Result | Count |
|---|---|
| Checks passed | 37 |
| Issues found and fixed in this step | 2 |
| Accepted risks (documented, reasonable for a capstone) | 6 |
| Must be done at deployment | 4 |

## Fixed in this step

| # | Finding | Fix | Evidence |
|---|---|---|---|
| F1 | Only login, sign-up, and AI routes were rate-limited. A script could hammer bookings, students, or tutor routes. | Added a general per-IP limit for all `/api` routes: 500 requests / 15 minutes in production. `/api/health` is mounted first, so platform health checks are never limited. | `server/src/middleware/rateLimits.js` (`apiLimiter`), `server/src/app.js`; test in `tests/cors.test.js` |
| F2 | The web app had no security headers, and an inline script in `index.html` would have forced a weak Content-Security-Policy. | Moved the theme script to `client/public/theme-init.js`. Added `client/public/_headers` for Netlify: a strict CSP (`script-src 'self'`, `connect-src 'self' https://*.onrender.com`, `frame-ancestors 'none'`), plus `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, and `Permissions-Policy`. | Built app served with those headers: 0 CSP violations on `/`, `/services`, `/login`; theme still applied before the first paint |

## Checklist

### Secrets and configuration
| Check | Result |
|---|---|
| `.env` files ignored; only `.env.example` (placeholders) tracked | ✅ `git ls-files` shows only the two `.env.example` files |
| No real secrets anywhere in Git history | ✅ History search found only placeholders (`replace-with-provider-key`, `USERNAME:PASSWORD@CLUSTER-HOST`) |
| No secrets in the React bundle | ✅ Production build scanned for API keys, connection strings, and secret names; only `VITE_API_BASE_URL` is present |
| Server refuses to start with missing or weak config | ✅ `config/env.js`: `JWT_SECRET` must be at least 32 characters; production requires `CLIENT_ORIGIN` |
| Connection string credentials never logged | ✅ `config/db.js` redacts them |

### Authentication
| Check | Result |
|---|---|
| Passwords hashed with bcrypt (cost 12); never returned | ✅ `passwordHash` has `select: false` and is removed in `toJSON` |
| Password rules on the server (8–72 bytes, letter + number) | ✅ |
| Login doesn't reveal which emails exist; the timing is the same either way | ✅ Generic 401 plus a dummy bcrypt hash |
| JWT: HS256 only, `alg: none` refused, wrong-secret tokens refused | ✅ Live probes returned 401 for both |
| Brute force: 10 failed logins and 10 sign-ups per 15 min per IP in production | ✅ (200 only when `NODE_ENV=development`) |
| `trust proxy` is set only in production, so limits apply per visitor on Render | ✅ |

### Authorization
| Check | Result |
|---|---|
| Every protected route goes through `authenticate` | ✅ Applied with `router.use` on bookings, students, and tutor routes, and per route on AI |
| Account types enforced on the server (`requireRole`) | ✅ Parents get 403 on `/tutor/*`; tutors get 403 on parent booking routes and `/students` (tests in `roles.test.js`) |
| Ownership (IDOR): bookings, students, and tutor sessions are checked against the token's user | ✅ 403 for another parent's booking or student and for another tutor's session; 404 for unknown ids |
| Role can't be set at sign-up or changed later | ✅ `role` is rejected by `allowFields`; immutable in the model |
| Tutor accounts can't be self-created | ✅ Only `npm run seed:tutors` creates them |

### Input handling
| Check | Result |
|---|---|
| Unknown body fields rejected (mass assignment) | ✅ `allowFields` on every POST, PATCH, and DELETE route |
| NoSQL operator injection in the body (`{"$gt": ""}`) | ✅ 400, because `readString` requires real strings |
| Operator injection in the query (`?subject[$ne]=x`) | ✅ Express 5's simple parser keeps it as a literal key, so it is ignored |
| Arrays and duplicates in the query (`?subject=a&subject=b`) | ✅ 400 |
| Invalid ObjectIds | ✅ 400 from `validateIdParam`; CastError mapped to 400 |
| Body size limit | ✅ 10 KB, larger bodies return 413 |
| Malformed JSON | ✅ 400 `Request body must be valid JSON` |
| Server-controlled fields (owner, status, end time, prices, snapshot) never taken from requests | ✅ |

### Errors and logging
| Check | Result |
|---|---|
| No stack traces, provider errors, or database details sent to clients | ✅ Central `errorHandler` returns a generic 500 message |
| Request log has method, path, status, and time only (no bodies, queries, or tokens) | ✅ `requestLogger.js` |
| AI logs have no descriptions, notes, or user ids | ✅ Tested in `aiService.test.js` and `aiPrep.test.js` |

### HTTP and browser
| Check | Result |
|---|---|
| API security headers (Helmet), `X-Powered-By` removed | ✅ CSP, HSTS, nosniff, frame options, and referrer policy seen on live responses |
| CORS: exactly one allowed origin, no credentials | ✅ Another origin gets no matching `Access-Control-Allow-Origin` |
| XSS: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function` in the client | ✅ React escapes all user text (names, notes, summaries) |
| Web app security headers | ✅ Fixed (F2) |

### AI features
| Check | Result |
|---|---|
| API key only on the server | ✅ |
| Prompt injection: user text fenced as data, typed markers stripped, rules in the system prompt | ✅ |
| Model output never trusted: service ids checked against the catalog; names and subjects come from MongoDB; tips trimmed and capped | ✅ |
| Least data sent: no names, emails, or ids; the student's first name is removed from notes | ✅ |
| Cost and abuse: login required; 5/min and 20/day per user, shared by both AI features | ✅ |
| Provider failure doesn't break the app (fallback, 200) | ✅ |

### Dependencies
| Check | Result |
|---|---|
| `npm audit` (server) | ✅ 0 vulnerabilities |
| `npm audit` (client) | ✅ 0 vulnerabilities (2026-10-26, after updating a `zod` dev-tool dependency with `npm audit fix`) |

## Accepted risks (known limitations)

1. **Token in `localStorage`.** Any successful XSS could read it. Mitigated by React escaping, no dangerous APIs, and the strict CSP (F2). The alternative (httpOnly cookies) adds CSRF handling; out of scope.
2. **No token revocation.** Logging out deletes the token in the browser, but a copied token stays valid until it expires (`JWT_EXPIRES_IN`, 1 day).
3. **Sign-up reveals that an email is registered (409).** This is a usability trade-off; sign-up is rate-limited.
4. **Shared demo password for tutor accounts** (`TUTOR_SEED_PASSWORD`), with no password-change or reset feature. Fine for fictional demo tutors only; never use real people.
5. **Rate limits are in memory.** They reset on restart and aren't shared between instances. Fine for one Render instance.
6. **Free AI provider data policy.** Descriptions and notes go to the AI provider. Mitigated by Groq Zero Data Retention, minimal data, name redaction, and on-screen "no personal details" notes.

## Must be done at deployment

1. Render: `NODE_ENV=production`. This turns on strict auth limits and `trust proxy`, and requires `CLIENT_ORIGIN`.
2. Render: a new, random `JWT_SECRET` of at least 32 characters (never reuse the local one), the Atlas URI for a least-privilege user, and the AI key.
3. `CLIENT_ORIGIN` = the exact Netlify URL (https, no trailing slash).
4. Atlas Network Access: allow Render's outbound connections. Keep the database user to `readWrite` on `appointment_platform` only.
