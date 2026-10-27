# StudySlot — Final Capstone Audit

Audit date: 2026-10-26. Evidence comes from files in this repository, test runs on this date, and what the author reported from using the app locally. Items that depend on the deployed site are **Not Verified** until the production checklist in `docs/test-plan.md` (Section 7) is run. Update this file after deployment.

## Blocking issues (fix first)

None. The SDLC document is complete: test evidence, production checklist results and the author's own Section 13 are in place (2026-10-26).

## Checklist

| # | Item | Status | Evidence | Required action |
|---|---|---|---|---|
| 1 | React frontend works | Pass | 13 pages, 26 components; built and used locally by the author; 73 client tests pass; ESLint clean on the files linted this session | None. Confirmed by the production checklist on 2026-10-26 |
| 2 | Node and Express backend works | Pass | 201 of 201 server tests pass on 2026-10-26; 54-request Postman collection exists | None. Confirmed by the production checklist on 2026-10-26 |
| 3 | MongoDB integration works | Pass | Models for users, services, bookings, students; seed scripts; the app was used against Atlas locally | None. Confirmed by the production checklist on 2026-10-26 |
| 4 | Registration, login, protected actions, logout | Pass | `auth.test.js` (12 tests: register, duplicate, weak password, login, same 401 for wrong email or password, expired and forged tokens); `bookingAccess.test.js`; logout removes the stored token | None. Confirmed by the production checklist on 2026-10-26 |
| 5 | Services can be browsed and viewed | Pass | `services.test.js` (15 tests: list, filters, injection rejected, details, 404) | None. Confirmed by the production checklist on 2026-10-26 |
| 6 | Bookings can be created and managed | Pass | `createBooking.test.js`, `updateCancel.test.js`, `bookingRules.test.js`; 73 client tests for time slots and daylight saving | None. Confirmed by the production checklist on 2026-10-26 |
| 7 | Dashboard shows meaningful information | Pass (not unit tested) | Next session, stats, week view, saved students, tutor dashboard. An earlier blank-dashboard bug (accounts without a role) was fixed and covered by a test | None. Confirmed by the production checklist on 2026-10-26 |
| 8 | AI feature functional, visible, relevant, grounded | Pass | Grounding is tested (unknown ids dropped, names come from the database, injection markers stripped, fallback on failure). After the 2026-10-26 relevance fix (stricter prompt plus off-subject filter), cases M1–M6 passed on the deployed site, as reported by the author (`docs/test-plan.md` Section 6) | None |
| 9 | Three-tier architecture and separation of concerns | Pass | `docs/architecture.md`; routes → middleware → controllers → services → models; the browser never reaches the database or the AI provider | None |
| 10 | Validation, error handling, authentication, authorization | Pass | `foundation.test.js` (20), `roles.test.js` (20), `auth.test.js`, `cors.test.js`; `docs/security-review.md` (37 checks passed, 2 issues fixed) | None |
| 11 | UI professional and responsive | Pass | Bootstrap layout, light and dark themes, illustrations per service. Production checklist row 15 (phone-width layout) passed on 2026-10-26, as reported by the author; screenshots in `docs/screenshots/` | None |
| 12 | Core workflows have test evidence | Pass | `docs/test-plan.md` traces each user story to tests. The manual results tables are empty | Fill in the manual tables as you run them |
| 13 | Frontend, backend, and database deployed and connected | Pass | Live on 2026-10-26: app https://mystudyslot.netlify.app, API https://studyslot-attl.onrender.com, Atlas database `studyslot_prod`. All 18 production checklist rows passed, as reported by the author (`docs/test-plan.md` Section 7), including a booking stored in Atlas | None |
| 14 | At least 15 meaningful commits | Pass | 53 commits on `main` with descriptive messages, pushed to GitHub | None |
| 15 | README complete | Pass | README has all 21 sections, the live links, and five screenshots in `docs/screenshots/` | Re-check the links before submitting |
| 16 | SDLC documentation complete | Pass | SDLC document written and published as a Claude document; screenshots, test results (201 server, 73 client, Postman 54 requests and 102 assertions), production checklist results and the author's own AI-use section added on 2026-10-26 | Submit it in the format the course requires |
| 17 | Student can explain the main code and technical decisions | Not Verified | `docs/demo-prep.md` has the demo script and interview answers | Practice out loud; open the code files named in the answers |
| 18 | No secrets committed or exposed | Pass (scan on 2026-10-26) | `.env` files are untracked; only `.env.example` files are committed; no key or database-URI patterns in tracked files or in Git history | Rotate any key or password you have pasted into a chat. Use new production credentials (guide Section 1). Re-scan before submitting. |

## Summary

- Pass: 1–16 and 18
- Not Verified: 17

Remaining before submission: item 17 (practice the demo), rotating shared secrets, and submitting the SDLC document in the required format.
