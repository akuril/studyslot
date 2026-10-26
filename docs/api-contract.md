# StudySlot — REST API Contract

Base URL: `http://localhost:5000/api` (development) · `https://SERVICE-NAME.onrender.com/api` (production)

## Conventions

- **JSON in, JSON out.** Requests with a body send `Content-Type: application/json`.
- **Authentication:** `Authorization: Bearer <token>` header. The token comes from register or login.
- **No response envelope.** A single resource is returned as an object, a list as an array.
- **Ids** are returned as `id` (string). Dates are ISO 8601 UTC strings, for example `"2026-10-27T20:00:00.000Z"`.
- **Unknown body fields are rejected** with 400, listing the field names. This makes mass-assignment attempts (`user`, `status`, `role`, `serviceSnapshot`) visible and testable.
- **Unknown query parameters are ignored.**

### Error format (every error)

```json
{
  "error": "Validation failed",
  "details": [{ "field": "email", "message": "Email is required" }]
}
```

`details` appears only for field-level problems.

| Status | When |
|---|---|
| 400 | Malformed JSON, validation failure, unknown body field, malformed id |
| 401 | Missing, malformed, or expired token; wrong email or password |
| 403 | Logged in, but the booking belongs to someone else |
| 404 | Resource does not exist (or the service is inactive); unknown route |
| 409 | Duplicate email; time slot already taken; booking already cancelled or no longer changeable |
| 413 | Request body over 10 KB |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (generic message only) |
| 503 | Database unavailable (health route) |

### Shared shapes

**User**
```json
{ "id": "665f...", "name": "Jordan Rivera", "email": "jordan.rivera@example.com", "createdAt": "2026-10-20T01:00:00.000Z" }
```

**Service**
```json
{
  "id": "665f...",
  "name": "Middle School Math Boost",
  "subject": "math",
  "gradeBand": "6-8",
  "summary": "...",
  "description": "...",
  "tutorName": "Ms. Avery Lane",
  "durationMinutes": 60,
  "priceCents": 4500
}
```

**Booking**
```json
{
  "id": "665f...",
  "serviceId": "665f...",
  "serviceSnapshot": { "name": "Middle School Math Boost", "tutorName": "Ms. Avery Lane", "durationMinutes": 60, "priceCents": 4500 },
  "studentFirstName": "Sam",
  "studentGrade": 7,
  "startTime": "2026-10-27T20:00:00.000Z",
  "endTime": "2026-10-27T21:00:00.000Z",
  "originalStartTime": "2026-10-27T20:00:00.000Z",
  "notes": "",
  "status": "confirmed",
  "cancelledAt": null,
  "rescheduleCount": 0,
  "lastRescheduledAt": null,
  "createdAt": "2026-10-20T01:05:00.000Z",
  "updatedAt": "2026-10-20T01:05:00.000Z"
}
```

## Endpoints

| Method | Path | Purpose | Auth | Success |
|---|---|---|---|---|
| GET | /health | API and database status | No | 200 / 503 |
| POST | /auth/register | Create a parent account | No (rate-limited) | 201 `{ token, user }` |
| POST | /auth/login | Log in | No (rate-limited) | 200 `{ token, user }` |
| GET | /auth/me | Current user (restore session) | Yes | 200 `{ user }` |
| PATCH | /auth/me | Change my name (tutors: and bio) | Yes | 200 `{ user }` |
| POST | /auth/change-password | Change my password | Yes (failed attempts rate-limited) | 200 `{ message }` |
| GET | /auth/me/summary | Counts for the account page | Yes | 200 summary |
| GET | /services | List active services (filterable) | No | 200 `Service[]` |
| GET | /services/:id | One active service | No | 200 `Service` |
| POST | /bookings | Create a booking | Yes | 201 `Booking` |
| GET | /bookings/mine | My bookings | Yes | 200 `Booking[]` |
| GET | /bookings/:id | One of my bookings | Yes, owner | 200 `Booking` |
| PATCH | /bookings/:id | Reschedule and/or edit notes | Yes, owner | 200 `Booking` |
| POST | /bookings/:id/cancel | Cancel (status → cancelled) | Yes, owner | 200 `Booking` |
| POST | /ai/recommend-service | AI service recommendation | Yes (rate-limited) | 200 recommendation |
| POST | /ai/session-prep | Built-in prep tips for one confirmed session (no AI call) | Yes, booking's parent or tutor | 200 `{ tips, disclaimer }` |
| GET | /students | My saved students (A–Z) | Yes, parent | 200 `Student[]` |
| POST | /students | Save a student `{ firstName, grade }` | Yes, parent | 201 `Student` |
| PATCH | /students/:id | Rename / change grade | Yes, parent, owner | 200 `Student` |
| DELETE | /students/:id | Remove a saved student | Yes, parent, owner | 204 |
| GET | /tutor/sessions | Every booking for my services | Yes, tutor | 200 `Booking[]` |
| POST | /tutor/sessions/:id/complete | Mark a started session completed `{ summary? }` | Yes, tutor of that service | 200 `Booking` |

