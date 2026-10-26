# StudySlot — Final Capstone Audit

Audit date: 2026-10-26. Evidence comes from files in this repository, test runs on this date, and what the author reported from using the app locally. Items that depend on the deployed site are **Not Verified** until the production checklist in `docs/test-plan.md` (Section 7) is run. Update this file after deployment.

## Blocking issues (fix first)

1. **Production checks not recorded yet** (item 13). The site is live; the remaining checks are in `docs/test-plan.md` Section 7.
2. **Commits not pushed** (item 14). Run `git push` so GitHub matches what is deployed.
3. **AI relevance fix not re-tested with the real model** (item 8).
4. **SDLC document not delivered** (item 16): delivered as a document in this session; it needs the evidence only you can add.

## Checklist

| # | Item | Status | Evidence | Required action |
|---|---|---|---|---|
| 1 | React frontend works | Pass (local) | 13 pages, 26 components; built and used locally by the author; 52 client tests pass; ESLint clean on the files linted this session | Confirm on the deployed site (production checklist) |
| 2 | Node and Express backend works | Pass (local) | 185 of 185 server tests pass on 2026-10-26; 54-request Postman collection exists | Run Postman against the Render URL |
| 3 | MongoDB integration works | Pass (local) | Models for users, services, bookings, students; seed scripts; the app was used against Atlas locally | Confirm in production: a booking appears in Atlas and survives a redeploy |
| 4 | Registration, login, protected actions, logout | Pass (local) | `auth.test.js` (12 tests: register, duplicate, weak password, login, same 401 for wrong email or password, expired and forged tokens); `bookingAccess.test.js`; logout removes the stored token | Run production checklist rows 2, 3, 10, 14 |
| 5 | Services can be browsed and viewed | Pass (local) | `services.test.js` (15 tests: list, filters, injection rejected, details, 404) | Production checklist rows 4–5 |
| 6 | Bookings can be created and managed | Pass (local) | `createBooking.test.js`, `updateCancel.test.js`, `bookingRules.test.js`; 52 client tests for time slots and daylight saving | Production checklist rows 7, 9 |
| 7 | Dashboard shows meaningful information | Pass (local), not unit tested | Next session, stats, week view, saved students, tutor dashboard. An earlier blank-dashboard bug (accounts without a role) was fixed and covered by a test | Production checklist row 7; add a screenshot |
| 8 | AI feature functional, visible, relevant, grounded | **Needs Work** | Grounding is tested (unknown ids dropped, names come from the database, injection markers stripped, fallback on failure). On 2026-10-26 a real search returned irrelevant language services. Fixed with a stricter prompt and an off-subject filter, covered by tests, but not yet run against the real model | Re-run cases M1–M6 in `docs/test-plan.md` Section 6 and record results |
| 9 | Three-tier architecture and separation of concerns | Pass | `docs/architecture.md`; routes → middleware → controllers → services → models; the browser never reaches the database or the AI provider | None |
| 10 | Validation, error handling, authentication, authorization | Pass | `foundation.test.js` (20), `roles.test.js` (20), `auth.test.js`, `cors.test.js`; `docs/security-review.md` (37 checks passed, 2 issues fixed) | None |
| 11 | UI professional and responsive | Not Verified | Bootstrap layout, light and dark themes, illustrations per service. No phone-width test recorded | Run production checklist row 15 on a phone and attach screenshots |
| 12 | Core workflows have test evidence | Pass | `docs/test-plan.md` traces each user story to tests. The manual results tables are empty | Fill in the manual tables as you run them |
| 13 | Frontend, backend, and database deployed and connected | **Pass (partial)** | Live on 2026-10-26: app https://mystudyslot.netlify.app, API https://studyslot-attl.onrender.com, production Atlas database `studyslot_prod`. The services page loads 39 active services from the production API, and the author logged in as seeded tutors on the live site | Finish the production checklist (`docs/test-plan.md` Section 7): booking persists in Atlas and survives a redeploy; record results |
| 14 | At least 15 meaningful commits | Pass (local) | 45 commits on `main` with descriptive messages | Push to GitHub |
| 15 | README complete | Pass | README has all 21 sections, the live links, and five screenshots in `docs/screenshots/` | Re-check the links before submitting |
| 16 | SDLC documentation complete | Needs Work | Written as a document; evidence sections are placeholders | Add screenshots, Postman and checklist results, final links |
| 17 | Student can explain the main code and technical decisions | Not Verified | `docs/demo-prep.md` has the demo script and interview answers | Practice out loud; open the code files named in the answers |
| 18 | No secrets committed or exposed | Pass (scan on 2026-10-26) | `.env` files are untracked; only `.env.example` files are committed; no key or database-URI patterns in tracked files or in Git history | Rotate any key or password you have pasted into a chat. Use new production credentials (guide Section 1). Re-scan before submitting. |

## Summary

- Pass: 9, 10, 12, 14 (once pushed), 18, and the local parts of 1–7
- Needs Work: 8, 16
- Partial: 13
- Not Verified: 11, 17

Do not mark the project complete until items 8, 11, and 13 are Pass.
