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
| GET | /services | List active services (filterable) | No | 200 `Service[]` |
| GET | /services/:id | One active service | No | 200 `Service` |
| POST | /bookings | Create a booking | Yes | 201 `Booking` |
| GET | /bookings/mine | My bookings | Yes | 200 `Booking[]` |
| GET | /bookings/:id | One of my bookings | Yes, owner | 200 `Booking` |
| PATCH | /bookings/:id | Reschedule and/or edit notes | Yes, owner | 200 `Booking` |
| POST | /bookings/:id/cancel | Cancel (status → cancelled) | Yes, owner | 200 `Booking` |
| POST | /ai/recommend-service | AI service recommendation | Yes (rate-limited) | 200 recommendation |

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
| /auth/register, /auth/login | 10 requests / 15 minutes | IP address |
| /ai/recommend-service | 5 / minute and 20 / day | User id |

Limits are kept in memory and reset when the server restarts. That's acceptable for a single-instance capstone deployment and is documented as a limitation.
