# StudySlot — Local End-to-End Checklist (Step 26)

Setup:
- API on http://localhost:5000 (`npm run dev` in `server`)
- React on http://localhost:5173 (`npm run dev` in `client`)
- Database: MongoDB Atlas, `appointment_platform`

Open Chrome DevTools (F12): **Network** tab with "Preserve log" ticked, plus the **Console** tab.

Fill in **Actual** and **Pass/Fail** as you go. Take screenshots of rows marked 📸 for the SDLC document.

| # | Action | Network: method, URL, status | Check in the request / response | Actual | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Open http://localhost:5173 | none (static page) | Console: no red errors | | |
| 2 | Services page | `GET /api/services` → **200** | Response is an array of 13. Response headers include `Access-Control-Allow-Origin: http://localhost:5173` | | |
| 3 | Filter Grade 7 | `GET /api/services?grade=7` → **200** | 8 results; the URL shows `?grade=7` | | |
| 4 | Register a new parent 📸 | `POST /api/auth/register` → **201** | Payload has only `name`, `email`, `password` (no `confirmPassword`). Response has `token` and `user` with **no** `passwordHash` | | |
| 5 | Log out, then log in | `POST /api/auth/login` → **200** | Response `{ token, user }` | | |
| 6 | Refresh the page | `GET /api/auth/me` → **200** | Request headers include `Authorization: Bearer eyJ…`. Still logged in. | | |
| 7 | Open a service → Book | `GET /api/services/:id` → **200** | Preflight: an **OPTIONS** row may appear before authenticated calls (status **204**) | | |
| 8 | Book a session 📸 | `POST /api/bookings` → **201** | Payload has only `serviceId`, `studentFirstName`, `studentGrade`, `startTime` (ISO with `Z`), `notes`. Response `status: "confirmed"`, `endTime` = start + duration | | |
| 9 | Dashboard 📸 | `GET /api/bookings/mine` → **200** | The new booking appears under Upcoming | | |
| 10 | Reschedule | `PATCH /api/bookings/:id` → **200** | Payload has only `startTime` (and `notes` if changed). Response `rescheduleCount: 1` | | |
| 11 | Cancel 📸 | `POST /api/bookings/:id/cancel` → **200** | No payload. Response `status: "cancelled"`, `cancelledAt` set | | |
| 12 | Log out | none | Local Storage `studyslot-token` removed. Navbar shows Log in. | | |
| 13 | Server terminal | n/a | One line per request (e.g. `POST /api/bookings 201 45ms`). **No** `Unhandled error` lines and **no** 500s | | |
| 14 | Compass | n/a | `users`: new parent with a `$2b$12$…` hash. `bookings`: one booking, cancelled, `rescheduleCount: 1` | | |

## CORS checks

| # | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|
| C1 | Network → any API row → Headers → Response Headers | `Access-Control-Allow-Origin: http://localhost:5173` (never `*`) | | |
| C2 | Network → the OPTIONS (preflight) row before a POST/PATCH | `Access-Control-Allow-Methods: GET,POST,PATCH` and `Access-Control-Allow-Headers: Content-Type,Authorization` | | |
| C3 | Temporarily set `CLIENT_ORIGIN=http://localhost:9999` in `server/.env`, restart the API, reload Services | The page shows "Can't reach the StudySlot server"; the Console shows a red **CORS policy** error. Restore the value and restart. | | |

## Expected (harmless) Console messages

- "Download the React DevTools…" (an informational development-only notice)
- Red `Failed to load resource: 404/400/401/409` lines **only** when you deliberately test a failure. That's the browser logging the HTTP status; the app handles it.

Anything else in red is a bug: copy the message and report it.
