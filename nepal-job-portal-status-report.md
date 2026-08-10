# NepJob — Project Status Report

_Last updated: as of the job detail page + apply modal build_

---

## 1. Overall Status

| Layer | Status |
|---|---|
| Backend (Phases 1-6) | ✅ Fully built and verified (Phase 5 confirmed via real UI testing; Phase 6 written, admin UI pending) |
| Frontend | 🟡 Auth, browsing, job detail, apply, and bookmark flows fully working and confirmed. Dashboards not started. |
| Email notifications (Phase 7) | ⬜ Not started |
| Polish + deploy (Phase 8) | ⬜ Not started |

You have a working, confirmed, end-to-end skeleton: a visitor can register, log in, browse/search jobs, view a job, bookmark it, and apply with a real resume upload — and all of that has now been tested for real, not just written. What's missing is everything role-specific *after* login — the dashboards where students and companies actually manage things, plus the admin panel.

**→ Next up: Stage A — Student Dashboard (see Section 5 below).**

---

## 2. Backend — what's built (Phases 1-6, all written)

### Phase 1 — Foundation
- Next.js + TypeScript + Tailwind project scaffolded
- MongoDB Atlas connected via `lib/db.ts` (cached connection pattern)
- `.env` holds `MONGODB_URI`, `AUTH_SECRET`, `CLOUDINARY_*` keys

### Phase 2 — Data models
All in `models/`: `User`, `StudentProfile`, `CompanyProfile`, `Job`, `Application`, `Bookmark`.
`scripts/seed.ts` populates fake data — safe to re-run anytime (wipes + recreates).

### Phase 3 — Jobs CRUD
`app/api/jobs/route.ts` (GET list, POST create) and `app/api/jobs/[id]/route.ts` (GET one, PATCH, DELETE). ✅ Fully tested via Postman.

