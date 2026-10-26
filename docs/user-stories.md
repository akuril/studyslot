# StudySlot — User Stories, Scope, and Acceptance Criteria

Approved: 2026-10-19

**Roles:** Guest (not logged in) · Parent (registered parent/guardian) · AI-assisted interaction.
No administrator role: the service catalog is managed by a seed script. (Update, Steps 33–38: tutors now have their own accounts, created by a seed script, not by sign-up. They are not admins.)

Priority: **M** = Must Have · **S** = Should Have · **O** = Optional

## Approved decisions

- The account holder is a **parent or guardian**. Bookings store only the student's **first name and grade (6–12)**.
- The AI recommendation feature **requires login**, so it can be rate-limited per user and protect the free-tier quota.
- Services show an **informational price** (no payment processing).
- **Booking hours:**
  - Mon–Fri 3:00–8:00 PM and Sat 9:00 AM–3:00 PM, **America/New_York**.
  - Start times on the hour or half hour.
  - At least 2 hours ahead, at most 60 days ahead.
  - Cancel or reschedule allowed until 2 hours before the start time.

## Guest visitor

| ID | Story | Acceptance criteria | Pri | Page | Endpoint | Model | Auth |
|---|---|---|---|---|---|---|---|
| G1 | As a guest, I want to see available tutoring services so that I know what StudySlot offers. | Active services listed with name, subject, grade band, duration, price. Loading and error states. Inactive services never appear. | M | /services | GET /api/services | Service | None |
| G2 | I want to filter by subject and grade band so that I only see services that fit my student. | Filters narrow the list. Empty state with "clear filters". Unknown filter values never reach MongoDB. | S | /services | GET /api/services?subject=&gradeBand= | Service | None |
| G3 | I want to see one service's full details so that I can decide whether to book. | Shows description, tutor display name, duration, price, grade band. Direct URL and refresh work. Invalid or unknown ID shows "Service not found". | M | /services/:id | GET /api/services/:id | Service | None |
| G4 | As a parent, I want to create an account so that I can book and manage sessions. | Name, email, password required (8+ characters, a letter and a number). Duplicate email gives a clear error. Email stored lowercase. Password stored only as a hash, never returned. Logged in after registering. Role cannot be set by the client. | M | /register | POST /api/auth/register | User | None |
| G5 | I want to log in so that I can reach my bookings. | Wrong email or wrong password gives the same generic message. Rate-limited. Redirects to the previous page or the dashboard. | M | /login | POST /api/auth/login | User | None |
| G6 | I want to be sent to login when I try to book so that I'm not left at a dead end. | "Book" while logged out goes to /login, then returns to the booking form. | M | /services/:id → /login | None | None | None |

## Registered parent

| ID | Story | Acceptance criteria | Pri | Page | Endpoint | Model | Auth |
|---|---|---|---|---|---|---|---|
| P1 | I want to stay logged in on refresh so that I don't keep signing in. | Session restored via /me with a brief loading state and no flash of the logged-out view. Expired or invalid token logs out cleanly. | M | All | GET /api/auth/me | User | Token |
| P2 | I want to log out so that nobody else on this device can see my bookings. | Protected pages then redirect to /login. Navbar shows Log in / Register. | M | Navbar | Defined in Step 17 | None | Yes |
| P3 | I want to book a session (service, student first name and grade, date and time) so that a session is reserved. | User derived from the token; any client userId ignored. Start time in the future and inside booking hours. No overlap with an active booking for the same service. Service active. Duration taken from the service. Grade 6–12. Notes optional, max 300 characters. Success shown only after the server confirms. No duplicate submission. | M | /services/:id/book | POST /api/bookings | Booking, Service | Yes |
| P4 | I want a dashboard of my sessions so that I know what's coming up. | Next session shown. Upcoming sorted soonest first. Past and cancelled grouped separately. Empty state links to /services. Only my bookings. | M | /dashboard | GET /api/bookings/mine | Booking | Yes |
| P5 | I want quick stats so that I can see things at a glance. | Upcoming count, "next session in X days", completed count, computed from the same data. | S | /dashboard | GET /api/bookings/mine | Booking | Yes |
| P6 | I want to open a booking so that I can see its full details. | Service, student, local date and time, status, notes. Another user's booking returns 403/404. Invalid ID shows "Booking not found". | M | /bookings/:id | GET /api/bookings/:id | Booking | Owner |
| P7 | I want to change the time or notes so that I can fix scheduling without rebooking. | Only start time and notes are editable. Same rules as booking. Cancelled or past bookings can't be edited. | M | /bookings/:id/edit | PATCH /api/bookings/:id | Booking | Owner |
| P8 | I want to cancel so that the slot is freed. | Confirmation step. Status becomes `cancelled` (kept as history). Slot becomes bookable again. No double-cancel. Past bookings can't be cancelled. | M | /bookings/:id | Defined in Step 14 | Booking | Owner |
| P9 | I want my data visible only to me so that my child's information stays private. | Postman proves user B gets 403/404 on user A's booking (GET, PATCH, cancel). Password hashes never returned. Only student first name and grade stored. | M | None | All booking routes | All | Yes |

