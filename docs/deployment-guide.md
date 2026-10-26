# StudySlot — Deployment Guide (Render + Netlify + MongoDB Atlas)

Prepared 2026-10-26. Platform steps were checked against the current Render and Netlify documentation on that date. Dashboards change, so if a button is named differently, follow the platform's own page (linked at the end).

Deploy in this order: **Atlas → Render (API) → Netlify (React) → set CORS → smoke test.** The API URL has to exist before the frontend is built, and the frontend URL has to exist before CORS is finished.

## 0. Readiness audit (platform-neutral)

Checked against the code on 2026-10-26.

| Item | Status | Evidence / action |
|---|---|---|
| Repository and branch | Pass | `origin` = `github.com/akuril/studyslot`, branch `main`, 39 commits |
| Uncommitted work | **Action** | Prep-tips change, recommender fix, client tests, `netlify.toml` and docs are not committed yet. Commit and push before deploying (Section 9). |
| Backend build / start | Pass | No build step. Install `npm install`, start `npm start` (runs `node src/server.js`) |
| Node version | **Action** | `engines` was `>=22.9.0` with no upper bound, which Render resolves to the newest Node. Fixed: `>=22.9.0 <25`. Also set `NODE_VERSION` on Render (Section 2). |
| Environment variables | Pass | Names listed in `server/.env.example` and `client/.env.example`. Server stops at startup with a clear message if one is missing. |
| `.gitignore` | Pass | Ignores `.env`, `.env.*`, `node_modules`, `dist`. Keeps `.env.example`. |
| Health endpoint | Pass | `GET /api/health`: 200 when the database is connected, 503 when it is not. Mounted before the rate limiter. |
| Backend uses `process.env.PORT` | Pass | `config.port` reads `PORT`; Render's default is 10000 |
| Frontend production build | **Check** | Run `npm run build` in `client/` and confirm it finishes (Section 3) |
| CORS origins | Pass | Single exact origin from `CLIENT_ORIGIN`, required when `NODE_ENV=production`. No wildcard. Auth uses the `Authorization` header, not cookies, so `credentials` is off. |
| SPA route rewrites | **Fixed** | `netlify.toml` now rewrites every path to `index.html` (status 200) |
| Security headers | Pass | `client/public/_headers` (CSP allows `https://*.onrender.com` for API calls) |
| Atlas Network Access | **Action** | Section 1 |
| Production database user | **Action** | Section 1 |
| AI provider key and model | **Action** | Groq key and `openai/gpt-oss-20b` entered on Render; checked in Section 2 |
| Rate limits and cost controls | Pass | Auth 10 / 15 min; AI 5 / minute and 20 / day per user; general API limit; AI is optional (keyword fallback). Prep tips no longer use the AI at all. |

Do not deploy until every **Action** row is done.

## 1. MongoDB Atlas

1. **Project and cluster.** In Atlas, open the project that holds your cluster (`devcluster`). A free M0 cluster is fine for this project.
2. **Separate production data.** Use a new database name in the production URI, for example `studyslot_prod`, so test bookings from development never mix with real ones. Atlas creates the database the first time the app writes to it.
3. **Dedicated database user.** *Database Access → Add New Database User.*
   - Username: `studyslot_prod_app`. Password: *Autogenerate Secure Password*, then copy it into a password manager.
   - Privileges: *Specific Privileges →* `readWrite` on the database `studyslot_prod` only. Do not use `Atlas admin` or `readWriteAnyDatabase`.
4. **Rotate anything exposed during development.** If a development password, JWT secret, or AI key was ever pasted into a chat, screenshot, or commit, replace it. For production, use a **new** database user, a **new** `JWT_SECRET`, and (if in doubt) a new AI key.
5. **Network Access.** *Network Access → Add IP Address.*
   - Preferred: open your Render service → **Connect → Outbound** and add the listed IP ranges (Atlas accepts CIDR notation). Render says these ranges are shared by all services in the region, so this limits access but is not private to you.
   - Simplest: `0.0.0.0/0` ("allow access from anywhere"). Free hosting can change outbound addresses, so this avoids surprise outages. **Tradeoff:** anyone on the internet can attempt a connection; only the long random password and the least-privilege user stand between them and your data. If you use it, make sure the production password is long and unique, and review the list when you finish the project.
