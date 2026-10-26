# StudySlot — Demonstration and Interview Preparation

Everything below is based on what this project actually does. Practice with the code open so you can show the file you mention.

## 1. Five-minute demo script

Open the live site a minute early so the free-tier server is awake. Have one parent account and one tutor account ready.

| Time | Do | Say |
|---|---|---|
| 0:00 | Home page | "StudySlot helps parents of grade 6–12 students find and book tutoring. Parents book; tutors run the sessions. It's React, Express, and MongoDB, deployed on Netlify, Render, and Atlas." |
| 0:30 | Services page, filter by Science and grade 7 | "39 active services. Filters are checked on the server too, so a made-up filter value never reaches the database." |
| 1:00 | Log in as the parent, open Find help, type "My 7th grader needs help with honors science work" | "This is the AI feature. It reads my description and the real catalog and picks matching services." |
| 1:45 | Point out the reasons and the disclaimer; open a suggested service | "The server only keeps services that exist in our catalog, and takes names and grades from the database, not from the model." |
| 2:15 | Book a session: pick a date and a time slot | "Times are offered in Eastern Time with daylight saving handled, at least 2 hours ahead. The server checks all of it again, and one tutor can't be booked twice at the same time." |
| 3:00 | Dashboard, then open the booking and show the prep tips | "Next session, stats, and a week view. The prep tips are built in, because the tips for a subject never change and AI would only waste tokens." |
| 3:30 | Reschedule, then cancel | "Only the owner can change a booking, and not within 2 hours of the start." |
| 4:00 | Log out; log in as the tutor and complete a session with a summary | "Tutors see only their own sessions. The parent then sees the summary. There's no admin role." |
| 4:30 | Show the repo test results | "201 server tests and 73 client tests. The tests use fakes, so they need no database or internet." |
| 4:50 | Close | "Next I'd add password reset, tutor availability, and automated browser tests." |

## 2. Two-minute architecture explanation

"StudySlot has three tiers. The React app runs in the browser and handles screens, forms, and instant feedback. It never talks to the database or the AI provider. It calls a REST API on Express over HTTPS, sending a login token in the Authorization header.

The Express API is layered. Routes decide which URL goes where, middleware handles login, roles, and rate limits, controllers read the request, and services hold the business rules: booking hours, overlap checks, and the AI logic. The server re-validates everything, because the browser can be bypassed.

The data tier is MongoDB Atlas with four collections: users, services, bookings, and students. A booking stores a snapshot of the service name and price so old bookings stay correct if the catalog changes.

Security is enforced on the server: passwords are hashed with bcrypt, tokens expire after a day, every booking route checks ownership, and CORS allows exactly one origin."

## 3. One-minute AI feature explanation

"A parent describes what their student needs. The server loads the active services for that grade and sends the description and catalog to a Groq model with a strict JSON format. The description is fenced as data so instructions inside it are ignored. When the answer comes back, the server throws away any service id that isn't in the catalog, fills in names from our database, and drops picks from subjects the parent never mentioned. If the AI is slow, down, or gives bad output, a keyword matcher takes over and the page says so. Each user is limited to 5 requests a minute and 20 a day. During testing the model once padded its answer with language classes for a science request, so I tightened the prompt and added that server-side filter, with tests."

## 4. Ten likely interview questions

**1. Why did you save a snapshot of the service inside each booking?**
Bookings are history. If a service is renamed, repriced, or deactivated later, an old booking should still show what the parent booked. I store the name and price at booking time and keep a reference to the service for lookups.

**2. How do you prevent double-booking?**
The server computes the end time from the service duration, never from the client. Before saving, it looks for any confirmed booking that overlaps the new time across every service taught by the same tutor, because one tutor can't be in two places. A conflict returns 409. The overlap logic is in `services/bookingRules.js` and covered by tests.

**3. How do you handle time zones and daylight saving?**
Business hours are defined in America/New_York. The client offers slots by converting an Eastern wall-clock time to a UTC moment, trying UTC-4 and UTC-5 and keeping the one that really shows that time in New York. Everything is stored in UTC and shown in the viewer's own time. Client tests cover summer, winter, the missing 2:30 AM on the spring-forward day, and different machine time zones.