There are no service create/update/delete endpoints, because there is no admin role. Services come from the seed script.

**Logout** has no endpoint. Tokens are stateless, so the client deletes its token. Known limitation: a copied token stays valid until it expires (`JWT_EXPIRES_IN`, 1 day).

### POST /auth/register

- **Body:** `{ "name": string, "email": string, "password": string }`
- **Rules:**
  - name: trimmed, 2–60 characters
  - email: trimmed, lowercased, valid, ≤254 characters
  - password: 8–72 characters with at least one letter and one number (72 is bcrypt's input limit)
- **201:** `{ "token": "<jwt>", "user": User }`
- **400:** validation `details`, or an unknown field (for example `role`)
- **409:** `{ "error": "An account with this email already exists" }`
- **429:** too many attempts

### POST /auth/login

- **Body:** `{ "email": string, "password": string }`
- **200:** `{ "token": "<jwt>", "user": User }`
- **400:** missing fields
- **401:** `{ "error": "Invalid email or password" }`. Identical whether the email or the password is wrong.
- **429:** too many attempts

### GET /auth/me

- **Header:** `Authorization: Bearer <token>`
- **200:** `{ "user": User }`
- **401:** missing, malformed, or expired token, or the user no longer exists. `{ "error": "Authentication required" }` or `{ "error": "Session expired. Please log in again." }`

### PATCH /auth/me

- **Body:** `{ "name"?: string, "bio"?: string }`. At least one field. Only these two can be sent; `email`, `role`, and anything else return 400 (`This field is not allowed`).
- `name`: 2–60 characters, trimmed. `bio`: tutors only, up to 300 characters; an empty string clears it. A parent sending `bio` gets 400 (`Only tutors can add a bio`).
- The account changed is always the one in the login token.
- **200:** `{ "user": User }` (`bio` appears only for tutors)
- **400:** validation errors with `details`. **401:** not logged in.

### POST /auth/change-password

- **Body:** `{ "currentPassword": string, "newPassword": string }`. The new password follows the sign-up rules (8–72 bytes, a letter and a number) and must differ from the current one.
- The new password is stored as a new bcrypt hash. Existing login tokens stay valid until they expire (there is no server-side token list).
- **200:** `{ "message": "Password updated" }`
- **400:** validation errors with `details`. A wrong current password is **400** with `{ "field": "currentPassword", "message": "Current password is incorrect" }`, not 401, because the browser treats any 401 as an expired session.
- **429:** more than 10 failed attempts per user in 15 minutes.

### GET /auth/me/summary

- **200 (parent):** `{ "role": "parent", "bookings": { "upcoming", "completed", "cancelled" }, "students": number }`
- **200 (tutor):** `{ "role": "tutor", "bookings": { "upcoming", "completed", "cancelled", "needsCompleting" }, "services": [{ "id", "name", "subject", "gradeBand", "durationMinutes", "priceCents", "isActive" }] }`. `needsCompleting` = confirmed sessions that have started and are not marked completed.
- "Completed" means marked by the tutor or already ended, the same rule the dashboards use. Only the caller's own data is counted.
- **401:** not logged in.

### GET /services

- **Query (optional):**
  - `subject` (one of the 9 subjects)
  - `grade` (whole number 6–12). Returns services whose grade band includes that grade: `grade=7` matches `6-8` and `6-12`.
- **200:** `Service[]` of **active** services only, sorted by subject then name. An empty array when nothing matches.
- **400:** invalid `subject` or `grade` value, with `details`.

### GET /services/:id

- **200:** `Service`
- **400:** malformed id → `{ "error": "Validation failed", "details": [{ "field": "id", "message": "Invalid id" }] }`
- **404:** `{ "error": "Service not found" }`. Also returned for **inactive** services.

### POST /bookings

- **Body:** `{ "serviceId": string, "studentFirstName": string, "studentGrade": number, "startTime": ISO string, "notes"?: string }`
- **Server-controlled fields** (not accepted from the client): `user` (from the token), `endTime`, `serviceSnapshot`, `originalStartTime`, `status`, `cancelledAt`, `rescheduleCount`, `lastRescheduledAt`
- **Booking rules (America/New_York):**
  - Mon–Fri 15:00–20:00 and Sat 09:00–15:00; the whole session must fit inside these hours
  - start on :00 or :30
  - at least 2 hours and at most 60 days ahead
  - no overlap with a confirmed booking for the same service
- **201:** `Booking`
- **400:** field validation or booking-rule failure, with `details` (for example `startTime: "Sessions must end by 8:00 PM ET on weekdays"`)
- **401:** not logged in
- **404:** service not found or inactive
- **409:** `{ "error": "That time is no longer available. Please choose another time." }`

### GET /bookings/mine

- **200:** `Booking[]` for the logged-in user only, sorted by `startTime` ascending. Includes all statuses. The client groups them into Upcoming, Completed, and Cancelled.
- **401:** not logged in

### GET /bookings/:id

- **200:** `Booking`
- **400:** malformed id
- **401:** not logged in
- **403:** `{ "error": "You do not have access to this booking" }`
- **404:** `{ "error": "Booking not found" }`

### PATCH /bookings/:id

- **Body:** at least one of `{ "startTime"?: ISO string, "notes"?: string }`. Any other field returns 400.
- **Rules:**
  - The booking must be `confirmed` and its **current** start must be more than 2 hours away.
  - A new `startTime` must pass all booking rules and must not overlap other confirmed bookings for the service. The booking's own time doesn't count as an overlap.
  - Duration comes from the snapshot.
  - If `startTime` changes: `endTime` is recalculated, `rescheduleCount` goes up by 1, and `lastRescheduledAt` is set to now.
- **200:** the updated `Booking`
- **400:** validation, no editable fields, or unknown fields
- **401 / 403 / 404:** as for GET
- **409:** slot taken, or `{ "error": "This booking can no longer be changed" }` (cancelled, or less than 2 hours away)

### POST /bookings/:id/cancel

- **Body:** none (an empty `{}` is fine)
- **Rules:** the booking must be `confirmed` and start more than 2 hours from now. Sets `status: "cancelled"` and `cancelledAt: now`. The booking is kept as history.
- **200:** the cancelled `Booking`
- **401 / 403 / 404:** as for GET
- **409:** `{ "error": "This booking is already cancelled" }` or `{ "error": "This booking can no longer be changed" }`

### POST /ai/recommend-service

- **Body:** `{ "need": string }`. Trimmed, 1–500 characters.
- **200:**
  ```json
  {
    "summary": "Based on what you described, these services may fit.",
    "recommendations": [
      { "serviceId": "665f...", "name": "Middle School Math Boost", "reason": "Focuses on fractions for grades 6–8." }
    ],
    "disclaimer": "Suggestions are informational. Review the service details before booking.",
    "source": "ai"
  }
  ```
  - `recommendations` holds 0–3 items. Every `serviceId` is verified to be an active service.
  - `source` is `"ai"` or `"fallback"` (keyword match when the provider is unavailable, times out, or returns invalid output).
  - No match returns an empty `recommendations` array with a helpful `summary`.
- **400:** empty or over 500 characters
- **401:** not logged in
- **429:** `{ "error": "You've reached the suggestion limit. Please try again later." }`
- The AI never creates bookings and never returns prices or availability. Users follow the link to the real service page.

## Rate limits

| Routes | Limit | Keyed by |
|---|---|---|
| /auth/register, /auth/login | 10 requests / 15 minutes (200 when `NODE_ENV=development`) | IP address |
| /ai/recommend-service | 5 / minute and 20 / day | User id |

Limits are kept in memory and reset when the server restarts. That's acceptable for a single-instance capstone deployment and is documented as a limitation.


## Roles (added Steps 33–38)

Every user has `role`: `"parent"` (everyone who signs up) or `"tutor"` (created only by `npm run seed:tutors`). The role is returned in `user` from register, login, and `/auth/me`, can never be changed, and is enforced on the server by `requireRole`:

| Route group | parent | tutor |
|---|---|---|
| POST /bookings, GET /bookings/mine, PATCH /bookings/:id, POST /bookings/:id/cancel | ✅ (own bookings) | 403 `Only parent accounts can do this` |
| GET /bookings/:id | ✅ own booking | ✅ sessions for their services; another tutor's → 403 |
| /students | ✅ own students | 403 |
| /tutor/* | 403 `Only tutor accounts can do this` | ✅ own services only |
| POST /ai/session-prep | ✅ own booking | ✅ their session |

### Saved students

- `Student`: `{ id, firstName, grade, createdAt }`. The parent link is never returned.
- `firstName` uses the same rules as a booking (letters, spaces, `-`, `'`; max 40); `grade` is 6–12.
- **409** for a duplicate first name for the same parent (case-insensitive) or more than 10 students.
- **403** for someone else's student, **404** unknown id, **400** for validation and unknown fields.
- Deleting a student never changes past bookings, which keep their own copy of the name and grade.

### Tutor sessions

- `GET /tutor/sessions` returns bookings for every service linked to the tutor's account, soonest first. The tutor comes from the token only.
- `POST /tutor/sessions/:id/complete` body `{ summary? }` (max 500):
  - 200: sets `completedAt` and `tutorSummary`; the parent sees both on the booking.
  - 409: the session hasn't started, is cancelled, or was already completed.
  - 403: another tutor's session. 400: unknown fields such as `status`.
- Bookings now include `completedAt` (null until marked) and `tutorSummary` (`""` until written).

### Booking overlap (changed)

A new or rescheduled booking must not overlap any **confirmed** booking for **any service taught by the same tutor** (one tutor can't be in two places). Services without a linked tutor account only check themselves.

### POST /ai/session-prep

- Body `{ bookingId }` only.
- **200** `{ tips: string[3..5], disclaimer }`. Built-in tips chosen by the service's subject; no AI is called, and the response has no `source` field.
- **400** invalid id. **403/404** not the booking's parent or tutor, or unknown. **409** the booking is cancelled.
- Requires login and the booking access check. It does not use the AI limits.
