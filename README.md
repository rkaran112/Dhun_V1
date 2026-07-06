# Dhun

A Letterboxd-style app for logging and rating albums you listen to, built with Next.js, Supabase, and the Spotify API.

## What it does

Dhun (internally referred to as "Musicd" in the UI) lets users search Spotify for albums, log them with a star rating and review text, and organize them into shelves (e.g. "listened", "want to listen"). Beyond basic logging, the app includes:

- **Home (`/`)** — Spotify album search, log-an-album flow, and a feed of recent activity.
- **Mainframe (`/mainframe`)** — an infinite-scrolling global or following-only feed of other users' logs, built with `@tanstack/react-query`'s `useInfiniteQuery`.
- **Logbook (`/logbook`)** — a diary-style, month-grouped view of a user's own logs with filtering.
- **Archives (`/archives`)** — drag-and-drop ranked lists (via `@dnd-kit`) and a "want to listen" shelf.
- **Diagnostics (`/diagnostics`)** — charts (rating distribution, genre breakdown, 12-month timeline) summarizing a user's listening habits.
- **Profile pages (`/[username]`)** — public profile view with shelf filtering.
- Spotify OAuth sign-in via Supabase Auth, with profile records auto-created/synced on first login.

## Tech stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **Styling/UI:** Tailwind CSS 4, shadcn-style components (`components/ui`), Radix-adjacent `@base-ui/react`, `lucide-react` icons
- **Data/auth:** Supabase (`@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`) for auth and Postgres-backed storage
- **External API:** Spotify Web API (client-credentials flow) for album search
- **State/data fetching:** `@tanstack/react-query`
- **Drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Validation:** `zod`
- **Testing:** Jest + Testing Library (unit), Playwright (e2e)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (read from `lib/spotify/service.ts` and `lib/supabase/*`; no `.env.example` is checked in, so create a `.env.local` yourself):
   ```
   SPOTIFY_CLIENT_ID=
   SPOTIFY_CLIENT_SECRET=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   Without these, the app still renders but Supabase-backed features return empty/no-op results and Spotify search will fail with a clear error message.
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Then open http://localhost:3000.

Other scripts (from `package.json`):
```bash
npm run build     # production build
npm run start     # run production build
npm run lint      # eslint
npm test          # jest unit tests
npm run test:e2e  # playwright e2e tests
```

## Status: Work in progress

The app is more built-out than a typical scaffold — most core screens (search, logging, feed, ranked lists, shelves, diagnostics, profile) have real implementations with Supabase queries, loading/error states, and unit + e2e tests. That said, it is not production-ready:

- **No database schema/migrations in the repo.** Code references Supabase tables (`profiles`, `logs`, `follows`, `ranked_lists`, `ranked_list_items`) and columns (e.g. `shelves`, `genre`) that must exist for any of this to work, but there is no SQL/migration file defining them anywhere in the repo — the schema is implicit and undocumented.
- **No `.env.example`** — required environment variables have to be inferred from source.
- Several data paths have an "E2E test mode" branch (checking `localStorage` for `MUSICD_E2E_TEST_USER`/`MUSICD_E2E_LOGS`) alongside the real Supabase path, which is useful for tests but adds branching that should eventually be isolated from production code.
- `components/log/album-search.tsx` has its own inline test-mode stub result, separate from the shared search flow — minor duplication.
- Server-side Supabase client (`lib/supabase/server.ts`) falls back to the anon key if `SUPABASE_SERVICE_ROLE_KEY` isn't set, which is a workable dev fallback but should not be relied on for anything requiring elevated privileges.
- No CI configuration was found in the repo (no `.github/workflows`), so lint/test/build are not automatically enforced.

In short: the frontend and API-route logic for the core features are implemented, but the project is missing the database schema and environment documentation needed to actually stand it up from a fresh clone.