**4. Walk me through authentication.**
Registration hashes the password with bcrypt (never stored or returned in plain text). Login returns a signed JWT that expires in a day. The client sends it as a Bearer token. Middleware verifies it and loads the user on every protected request, so a deleted user's token stops working. Wrong email and wrong password give the same 401 message, and login is rate-limited.

**5. Why a Bearer token in localStorage instead of cookies?**
Netlify and Render are different sites, and browsers increasingly block cross-site cookies. The token approach works reliably across them. The tradeoff is that an XSS attack could read the token, so I use React's escaping, avoid dangerous APIs, and set a strict Content-Security-Policy. I list it in the known limitations.

**6. How is authorization different from authentication?**
Authentication is who you are; authorization is what you may do. A booking route checks the booking's owner against the user from the token, ignoring any user id in the request. Roles (parent or tutor) come from the database, can't be sent at sign-up, and can't change. The server returns 403 for the wrong role. The client only hides links.

**7. How did you design the MongoDB schema?**
Users, services, bookings, and students, with references between them (a booking references its user and service). I used references because bookings are queried by user and by service and grow over time, while a few small fields are copied into the booking as a snapshot. Indexes support the real queries, such as the unique email and the booking overlap lookup.

**8. How is React state organized?**
Authentication is in one context so every page knows the user and token, and a protected-route component redirects when there's no user. Pages fetch their own data through an API layer, with loading, error, and empty states. Business rules like which time slots to offer live in plain functions in `utils/`, which is why I could unit test them without rendering components.

**9. How do you keep the AI safe?**
Minimum data is sent: the description, the grade, and the public catalog, with no names, emails, or bookings. The description is treated as data, output is validated against the catalog, and the server fills in the details. It requires login and is rate-limited, nothing is stored or logged, and a fallback keeps the app working when the AI fails. The AI can only suggest; it can't book or change anything.

**10. How did you test it, and what did testing catch?**
There are 201 server tests that run the whole API with fake database and AI parts, and 73 client unit tests for the time and validation logic. Testing and real use caught several issues: an old account without a role caused a blank dashboard, the AI padded results with unrelated subjects, and the prep tips wasted AI calls. Each fix has a test.

## 5. Topic-specific questions to be ready for

- **MongoDB modeling:** references vs embedding, why a snapshot, which indexes exist and why, how the 10-student limit is enforced.
- **API design:** resource-based URLs, correct status codes (400, 401, 403, 404, 409, 429), consistent error shape, why unknown body fields are rejected (mass assignment).
- **Authentication:** bcrypt cost, JWT contents and expiry, no revocation (known limitation).
- **Booking conflicts:** tutor-wide overlap, the 2-hour change rule, rescheduling to the same time doesn't count.
- **React state:** why context for auth, why logic lives in `utils/`.
- **AI safety:** prompt injection, grounding, fallback, quotas, privacy.
- **Testing:** what is faked and why, what is not covered (browser tests).
- **Deployment:** root directories, environment variables, CORS origin, health check, cold starts, why `VITE_` values are public.

## 6. Short portfolio description

StudySlot is a full-stack tutoring booking platform for grades 6–12. Parents browse 39 services, get AI-assisted recommendations, and book and manage sessions; tutors complete sessions with summaries. Built with React, Express, MongoDB Atlas, and Groq, with role-based access, Eastern Time booking rules, tutor-wide double-booking prevention, and a keyword fallback when the AI is unavailable. Covered by 274 automated tests and deployed on Netlify and Render.

(Keep "deployed on Netlify and Render" only after the production smoke test passes.)

## 7. Three CV bullets

- Built a full-stack tutoring booking platform (React, Node/Express, MongoDB Atlas) with JWT authentication, parent and tutor roles, and ownership checks on every booking route.
- Implemented booking rules in Eastern Time with daylight-saving handling and tutor-wide overlap prevention, backed by 201 server tests and 73 client unit tests.
- Designed a grounded AI recommendation feature (Groq) that validates model output against the real catalog, filters off-subject picks, rate-limits users, and falls back to keyword matching when the AI is unavailable.