6. **Indexes.** Mongoose creates the model indexes (including the booking overlap index) when the server starts; confirm it below. After the first deploy, open *Browse Collections → bookings → Indexes* and confirm they exist.
7. **Seed the production database** (Render's free plan has no shell, so do this from your computer):
   - In `server/.env`, temporarily change `MONGODB_URI` to the production URI (database `studyslot_prod`).
   - Run `npm run seed`, then `npm run seed:tutors` (the second needs `TUTOR_SEED_PASSWORD` set in `.env`).
   - Change `MONGODB_URI` back to the development value right away. Never paste the URI into chat or a commit.
8. **Test the production URI without printing it.** With the production URI in `server/.env`, run `npm run try:ai -- "help with fractions" 7`. It connects, reads the catalog, and prints only the result. If it connects, the URI works.
9. **Backups.** The free M0 tier has no automatic backups. Everything important is reproducible (services and tutors come from the seed scripts), and parent bookings are demo data. If you want a copy, use Compass → the collection → *Export Collection*.

## 2. Render: the Express API

Render's free plan sleeps a web service after 15 minutes without traffic, and the next request takes about a minute to wake it. That is normal; plan for it in the demo (open the site a minute early).

1. Push the repository to GitHub (Section 9).
2. Render dashboard → **New → Web Service** → connect GitHub and choose `studyslot`.
3. Settings:

   | Field | Value |
   |---|---|
   | Name | `studyslot-api` (the URL becomes `https://studyslot-api.onrender.com`; if taken, Render adds letters. Use whatever URL you get.) |
   | Language | Node |
   | Branch | `main` |
   | Root Directory | `server` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance type | Free |

   Commands run relative to the Root Directory, so do not write `server/` in them. Render only auto-deploys when a push changes files inside `server/`.
4. **Environment variables** (the service's **Environment** tab → *+ Add Environment Variable*):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `22` (this wins over every other way of choosing the version) |
   | `MONGODB_URI` | the production URI from Atlas, database `studyslot_prod` |
   | `JWT_SECRET` | new random value: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `1d` |
   | `CLIENT_ORIGIN` | for now `https://placeholder.invalid`; replace in Section 5 |
   | `AI_PROVIDER` | `groq` |
   | `AI_MODEL` | `openai/gpt-oss-20b` |
   | `AI_API_KEY` | your Groq key |

   Do not set `PORT` (Render supplies it) or `TUTOR_SEED_PASSWORD`. Saving offers three choices: *Save, rebuild, and deploy*, *Save and deploy*, or *Save only*.
5. **Health check path:** in the service's *Settings → Health Checks → Edit*, enter `/api/health`. Any 2xx or 3xx response counts as healthy and it must answer within 5 seconds. A new version only receives traffic after it passes, and a failed deploy leaves the old version running.
6. Click **Create Web Service**. Open the **Logs** tab and look for `StudySlot API listening on port … (production)`. If you see `Configuration error: missing required variables`, the log names the missing variable (never its value). If you see `Database connection failed`, recheck Atlas Network Access and the URI.
7. **Test the API directly** (replace the host; PowerShell or any terminal):

   ```
   curl https://YOUR-API.onrender.com/api/health
   curl "https://YOUR-API.onrender.com/api/services?grade=7"
   ```
   The first should return JSON with the database connected; the second a list of services. The first request after a sleep can take about a minute.
8. Then test register, login, a booking, and the AI endpoint with Postman. Create an environment with `baseUrl = https://YOUR-API.onrender.com/api` and run the collection in `server/postman/`. Everything should match your local results before you continue.
9. **Redeploys.** Each push to `main` that changes `server/` builds and deploys automatically. Changing an environment variable and choosing *Save and deploy* redeploys without a rebuild.

## 3. Build the frontend locally first

```
cd client
npm run build
```
It must finish without errors and create `client/dist/` (which is Git-ignored). Optionally run `npm run preview` and open the address it prints to check the built site.

## 4. Netlify: the React app

1. Netlify → **Add new project → Import an existing project → GitHub** → choose `studyslot`.
2. Build settings come from `netlify.toml` in the repository root, and that file wins over anything typed in the UI:

   | Setting | Value (from `netlify.toml`) |
   |---|---|
   | Base directory | `client` |
   | Build command | `npm run build` |
   | Publish directory | `dist` (relative to the base directory) |
   | Node | `NODE_VERSION = 22` |

   If the UI shows empty or different fields, leave them; the file applies.
3. **Environment variable** (*Project configuration → Environment variables → Add a variable*):

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://YOUR-API.onrender.com/api` (full Render URL **with** `/api`, no trailing slash) |

   `VITE_` variables are built into the public JavaScript. Never put a secret here: no database URI, JWT secret, or AI key. They belong only on Render. Changes to this variable need a new build (*Deploys → Trigger deploy*).
4. Click **Deploy**. Watch the **Deploy log** for `vite build` finishing and `Site is live`.
5. **SPA refresh.** The `[[redirects]]` rule in `netlify.toml` sends every path to `index.html` with status 200. Test it in Section 6.
6. **Branch and auto-deploys.** Production deploys from `main`; every push to `main` rebuilds the site. Other branches and pull requests get preview URLs, which the API will reject by CORS unless you add them (leave that off).
7. Note your Netlify address (for example `https://mystudyslot.netlify.app`). You can change the part before `.netlify.app` under *Project configuration → Domain management*.

## 5. Production CORS and URLs

The login token travels in the `Authorization` header and is stored in `localStorage`, so there are no cookies. That means `httpOnly`, `sameSite`, `secure`, and `credentials` settings do not apply, and the browser only needs the exact origin to be allowed.

1. On Render → *Environment*, set `CLIENT_ORIGIN` to the exact Netlify origin: `https://mystudyslot.netlify.app` (https, no path, no trailing slash).
2. Choose **Save and deploy**.
3. Confirm no wildcard exists anywhere (`grep -rn "origin: '\*'" server/src` should find nothing).
4. Confirm `client/public/_headers` still lists `https://*.onrender.com` under `connect-src`. If your API URL is not on onrender.com, edit it.

## 6. Production smoke test

Use a private browser window and the public Netlify URL. Run the full checklist in `docs/test-plan.md`, Section 7, and the AI cases in Section 6 of that file. In addition:

- **Cross-origin block:** open any other website (for example `https://example.com`), press F12, and in its Console run `fetch('https://YOUR-API.onrender.com/api/services')`. The browser should report a CORS error, and the server logs should show no matching request failure.
- **Cold start:** wait 15+ minutes, then load the site. The first API call may take about a minute; the page should show its loading state, then recover.
- **Provider failure:** temporarily clear `AI_API_KEY` on Render, redeploy, run an AI search, and confirm the keyword fallback appears. Restore the key.
- **Persistence:** create a booking, then confirm it exists in Atlas and remains after a Render redeploy.
- **Console and network:** F12 → Console shows no red errors; Network shows API calls to the Render URL with expected statuses.

Do not call the deployment complete while a core workflow fails.

## 7. Record your final links

| Item | URL |
|---|---|
| Frontend (Netlify) | |
| Backend (Render) | |
| Health check | `https://<backend>/api/health` |
| Repository | https://github.com/akuril/studyslot |

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Can't reach the StudySlot server" | `CLIENT_ORIGIN` does not exactly match the site address, or the API is asleep | Match the origin exactly (https, no trailing slash); wait a minute and retry |
| Pages 404 on refresh | `netlify.toml` not deployed or not at the repository root | Confirm it is in the repo root and trigger a deploy |
| Requests go to `/api` on the Netlify domain | `VITE_API_BASE_URL` not set when the build ran | Set it, then trigger a new deploy |
| Render build fails | Wrong Root Directory | Set Root Directory to `server` |
| `Database connection failed` in Render logs | Atlas Network Access or wrong URI or user | Re-check Section 1 |
| Everything works then fails after idle | Free tier sleep | Normal; first request wakes it |

## 9. Commit and push (before deploying)

Commit each finished milestone with an honest message. Suggested messages for the pending work:

1. `Make session prep tips built-in and remove AI calls from them`
2. `Tighten AI recommendations and drop off-subject picks`
3. `Add client unit tests with Vitest and a test plan`
4. `Add Netlify configuration and deployment guide`

Before each commit run `git status` and make sure no `.env` file or `node_modules` is listed.

## Sources

- Render: [Deploy a Node Express app](https://render.com/docs/deploy-node-express-app), [Monorepo support](https://render.com/docs/monorepo-support), [Node.js version](https://render.com/docs/node-version), [Health checks](https://render.com/docs/health-checks), [Environment variables](https://render.com/docs/configure-environment-variables), [Outbound IP addresses](https://render.com/docs/outbound-ip-addresses), [Free plan limits](https://render.com/docs/free)
- Netlify: [netlify.toml](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [Environment variables](https://docs.netlify.com/build/environment-variables/get-started/), [Monorepos](https://docs.netlify.com/build/configure-builds/monorepos/)