## AI-assisted interaction

| ID | Story | Acceptance criteria | Pri | Page | Endpoint | Model | Auth |
|---|---|---|---|---|---|---|---|
| A1 | I want to describe my student's need in plain words so that I'm pointed to the right service. | Input max 500 characters with a counter. 1–3 recommendations, each a real active service verified on the server, with a reason and a link. Disclaimer shown. The AI never books, invents services or prices, or claims availability. | M | /find-help | POST /api/ai/recommend-service | Service (read) | Yes |
| A2 | I want a useful answer even when the AI is down so that the feature never dead-ends. | Timeout, provider error, quota limit, or invalid output gives a friendly message plus a labeled keyword-based fallback. No raw provider errors. | M | /find-help | Same | Service | Yes |
| A3 | I want the assistant to stay on topic so that it's safe for a family audience. | Off-topic or injection input gives "no match", not invented content. The form warns against personal details. Prompts are not stored or logged. | S | /find-help | Same | None | Yes |

## Non-functional requirements (Must)

- Responsive on phone, tablet, and desktop.
- Keyboard and screen-reader accessible: skip link, labels, 44px tap targets.
- Server-side validation of all input.
- No secrets in the client.
- Consistent JSON error format.
- Rate limits on auth and AI routes.
- Dates stored in UTC and displayed in the user's local time.

## Out of scope

Payments · email/SMS · chat · tutor availability calendars · tutor self sign-up · admin dashboard · password reset · student logins · multiple organizations · recurring bookings.

## New client pages

/services · /services/:id · /services/:id/book · /login · /register · /dashboard · /bookings/:id · /bookings/:id/edit · /find-help


## Added in Steps 33–38

| ID | Story | Acceptance criteria |
|---|---|---|
| P10 | As a parent, I want my own dashboard with my avatar, so I can see my week at a glance. | Greeting with initials avatar; stats; "Up next"; Monday–Saturday week view with previous/next; Upcoming, Completed, and Cancelled lists |
| P11 | As a parent, I want to save my students once, so booking is faster. | Add, edit, and remove (first name and grade 6–12); duplicates and an 11th student are refused; the booking form offers saved students that fit the service's grades; "Save … for next time" checkbox |
| P12 | As a parent, I want tips to prepare for a session. | An upcoming booking shows 3–5 built-in prep tips for its subject, loaded automatically. No AI is used, so they cost no tokens or AI allowance |
| P13 | As a parent, I want to see what the tutor covered. | The tutor's summary and completion time appear on the booking |
| T1 | As a tutor, I want to log in and see only my sessions. | `/tutor` dashboard: today, upcoming, and to-complete counts; week view; student first name, grade, and the parent's notes |
| T2 | As a tutor, I want to mark a session completed with a summary. | Available once the session starts; optional summary (max 500); can't complete twice, a cancelled session, or another tutor's session |
| T3 | As a tutor, I must not use parent features. | Parent pages redirect to `/tutor`; the API returns 403 |
| S1 | As the business, one tutor can't be double-booked. | Overlap is checked across all services taught by the same tutor |
