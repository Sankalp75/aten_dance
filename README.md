# ChillBro 🧡 — Hostel Attendance

A playful, offline-first hostel attendance web app. Students mark attendance from their own phones between **10:30–11:00 PM IST**; the warden monitors from the same app.

## Features

- Student login with 4-digit PIN; warden login with admin PIN
- Strict attendance window 10:30–11:00 PM IST with live countdown
- Offline-first: marks locally, syncs to Supabase when online
- Streaks, badges, leaderboard, mascot (ChillBro), confetti, playful copy
- Warden dashboard: present/absent counts, absence alerts (3+ consecutive), manual override
- CSV bulk student import; reset PIN; delete students
- Reports: daily absent list, per-student summary, CSV & PDF export
- PWA: installable, service worker for offline shell
- Web push reminder ready (requires Supabase Edge Function + VAPID keys)

## Run locally (demo mode)

No Supabase needed — runs with seeded demo students (PIN `1234`, admin PIN `1234`).

```bash
npm install
npm run dev
```

Demo students: `H001`..`H005`, PIN `1234`. Admin PIN `1234`.

## Connect Supabase (production)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. (Optional) insert an admin row: `insert into admins (username, pin) values ('warden','1234');`
4. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. `npm run dev` / `npm run build`.

## Deploy

Vercel: import the repo, set env vars, build command `npm run build`, output `dist`.

## Notes

- PINs are stored in plaintext for simplicity/offline verification. Hash them in production.
- Attendance window is evaluated on the client; the server records `marked_at` and you can add a DB check constraint / edge function to enforce strictly.
- Absence alerts trigger after 3 consecutive absent days.