### Phase 4 — Auth
- `app/api/register/route.ts` — hashes password, creates User + role profile
- `auth.config.ts` / `auth.ts` split — solves the Edge Runtime vs Node.js conflict (middleware can't run bcrypt/mongoose, so the edge-safe session config is separated from the Node-only login logic)
- `middleware.ts` — protects job-mutating API routes, protects page routes under `/dashboard`, redirects logged-in users away from `/login`/`/register`, supports `callbackUrl` redirect-after-login
- Ownership checks on Job `PATCH`/`DELETE` — a company can only edit/delete jobs it created
- ✅ Fully tested via Postman (register, login, session, ownership 401/403 cases)

### Phase 5 — Applications, Bookmarks, Resume Upload
- `app/api/upload/route.ts` — Cloudinary PDF upload, validates file type/size, requires login
- `app/api/applications/route.ts` — POST (student applies, blocks duplicates), GET (role-aware: student sees own, company sees applicants to their jobs)
- `app/api/applications/[id]/route.ts` — PATCH status (company only, ownership-checked through the job)
- `app/api/bookmarks/route.ts` — POST (toggle), GET (list own)
- 🟡 Written, was never separately tested via Postman — **currently being exercised for the first time through the frontend apply flow** (job detail page)

### Phase 6 — Admin + Search
- `app/api/admin/jobs/route.ts` — GET pending jobs (admin only)
- `app/api/admin/jobs/[id]/route.ts` — PATCH approve/reject/close (admin only)
- `app/api/admin/users/route.ts` — GET all users (admin only)
- `GET /api/jobs` upgraded with `search`, `category`, `location`, `jobType` query params, defaults to `status: "approved"` only
- 🟡 Written, not yet tested — no admin UI exists yet to exercise these routes

**Manual step still needed:** promote one seeded user to `role: "admin"` directly in MongoDB Atlas/Compass — required before the admin dashboard can be tested.

---

## 3. Frontend — what's built so far

- **Theming**: `context/ThemeContext.tsx` (light/dark, persisted to localStorage, SSR-safe), `components/ThemeToggle.tsx`. ⚠️ **Status unconfirmed** — a `globals.css` bug was found and fixed (broken `@theme` block was likely preventing custom colors from registering at all), but the toggle itself was never confirmed working after that fix. **Needs a real test.**
- **`components/Providers.tsx`** — wraps app in `SessionProvider` + `ThemeProvider`
- **`components/AuthLayout.tsx`** — split-panel layout used by login/register, with floating animated job-tag chips (positions were bugged/overlapping the logo, fixed with explicit placement + `pointer-events-none`)
- **`app/register/page.tsx`** — role toggle (student/company), calls `/api/register`
- **`app/login/page.tsx`** — calls Auth.js `signIn()`, supports `callbackUrl` redirect
- **`components/Navbar.tsx`** — role-aware links, mobile menu, hides on auth pages, theme toggle, logout
- **`app/page.tsx`** (homepage) — hero, functional search bar, featured jobs grid pulling from `/api/jobs`, skeleton loaders, empty state
- **`components/JobCard.tsx`** — reusable card used on homepage and `/jobs`
- **`app/jobs/page.tsx`** — search + filter bar (title, type, location, category), results grid, empty state
- **`app/jobs/[id]/page.tsx`** — job detail, bookmark toggle, apply modal (file upload + cover letter) → chains `/api/upload` then `/api/applications`. **This is the first real test of Phase 5's backend — result not yet confirmed.**

---

## 4. Things verified ✅ (all confirmed working)

- [x] **Theme toggle** — confirmed working after fixing a broken `@theme` block in `globals.css` (two self-referencing CSS variable lines were silently breaking the whole custom color registration)
- [x] **Bookmark toggle** — confirmed working, persists across refresh
- [x] **Apply flow end-to-end** — confirmed working after fixing a `.env` naming mismatch (`CLOUDINARY_API_KEY` vs whatever it was actually named in `.env`) that was causing `POST /api/upload` to fail with `"Must supply api_key"`. This is the same bug category as the earlier `MONGODB_URL`/`MONGODB_URI` mismatch — **lesson learned: always copy-paste `.env` variable names into code rather than retyping them.**
- [x] Promoted one seeded user to `role: "admin"` in MongoDB (logged out/in again afterward so the new role is reflected in the session — role is baked into the JWT at login time, changing the DB alone doesn't update an active session)

**Phase 5 is now fully confirmed end-to-end**, not just written. Phase 6 (admin) is still untested — no admin UI exists yet.

---

## 5. Frontend Plan — what's left, in order

### Stage A — Student Dashboard
1. `/dashboard/student` — profile page: view/edit phone, bio, skills, and **upload/replace resume** (reuses your existing `/api/upload` route)
2. `/dashboard/student/applications` — list of jobs applied to, with status badges (applied/reviewed/shortlisted/rejected), pulling from `GET /api/applications`
3. `/dashboard/student/bookmarks` — saved jobs list, pulling from `GET /api/bookmarks`

**Why first:** shortest path to fully confirming Phase 5 works end-to-end, since you'll finally see your own application/bookmark data reflected back.

### Stage B — Company Dashboard
1. `/dashboard/company` — profile page: edit company name, logo (Cloudinary), website, description
2. `/dashboard/company/jobs/new` — post a job form → `POST /api/jobs`
3. `/dashboard/company/jobs` — list of jobs this company posted, with status badges (pending/approved/rejected/closed), edit/delete buttons
4. `/dashboard/company/jobs/[id]/applicants` — list of students who applied to a specific job, resume download links, status-change dropdown → `PATCH /api/applications/[id]`

**Why second:** once this exists, you can post real jobs from the UI instead of relying only on seed data — makes everything after this more realistic to test.

### Stage C — Admin Dashboard
1. `/dashboard/admin` — stats overview (total users, total jobs, pending count) + pending jobs queue with approve/reject buttons
2. `/dashboard/admin/users` — table of all users, basic info

**Why third:** depends on Stage B existing (so there are real company-submitted pending jobs to actually approve/reject, not just seed data).

### Stage D — Phase 7: Email Notifications (backend, revisited from frontend side)
1. Resend or Nodemailer setup
2. Wire up: welcome email on register, application-received email to company, status-change email to student, job-approved email to company

### Stage E — Phase 8: Polish + Deploy
1. Toast notifications (react-hot-toast or sonner) — replace raw error text with proper toasts across all forms built so far
2. Empty/loading state pass — confirm every dashboard has a sensible empty state
3. README with setup instructions + screenshots
4. Deploy to Vercel + confirm MongoDB Atlas network access allows Vercel's IPs
5. Full end-to-end test on the live deployed URL

---

## 6. Suggested order of attack from here

1. ~~Confirm the 4 "things to verify"~~ — ✅ done
2. **Build Stage A (student dashboard) — start here now**
3. Build Stage B (company dashboard) — unlocks realistic testing for everything downstream
4. Build Stage C (admin dashboard) — closes the loop on Phase 6
5. Stage D (emails) and Stage E (polish/deploy) — final stretch

This keeps the same principle you've been using throughout: build the piece that lets you *prove* the layer beneath it actually works, rather than stacking more untested code on top.

---

## 7. Reminders for whoever picks this file up next

- Tech stack: Next.js 14+ (App Router, TS), MongoDB/Mongoose, Tailwind v4, Auth.js v5 (JWT), Cloudinary, Framer Motion
- `auth.config.ts` (edge-safe) vs `auth.ts` (Node-only, has the Credentials provider) — this split exists specifically to keep bcrypt/mongoose out of the Edge Runtime middleware bundle. Don't merge them back together.
- `.env` variable names are a recurring source of bugs in this project (`MONGODB_URL` vs `MONGODB_URI`, `CLOUDINARY_API_KEY` mismatch) — always copy-paste exact names between `.env` and the code that reads `process.env.X`.
- Dev server needs a restart after any `.env` change — hot reload doesn't pick these up.
- `scripts/seed.ts` is safe to re-run anytime (wipes + recreates fake data) — useful for resetting to a clean state while building dashboards.
